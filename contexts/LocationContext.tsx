/**
 * LocationContext
 * 전역 위치 추적 및 WebSocket 관리
 *
 * 📍 위치 추적 전략:
 * - 포그라운드: watchPositionAsync (2초, 10m) ← 모든 환경에서 작동
 * - 백그라운드: startLocationUpdatesAsync (15초, 10m) + TaskManager ← Dev Build만 작동
 *
 * 📡 위치 전송 전략:
 * - 포그라운드: setInterval (2초 주기) → sendLocationUpdate() → WebSocket/HTTP
 * - 백그라운드: TaskManager 콜백 (15초 주기) → sendLocationUpdate() → WebSocket/HTTP
 *
 * ⚠️ Expo Go 제한사항 (공식 문서):
 * - watchPositionAsync는 포그라운드 전용 API (백그라운드에서 자동 중지됨)
 * - Android/iOS 모두 백그라운드 Task 완전히 불가능
 * - 백그라운드 위치 추적을 위해서는 Development Build 또는 Production Build 필수!
 *
 * 📚 참고: https://docs.expo.dev/versions/latest/sdk/location/
 */

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import * as Location from 'expo-location';
import { Alert, AppState, AppStateStatus, Linking } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { websocketService } from '../services/websocketService';
import { startBackgroundLocationTracking, stopBackgroundLocationTracking } from '../services/backgroundLocationService';
import { sendLocationUpdate } from '../services/locationTransport';
import { geofenceService } from '../services/geofenceService';
import type { GeofenceItem } from '../types/api';
import Global from '@/constants/Global';

// 위치 데이터 타입
export interface RealTimeLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  speed?: number;
  heading?: number;
}

// Context 상태 타입
interface LocationContextState {
  // 위치 추적 상태
  isTracking: boolean;
  currentLocation: RealTimeLocation | null;
  locationHistory: RealTimeLocation[];
  error: string | null;
  isLoading: boolean;

  // WebSocket 상태
  isWebSocketConnected: boolean;

  // 보호자용: 이용자 위치
  targetLocation: RealTimeLocation | null;

  // 지오펜스 상태
  geofences: GeofenceItem[];
  loadGeofences: () => Promise<void>;

  // 함수
  startTracking: () => Promise<void>;
  stopTracking: () => Promise<void>;
  connectWebSocket: () => void;
  disconnectWebSocket: () => Promise<void>;
  setSupporterTarget: (targetNumber: string) => void;
}

// Context 생성
const LocationContext = createContext<LocationContextState | undefined>(undefined);

