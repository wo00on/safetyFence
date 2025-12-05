/**
 * Background Location Service
 * 백그라운드에서도 위치 추적을 계속하기 위한 서비스
 * - expo-task-manager를 사용하여 백그라운드 작업 정의
 * - expo-location의 백그라운드 위치 추적 기능 활용
 */

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { storage } from '../utils/storage';
import { sendLocationUpdate } from './locationTransport';

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

  if (!data) return;

  const { locations } = data;
  if (!locations?.length) return;

  const location = locations[0];
  console.log('📍 백그라운드 위치 수신:', {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    timestamp: location.timestamp,
  });

  try {
    const userRole = await storage.getUserRole();
    if (userRole !== 'user') {
      console.log('ℹ️ 백그라운드: 이용자가 아니어서 위치 전송 생략');
      return;
    }

    const result = await sendLocationUpdate({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: location.timestamp,
    });

    if (!result.ok) {
      console.warn('⚠️ 백그라운드 위치 전송 실패:', result.reason);
    }
  } catch (err) {
    console.error('❌ 백그라운드 위치 전송 처리 중 오류:', err);
  }
});

/**
 * 백그라운드 위치 추적 시작
 */
export const startBackgroundLocationTracking = async (): Promise<boolean> => {
  try {
    console.log('🔍 백그라운드 위치 추적 시작 시도...');

    // Task 등록 확인
    const isTaskDefined = await TaskManager.isTaskDefined(BACKGROUND_LOCATION_TASK);
    console.log(`🔍 Task 정의 여부: ${isTaskDefined}`);

    // 백그라운드 권한 확인
    const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();
    console.log(`🔍 포그라운드 권한: ${foregroundStatus}`);

    if (foregroundStatus !== 'granted') {
      console.error('❌ 포그라운드 위치 권한이 필요합니다.');
      return false;
    }

    const { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();
    console.log(`🔍 백그라운드 권한: ${backgroundStatus}`);

    if (backgroundStatus !== 'granted') {
      console.error('❌ 백그라운드 위치 권한이 필요합니다.');
      return false;
    }

    console.log('🔍 Location.startLocationUpdatesAsync 호출 중...');

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

    console.log('✅ Location.startLocationUpdatesAsync 성공');

    // 등록 확인
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
    console.log(`✅ Task 등록 확인: ${isRegistered}`);

    console.log('✅ 백그라운드 위치 추적 시작 완료');
    return true;
  } catch (error: any) {
    console.error('❌ 백그라운드 위치 추적 에러 발생:', {
      message: error?.message,
      code: error?.code,
      error: error,
    });

    // Expo Go 제한사항: 백그라운드 위치 추적 불가능
    // Development Build에서는 정상 작동
    const isExpoGoLimitation = error?.message?.includes('Foreground service cannot be started');
    if (isExpoGoLimitation) {
      console.log('ℹ️ Expo Go 제한사항 (예상된 동작)');
      return false;
    }

    // 다른 에러는 실제 문제일 수 있으므로 로그
    console.warn('⚠️ 백그라운드 위치 추적 시작 실패:', error?.message || error);
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
