/**
 * Notification Service
 * FCM 푸시 알림 토큰 관리 및 알림 수신 처리
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import apiClient from '../utils/api/axiosConfig';
import { storage } from '../utils/storage';

// 알림 설정: 포그라운드에서도 알림 표시
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * 알림 권한 요청
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    if (!Device.isDevice) {
      console.log('ℹ️ 물리적 디바이스가 아니어서 알림 권한 요청 생략');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('⚠️ 알림 권한이 거부되었습니다');
      return false;
    }

    console.log('✅ 알림 권한 승인');
    return true;
  } catch (error) {
    console.error('❌ 알림 권한 요청 실패:', error);
    return false;
  }
};

/**
 * FCM 토큰 발급
 */
export const registerForPushNotifications = async (): Promise<string | null> => {
  try {
    if (!Device.isDevice) {
      console.log('ℹ️ 물리적 디바이스가 아니어서 푸시 토큰 발급 생략');
      return null;
    }

    // 알림 권한 확인
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }

    // Android 알림 채널 설정
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('geofence_notifications', {
        name: '지오펜스 알림',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#22c55e',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    }

    // FCM 기기 토큰 발급 (Expo Push 토큰이 아닌 순수 FCM 토큰)
    const devicePushToken = await Notifications.getDevicePushTokenAsync();
    if (!devicePushToken?.data) {
      console.error('❌ FCM 토큰 발급 실패: 토큰 데이터 없음');
      return null;
    }

    console.log(
      `✅ FCM 토큰 발급 성공 (type=${devicePushToken.type}):`,
      devicePushToken.data.substring(0, 20) + '...'
    );

    return devicePushToken.data;
  } catch (error) {
    console.error('❌ FCM 토큰 발급 실패:', error);
    return null;
  }
};

/**
 * 서버에 디바이스 토큰 등록
 */
export const registerTokenToServer = async (token: string): Promise<boolean> => {
  try {
    const userNumber = await storage.getUserNumber();

    if (!userNumber) {
      console.warn('⚠️ 사용자 번호가 없어 토큰 등록 생략');
      return false;
    }

    const deviceType = Platform.OS; // 'android' or 'ios'

    const response = await apiClient.post('/api/device-token/register', {
      userNumber,
      token,
      deviceType,
    });

    console.log('✅ 서버에 토큰 등록 성공:', response.data);
    return true;
  } catch (error) {
    console.error('❌ 서버에 토큰 등록 실패:', error);
    return false;
  }
};

/**
 * 서버에서 디바이스 토큰 삭제 (로그아웃 시)
 */
export const unregisterTokenFromServer = async (token: string): Promise<boolean> => {
  try {
    await apiClient.delete('/api/device-token', {
      params: { token },
    });

    console.log('✅ 서버에서 토큰 삭제 성공');
    return true;
  } catch (error) {
    console.error('❌ 서버에서 토큰 삭제 실패:', error);
    return false;
  }
};

/**
 * 알림 초기화 (앱 시작 시 호출)
 */
export const initializeNotifications = async (): Promise<void> => {
  try {
    console.log('🔔 알림 초기화 시작...');

    // FCM 토큰 발급
    const token = await registerForPushNotifications();

    if (!token) {
      console.log('ℹ️ 토큰 발급 실패로 알림 초기화 중단');
      return;
    }

    // 서버에 토큰 등록
    await registerTokenToServer(token);

    // 로컬 스토리지에 토큰 저장 (로그아웃 시 사용)
    await storage.setItem('fcmToken', token);

    console.log('✅ 알림 초기화 완료');
  } catch (error) {
    console.error('❌ 알림 초기화 실패:', error);
  }
};

/**
 * 포그라운드 알림 수신 리스너 등록
 */
export const setupNotificationListeners = () => {
  // 포그라운드에서 알림 수신 시
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('🔔 알림 수신 (포그라운드):', notification);
    const { title, body } = notification.request.content;
    console.log(`📬 제목: ${title}, 내용: ${body}`);
  });

  // 알림 클릭 시
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('🔔 알림 클릭:', response);
    const { elderNumber, type } = response.notification.request.content.data || {};

    if (type === 'geofence' && elderNumber) {
      console.log(`📍 지오펜스 알림 클릭: 어르신 번호=${elderNumber}`);
      // TODO: 해당 어르신의 위치 화면으로 이동
    }
  });

  return {
    notificationListener,
    responseListener,
  };
};

/**
 * 알림 리스너 정리
 */
export const cleanupNotificationListeners = (listeners: {
  notificationListener?: Notifications.Subscription;
  responseListener?: Notifications.Subscription;
}) => {
  listeners.notificationListener?.remove();
  listeners.responseListener?.remove();
};