// Provider Props
interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<RealTimeLocation | null>(null);
  const [locationHistory, setLocationHistory] = useState<RealTimeLocation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [targetLocation, setTargetLocation] = useState<RealTimeLocation | null>(null);
  const [geofences, setGeofences] = useState<GeofenceItem[]>([]);
  const [lastGeofenceCheck, setLastGeofenceCheck] = useState<{ [key: number]: boolean }>({});

  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const websocketSendInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const stopTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accelerometerSubscription = useRef<{ remove: () => void } | null>(null);
  const supporterTargetRef = useRef<string | null>(null);
  const currentLocationRef = useRef<RealTimeLocation | null>(null);

  /**
   * 위치 업데이트 공통 처리 함수
   * watchPositionAsync 콜백에서 호출됨
   *
   * ⚠️ 주의: watchPositionAsync는 포그라운드 전용!
   * 백그라운드에서는 이 함수가 호출되지 않습니다.
   */
  const handleLocationUpdate = async (newLocation: Location.LocationObject) => {
    const realTimeLocation: RealTimeLocation = {
      latitude: newLocation.coords.latitude,
      longitude: newLocation.coords.longitude,
      accuracy: newLocation.coords.accuracy || 0,
      timestamp: newLocation.timestamp,
      speed: newLocation.coords.speed || undefined,
      heading: newLocation.coords.heading || undefined,
    };

    // State 업데이트
    setCurrentLocation(realTimeLocation);
    setLocationHistory(prev => [...prev.slice(-19), realTimeLocation]);

    console.log('📍 위치 업데이트 (포그라운드):', realTimeLocation);

    // 위치 전송은 별도 setInterval이 담당 (중복 방지)
  };

  /**
   * 위치 추적 시작
   */
  const startTracking = async () => {
    try {
      setIsLoading(true);

      if (!Global.NUMBER) {
        const loginRequiredMessage = '로그인 후 위치 추적을 시작할 수 있습니다.';
        console.warn('⚠️ 사용자 번호가 없어 위치 추적을 시작할 수 없음');
        setError(loginRequiredMessage);
        setIsLoading(false);
        return;
      }

      if (isTracking) {
        console.log('ℹ️ 이미 위치 추적 중');
        setIsLoading(false);
        return;
      }

      // 권한 확인 및 요청 (iOS 안전 처리)
      let status: string = 'undetermined';

      try {
        const permissionResult = await Location.getForegroundPermissionsAsync();
        status = permissionResult.status;
        console.log('📍 초기 권한 상태:', status);
      } catch (permError) {
        console.error('📍 권한 확인 실패:', permError);
        // iOS에서 권한 확인 실패 시 바로 요청 시도
      }

      if (status !== 'granted') {
        console.log('📍 권한 요청 중...');
        try {
          const result = await Location.requestForegroundPermissionsAsync();
          status = result.status;
          console.log('📍 권한 요청 결과:', status);
        } catch (reqError) {
          console.error('📍 권한 요청 실패:', reqError);
          setError('위치 권한을 요청할 수 없습니다. 설정에서 직접 권한을 허용해주세요.');
          setIsLoading(false);
          return;
        }
      }

      if (status !== 'granted') {
        setError('지도 표시를 위해 위치 권한이 필요합니다. 설정에서 권한을 허용해주세요.');
        setIsLoading(false);
        return;
      }

      // 백그라운드 권한 확인 (이용자만)
      if (Global.USER_ROLE === 'user') {
        try {
          let { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();
          if (backgroundStatus !== 'granted') {
            const requestResult = await Location.requestBackgroundPermissionsAsync();
            backgroundStatus = requestResult.status;
          }

          if (backgroundStatus !== 'granted') {
            Alert.alert(
              '백그라운드 권한 필요',
              '백그라운드에서도 안전하게 위치를 전송하려면 설정에서 "위치 → 항상 허용"으로 변경해 주세요.',
              [
                { text: '나중에', style: 'cancel' },
                { text: '설정 열기', onPress: () => Linking.openSettings() },
              ],
              { cancelable: true }
            );
            console.warn('⚠️ 백그라운드 권한이 없어 포그라운드에서만 위치 전송 가능');
          }
        } catch (bgError) {
          console.warn('⚠️ 백그라운드 권한 요청 실패 (Expo Go 제한):', bgError);
        }
      }

      // 초기 위치 가져오기 (실패해도 계속 진행)
      try {
        const initialLocation = await Location.getLastKnownPositionAsync();
        if (initialLocation) {
          const realTimeLocation: RealTimeLocation = {
            latitude: initialLocation.coords.latitude,
            longitude: initialLocation.coords.longitude,
            accuracy: initialLocation.coords.accuracy || 0,
            timestamp: initialLocation.timestamp,
            speed: initialLocation.coords.speed || undefined,
            heading: initialLocation.coords.heading || undefined,
          };
          setCurrentLocation(realTimeLocation);
          setLocationHistory([realTimeLocation]);
          console.log('📍 초기 위치 설정:', realTimeLocation);
        }
      } catch (lastKnownError) {
        console.warn('📍 마지막 위치 가져오기 실패, 실시간 추적으로 진행:', lastKnownError);
      }

      // 실시간 위치 추적 시작
      console.log('📍 실시간 위치 추적 시작');
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2000, // 2초마다 업데이트
          distanceInterval: 10, // 10미터 이동 시 업데이트
        },
        handleLocationUpdate // 공통 핸들러 사용
      );

      locationSubscription.current = subscription;
      setIsTracking(true);
      setError(null);
      setIsLoading(false);

      // 백그라운드 위치 추적은 앱이 백그라운드로 갈 때 시작됨
      // (포그라운드에서는 watchPositionAsync만 사용)

      // 움직임 감지 시작 (배터리 최적화) - 이용자만
      if (Global.USER_ROLE === 'user') {
        try {
          setupMovementDetection();
          console.log('✅ 배터리 최적화: 움직임 감지 시작');
        } catch (error) {
          console.warn('⚠️ 움직임 감지 설정 실패:', error);
        }
      }

      console.log('✅ 위치 추적 시작 완료');
    } catch (err) {
      console.error('❌ 위치 추적 시작 실패:', err);
      setError('위치 추적 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  /**
   * 위치 추적 중지
   */
  const stopTracking = async () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
      setIsTracking(false);
      console.log('📍 위치 추적 중지');
    }

    // 백그라운드 위치 추적도 중지
    await stopBackgroundLocationTracking();

    // 움직임 감지 타이머 정리
    if (stopTimeout.current) {
      clearTimeout(stopTimeout.current);
      stopTimeout.current = null;
    }

    // Accelerometer 구독 해제
    if (accelerometerSubscription.current) {
      accelerometerSubscription.current.remove();
      accelerometerSubscription.current = null;
    }
  };

  /**
   * 움직임 감지 설정 (배터리 최적화)
   * 백그라운드에서만 작동 - 포그라운드에서는 watchPositionAsync가 작동 중
   */
  const setupMovementDetection = () => {
    Accelerometer.setUpdateInterval(1000); // 1초 간격
    const subscription = Accelerometer.addListener(accelerometerData => {
      const { x, y, z } = accelerometerData;
      const magnitude = Math.sqrt(x * x + y * y + z * z);

      // 포그라운드에서는 움직임 감지 무시 (watchPositionAsync가 작동 중)
      const isBackground = appState.current.match(/inactive|background/);
      if (!isBackground) {
        return;
      }

      if (magnitude > 1.1) { // 움직임 감지
        if (stopTimeout.current) {
          clearTimeout(stopTimeout.current);
          stopTimeout.current = null;
          console.log('📱 움직임 감지됨, 위치 추적 중지 타이머 취소');
        }
        // 백그라운드 상태에서만 백그라운드 위치 추적 재시작
        if (Global.USER_ROLE === 'user') {
          startBackgroundLocationTracking().then(started => {
            if (started) {
              console.log('✅ 움직임 감지: 백그라운드 위치 추적 활성화');
            }
          });
        }
      } else { // 움직임 없음
        if (!stopTimeout.current) {
          console.log('📱 움직임 없음, 10분 후 위치 추적 중지 예약');
          stopTimeout.current = setTimeout(() => {
            if (Global.USER_ROLE === 'user') {
              stopBackgroundLocationTracking().then(() => {
                console.log('⏸️ 배터리 절약: 백그라운드 위치 추적 중지');
              });
            }
            stopTimeout.current = null;
          }, 600000); // 10분
        }
      }
    });

    accelerometerSubscription.current = subscription;
  };

  const subscribeToSupporterTarget = (targetNumber: string) => {
    websocketService.subscribeToUserLocation(targetNumber, (locationData) => {
      console.log('📍 이용자 위치 업데이트:', locationData);
      setTargetLocation({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: 0,
        timestamp: locationData.timestamp || Date.now(),
      });
    });
  };

  const clearSupporterTarget = () => {
    if (supporterTargetRef.current) {
      websocketService.unsubscribeFromUserLocation(supporterTargetRef.current);
      supporterTargetRef.current = null;
    }
    Global.TARGET_NUMBER = '';
    Global.TARGET_RELATION = '';
    setTargetLocation(null);
  };

  /**
   * WebSocket 연결
   */
  const connectWebSocket = () => {
    if (!Global.NUMBER) {
      console.warn('⚠️ 사용자 번호가 없어 WebSocket 연결 불가');
      return;
    }

    console.log('🔌 WebSocket 연결 시작...');
    websocketService.connect(Global.NUMBER, (connected) => {
      setIsWebSocketConnected(connected);
      if (connected) {
        console.log('✅ WebSocket 연결됨');

        // 보호자인 경우 이용자 위치 구독
        if (Global.USER_ROLE === 'supporter' && supporterTargetRef.current) {
          console.log(`👥 보호자 모드: ${supporterTargetRef.current}의 위치 구독 시작`);
          subscribeToSupporterTarget(supporterTargetRef.current);
        }
      } else {
        console.log('❌ WebSocket 연결 실패');
      }
    });
  };

  /**
   * WebSocket 연결 해제
   */
  const disconnectWebSocket = async () => {
    console.log('🔌 WebSocket 연결 해제');
    clearSupporterTarget();
    await websocketService.disconnect();
    setIsWebSocketConnected(false);
  };

  const setSupporterTarget = (targetNumber: string) => {
    if (Global.USER_ROLE !== 'supporter') {
      console.warn('⚠️ 보호자 역할이 아니어서 이용자 구독을 설정할 수 없음');
      return;
    }
    if (supporterTargetRef.current === targetNumber) {
      return;
    }
    if (supporterTargetRef.current) {
      websocketService.unsubscribeFromUserLocation(supporterTargetRef.current);
    }
    supporterTargetRef.current = targetNumber;
    Global.TARGET_NUMBER = targetNumber;
    setTargetLocation(null);
    if (isWebSocketConnected) {
      console.log(`👥 보호자 모드: ${targetNumber}의 위치 구독 시작`);
      subscribeToSupporterTarget(targetNumber);
    } else {
      connectWebSocket();
    }
  };

  /**
   * 지오펜스 목록 로드
   */
  const loadGeofences = useCallback(async () => {
    if (Global.USER_ROLE !== 'user') {
      console.log('ℹ️ 지오펜스는 이용자 모드에서만 로드됨');
      return;
    }

    try {
      const data = await geofenceService.getList();
      setGeofences(data);
      console.log('✅ 지오펜스 목록 로드 성공:', data.length);
    } catch (error) {
      console.error('❌ 지오펜스 목록 로드 실패:', error);
    }
  }, []);

  /**
   * currentLocation을 ref에 동기화 (의존성 문제 해결)
   */
  useEffect(() => {
    currentLocationRef.current = currentLocation;
  }, [currentLocation]);

  /**
   * WebSocket으로 위치 전송 (이용자만)
   * 포그라운드 상태에서만 작동 (백그라운드는 Task가 담당)
   */
  useEffect(() => {
    if (Global.USER_ROLE !== 'user') return;
    if (!isTracking) return;

    // 백그라운드 상태면 포그라운드 전송 중지
    if (appState.current !== 'active') {
      console.log('📱 백그라운드 상태: 포그라운드 전송 중지 (Task가 담당)');
      return;
    }

    const sendNow = async () => {
      const location = currentLocationRef.current;
      if (!location) return;

      console.log('📡 포그라운드: 위치 전송 시도');
      const result = await sendLocationUpdate({
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: location.timestamp,
      });
      if (!result.ok) {
        console.warn('⚠️ 포그라운드 위치 전송 실패:', result.reason);
      }
    };

    // 즉시 전송
    sendNow();

    // 2초마다 전송
    websocketSendInterval.current = setInterval(() => {
      sendNow();
    }, 2000);

    return () => {
      if (websocketSendInterval.current) {
        clearInterval(websocketSendInterval.current);
        websocketSendInterval.current = null;
      }
    };
  }, [isTracking]); // currentLocation 제거 - ref 사용

  /**
   * AppState 변경 감지 (포그라운드/백그라운드)
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      try {
        if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
          console.log('📱 앱이 포그라운드로 돌아옴');

          // 백그라운드 Task 중지
          if (Global.USER_ROLE === 'user') {
            try {
              await stopBackgroundLocationTracking();
              console.log('⏸️ 백그라운드 Task 중지 (포그라운드 watchPositionAsync 사용)');
            } catch (error) {
              console.error('❌ 백그라운드 Task 중지 실패:', error);
            }
          }

          // watchPositionAsync 무조건 재시작 (포그라운드 복귀 시)
          console.log(`🔍 watchPositionAsync 이전 상태: ${locationSubscription.current ? '실행 중' : '중지됨'}`);

          try {
            // 기존 구독이 있으면 먼저 정리
            if (locationSubscription.current) {
              console.log('🔄 기존 watchPositionAsync 중지...');
              try {
                locationSubscription.current.remove();
              } catch (removeError) {
                console.warn('⚠️ 기존 구독 제거 실패 (무시):', removeError);
              }
              locationSubscription.current = null;
            }

            // 새로 시작
            console.log('🔄 watchPositionAsync 새로 시작...');
            const sub = await Location.watchPositionAsync(
              {
                accuracy: Location.Accuracy.High,
                timeInterval: 2000,
                distanceInterval: 10,
              },
              handleLocationUpdate // 공통 핸들러 사용
            );
            locationSubscription.current = sub;
            console.log('✅ 포그라운드 watchPositionAsync 시작 완료');
          } catch (error) {
            console.error('❌ watchPositionAsync 시작 실패:', error);
          }

          // WebSocket 재연결 (연결되어 있지 않을 때만)
          if (Global.NUMBER) {
            const isConnected = websocketService.isConnected();
            console.log(`🔍 WebSocket 연결 상태: ${isConnected ? '연결됨' : '끊어짐'}`);

            if (!isConnected) {
              console.log('🔄 WebSocket 재연결 시도 (포그라운드 복귀)');
              try {
                connectWebSocket();
              } catch (error) {
                console.error('❌ WebSocket 재연결 실패:', error);
              }
            } else {
              console.log('ℹ️ WebSocket이 이미 연결되어 있으므로 재연결 생략');
            }
          }

          // 위치 전송 setInterval 재시작 (이용자만)
          if (Global.USER_ROLE === 'user' && isTracking) {
            // 기존 interval이 있으면 정리
            if (websocketSendInterval.current) {
              clearInterval(websocketSendInterval.current);
              websocketSendInterval.current = null;
            }

            // 즉시 한 번 전송
            const sendNow = async () => {
              const location = currentLocationRef.current;
              if (!location) return;

              console.log('📡 포그라운드: 위치 전송 시도');
              const result = await sendLocationUpdate({
                latitude: location.latitude,
                longitude: location.longitude,
                timestamp: location.timestamp,
              });
              if (!result.ok) {
                console.warn('⚠️ 포그라운드 위치 전송 실패:', result.reason);
              }
            };

            sendNow();

            // 2초마다 전송
            websocketSendInterval.current = setInterval(() => {
              sendNow();
            }, 2000);

            console.log('✅ 포그라운드 위치 전송 재개 (2초 주기)');
          }

        } else if (nextAppState === 'inactive' || nextAppState === 'background') {
          // inactive 또는 background 상태 (둘 다 처리)
          const stateLabel = nextAppState === 'inactive' ? 'inactive' : 'background';
          console.log(`📱 앱이 ${stateLabel} 상태로 전환`);

          // 포그라운드 setInterval 중지
          if (websocketSendInterval.current) {
            clearInterval(websocketSendInterval.current);
            websocketSendInterval.current = null;
            console.log('⏸️ 포그라운드 위치 전송 중지');
          }

          // watchPositionAsync 중지 (백그라운드에서는 어차피 작동 안 함)
          if (locationSubscription.current) {
            try {
              locationSubscription.current.remove();
              locationSubscription.current = null;
              console.log('⏸️ watchPositionAsync 중지 (백그라운드에서 자동 멈춤)');
            } catch (error) {
              console.warn('⚠️ watchPositionAsync 중지 실패 (무시):', error);
            }
          }

          // 백그라운드 Task 시작 (Development Build에서만 작동)
          if (Global.USER_ROLE === 'user') {
            try {
              const started = await startBackgroundLocationTracking();
              if (started) {
                console.log('✅ 백그라운드 Task 시작 (15초 주기, WebSocket/HTTP 전송)');
              } else {
                console.warn('⚠️ Expo Go 제한: 백그라운드 위치 추적 불가능');
                console.warn('   → Development Build 또는 Production Build 필요');
              }
            } catch (error: any) {
              console.warn('⚠️ 백그라운드 Task 시작 실패 (Expo Go 제한)');
            }
          }
        }
      } catch (error) {
        console.error('❌ AppState 변경 처리 중 오류:', error);
      } finally {
        appState.current = nextAppState;
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isWebSocketConnected]);

  /**
   * 지오펜스 진입 감지 (user role만, 항상 실행)
   */
  useEffect(() => {
    if (Global.USER_ROLE !== 'user' || geofences.length === 0) {
      return;
    }

    // Haversine 공식으로 거리 계산 (미터 단위)
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371000; // 지구 반지름 (미터)
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const checkGeofenceEntry = async () => {
      const location = currentLocationRef.current;
      if (!location) return;

      const currentLat = location.latitude;
      const currentLng = location.longitude;
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      // 시간 체크 헬퍼 함수
      const isWithinTimeRange = (startTime: string | null, endTime: string | null): boolean => {
        if (!startTime || !endTime) return true; // 시간 미설정 시 항상 활성

        const [currentHour, currentMin] = currentTime.split(':').map(Number);
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);

        const currentMinutes = currentHour * 60 + currentMin;
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        // 자정을 넘는 경우 (예: 23:00 ~ 02:00)
        if (startMinutes > endMinutes) {
          return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
        }

        // 일반 케이스 (예: 14:00 ~ 18:00)
        return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
      };

      for (const fence of geofences) {
        // 1. 거리 체크
        const distance = calculateDistance(currentLat, currentLng, fence.latitude, fence.longitude);
        const radius = 200; // 기본 반경 200미터
        const isInside = distance <= radius;

        // 2. 시간 체크 (일시적 지오펜스만)
        const isTimeActive = fence.type === 0 || isWithinTimeRange(fence.startTime, fence.endTime);

        // 3. 진입 조건: 거리 내 + 시간 조건 만족
        const canEnter = isInside && isTimeActive;

        // 진입 감지: 이전에 밖에 있었는데 지금 안에 들어옴
        if (canEnter && !lastGeofenceCheck[fence.id]) {
          try {
            await geofenceService.recordEntry({ geofenceId: fence.id });
            console.log(`✅ 지오펜스 진입 기록: ${fence.name} (${fence.type === 0 ? '영구' : `일시 ${fence.startTime}-${fence.endTime}`})`);
            setLastGeofenceCheck(prev => ({ ...prev, [fence.id]: true }));
          } catch (error) {
            console.error('❌ 지오펜스 진입 기록 실패:', error);
          }
        }
        // 이탈 감지: 영구 지오펜스만 이탈 추적 (일시적 지오펜스는 진입 후 사라짐)
        else if (fence.type === 0 && (!canEnter) && lastGeofenceCheck[fence.id]) {
          console.log(`🚪 영구 지오펜스 이탈: ${fence.name}`);
          setLastGeofenceCheck(prev => {
            const updated = { ...prev };
            delete updated[fence.id];
            return updated;
          });
        }
      }
    };

    // 10초마다 지오펜스 검사
    const geofenceCheckInterval = setInterval(() => {
      checkGeofenceEntry();
    }, 10000);

    // 초기 검사 (즉시 실행)
    checkGeofenceEntry();

    console.log('🔍 지오펜스 검사 시작 (10초 주기, 항상 실행)');

    return () => {
      clearInterval(geofenceCheckInterval);
      console.log('🔍 지오펜스 검사 중지');
    };
  }, [geofences]); // currentLocation 제거 - ref 사용으로 10초 주기 유지

  /**
   * 컴포넌트 언마운트 시 정리
   */
  useEffect(() => {
    return () => {
      stopTracking();
      if (websocketSendInterval.current) {
        clearInterval(websocketSendInterval.current);
      }
      // Accelerometer 정리
      if (stopTimeout.current) {
        clearTimeout(stopTimeout.current);
        stopTimeout.current = null;
      }
      if (accelerometerSubscription.current) {
        accelerometerSubscription.current.remove();
        accelerometerSubscription.current = null;
      }
      // WebSocket은 앱 종료 시에만 해제 (페이지 전환 시 유지)
    };
  }, []);

  const value: LocationContextState = {
    isTracking,
    currentLocation,
    locationHistory,
    error,
    isLoading,
    isWebSocketConnected,
    targetLocation,
    geofences,
    loadGeofences,
    startTracking,
    stopTracking,
    connectWebSocket,
    disconnectWebSocket,
    setSupporterTarget,
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};

/**
 * useLocation Hook
 * LocationContext를 쉽게 사용하기 위한 커스텀 훅
 */
export const useLocation = (): LocationContextState => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
