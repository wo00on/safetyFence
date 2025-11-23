/**
 * LocationContext
 * 전역 위치 추적 및 WebSocket 관리
 * - 페이지 전환 시에도 위치 추적 유지
 * - 백그라운드에서도 위치 전송 유지
 */

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import * as Location from 'expo-location';
import { Alert, AppState, AppStateStatus, Linking } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { websocketService } from '../services/websocketService';
import { startBackgroundLocationTracking, stopBackgroundLocationTracking } from '../services/backgroundLocationService';
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

  // 함수
  startTracking: () => Promise<void>;
  stopTracking: () => Promise<void>;
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
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

  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const websocketSendInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const stopTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accelerometerSubscription = useRef<{ remove: () => void } | null>(null);
  const supporterTargetRef = useRef<string | null>(null);

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
        (newLocation) => {
          const realTimeLocation: RealTimeLocation = {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
            accuracy: newLocation.coords.accuracy || 0,
            timestamp: newLocation.timestamp,
            speed: newLocation.coords.speed || undefined,
            heading: newLocation.coords.heading || undefined,
          };

          setCurrentLocation(realTimeLocation);
          setLocationHistory(prev => [...prev.slice(-19), realTimeLocation]);
          console.log('📍 위치 업데이트:', realTimeLocation);
        }
      );

      locationSubscription.current = subscription;
      setIsTracking(true);
      setError(null);
      setIsLoading(false);

      // 백그라운드 위치 추적 시작 (이용자만, Expo Go에서는 실패할 수 있음)
      if (Global.USER_ROLE === 'user') {
        try {
          const backgroundStarted = await startBackgroundLocationTracking();
          if (backgroundStarted) {
            console.log('✅ 백그라운드 위치 추적 시작 완료');
          } else {
            console.warn('⚠️ 백그라운드 위치 추적 시작 실패 (포그라운드 추적은 작동 중)');
          }

          // 움직임 감지 시작 (배터리 최적화)
          setupMovementDetection();
          console.log('✅ 배터리 최적화: 움직임 감지 시작');
        } catch (bgTrackError) {
          console.warn('⚠️ 백그라운드 추적 설정 실패 (Expo Go 제한):', bgTrackError);
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
   */
  const setupMovementDetection = () => {
    Accelerometer.setUpdateInterval(1000); // 1초 간격
    const subscription = Accelerometer.addListener(accelerometerData => {
      const { x, y, z } = accelerometerData;
      const magnitude = Math.sqrt(x * x + y * y + z * z);

      if (magnitude > 1.1) { // 움직임 감지
        if (stopTimeout.current) {
          clearTimeout(stopTimeout.current);
          stopTimeout.current = null;
          console.log('📱 움직임 감지됨, 위치 추적 중지 타이머 취소');
        }
        // 백그라운드 위치 추적 재시작 (이미 시작되어 있을 수 있음)
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
  const disconnectWebSocket = () => {
    console.log('🔌 WebSocket 연결 해제');
    clearSupporterTarget();
    websocketService.disconnect();
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
   * WebSocket으로 위치 전송 (이용자만)
   */
  useEffect(() => {
    if (Global.USER_ROLE !== 'user') return;
    if (!currentLocation || !isTracking) return;
    if (!isWebSocketConnected) return;

    // 2초마다 위치 전송 (실시간 위치 공유)
    if (websocketSendInterval.current) {
      clearInterval(websocketSendInterval.current);
    }

    // 즉시 첫 위치 전송
    console.log('📡 포그라운드: WebSocket으로 위치 전송 (즉시)');
    websocketService.sendLocation({
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      timestamp: currentLocation.timestamp,
    });

    websocketSendInterval.current = setInterval(() => {
      if (currentLocation && isWebSocketConnected) {
        console.log('📡 포그라운드: WebSocket으로 위치 전송 (2초 주기)');
        websocketService.sendLocation({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          timestamp: currentLocation.timestamp,
        });
      }
    }, 2000);

    return () => {
      if (websocketSendInterval.current) {
        clearInterval(websocketSendInterval.current);
        websocketSendInterval.current = null;
      }
    };
  }, [currentLocation, isTracking, isWebSocketConnected]);

  /**
   * AppState 변경 감지 (포그라운드/백그라운드)
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('📱 앱이 포그라운드로 돌아옴');
        // 필요시 WebSocket 재연결
        if (!isWebSocketConnected && Global.NUMBER) {
          console.log('🔄 WebSocket 재연결 시도');
          connectWebSocket();
        }
      } else if (nextAppState.match(/inactive|background/)) {
        console.log('📱 앱이 백그라운드로 이동');
        // WebSocket은 유지 (위치 전송 계속)
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isWebSocketConnected]);

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
