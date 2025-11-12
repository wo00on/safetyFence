/**
 * Background Location Service
 * 백그라운드에서도 위치 추적을 계속하기 위한 서비스
 * - expo-task-manager를 사용하여 백그라운드 작업 정의
 * - expo-location의 백그라운드 위치 추적 기능 활용
 */

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { websocketService } from './websocketService';
import { storage } from '../utils/storage';
import Global from '@/constants/Global';

// 백그라운드 위치 작업 이름
export const BACKGROUND_LOCATION_TASK = 'background-location-task';

/**
 * 백그라운드 위치 작업 정의
 * 앱이 백그라운드에 있을 때도 위치를 수신하고 서버로 전송
 */
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }: any) => {
  if (error) {
    console.error('❌ 백그라운드 위치 작업 에러:', error);
    return;
  }

  if (data) {
    const { locations } = data;

    if (locations && locations.length > 0) {
      const location = locations[0];
      console.log('📍 백그라운드 위치 수신:', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
      });

      // AsyncStorage에서 사용자 정보 읽기 (백그라운드에서도 안전하게 접근)
      try {
        const [userRole, userNumber] = await Promise.all([
          storage.getUserRole(),
          storage.getUserNumber(),
        ]);

        // 사용자 역할이 'user'일 때만 위치 전송
        if (userRole === 'user' && userNumber) {
          const isWebSocketConnected = websocketService.isConnected();
          console.log(`📡 백그라운드: WebSocket 연결 상태 = ${isWebSocketConnected}`);

          // WebSocket이 연결되어 있으면 WebSocket으로 전송
          if (isWebSocketConnected) {
            try {
              websocketService.sendLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                timestamp: location.timestamp,
              });
              console.log('✅ 백그라운드 위치 전송 성공 (WebSocket)');
            } catch (error) {
              console.error('❌ 백그라운드 위치 전송 실패 (WebSocket):', error);
            }
          } else {
            // WebSocket이 연결되어 있지 않으면 HTTP POST로 전송 (fallback)
            console.log('⚠️ 백그라운드: WebSocket 연결 없음, HTTP로 전송');
            try {
              const response = await fetch(`${Global.URL}/location`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userNumber: userNumber,
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                  timestamp: location.timestamp,
                }),
              });

              if (response.ok) {
                console.log('✅ 백그라운드 위치 전송 성공 (HTTP)');
              } else {
                console.error('❌ 백그라운드 위치 전송 실패 (HTTP):', response.status);
              }
            } catch (error) {
              console.error('❌ 백그라운드 위치 전송 실패 (HTTP):', error);
            }
          }
        } else {
          console.log('ℹ️ 백그라운드: 이용자가 아니거나 로그인 정보 없음');
        }
      } catch (error) {
        console.error('❌ 백그라운드: 사용자 정보 읽기 실패:', error);
      }
    }
  }
});

/**
 * 백그라운드 위치 추적 시작
 */
export const startBackgroundLocationTracking = async (): Promise<boolean> => {
  try {
    // 백그라운드 권한 확인
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      console.error('❌ 포그라운드 위치 권한이 필요합니다.');
      return false;
    }

    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
      console.error('❌ 백그라운드 위치 권한이 필요합니다.');
      return false;
    }

    // 백그라운드 위치 추적 시작
    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy: Location.Accuracy.High,
      timeInterval: 15000, // 15초마다 업데이트
      distanceInterval: 10, // 10미터 이동 시 업데이트
      foregroundService: {
        notificationTitle: 'SafetyFence 위치 추적',
        notificationBody: '안전을 위해 위치를 추적하고 있습니다.',
        notificationColor: '#22c55e', // green-500
      },
      pausesUpdatesAutomatically: false, // 자동 일시정지 비활성화
      showsBackgroundLocationIndicator: true, // iOS에서 백그라운드 위치 표시
    });

    console.log('✅ 백그라운드 위치 추적 시작');
    return true;
  } catch (error) {
    console.error('❌ 백그라운드 위치 추적 시작 실패:', error);
    return false;
  }
};

/**
 * 백그라운드 위치 추적 중지
 */
export const stopBackgroundLocationTracking = async (): Promise<void> => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
    if (isRegistered) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      console.log('✅ 백그라운드 위치 추적 중지');
    }
  } catch (error) {
    console.error('❌ 백그라운드 위치 추적 중지 실패:', error);
  }
};

/**
 * 백그라운드 위치 추적 상태 확인
 */
export const isBackgroundLocationTrackingActive = async (): Promise<boolean> => {
  try {
    return await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
  } catch (error) {
    console.error('❌ 백그라운드 위치 추적 상태 확인 실패:', error);
    return false;
  }
};
