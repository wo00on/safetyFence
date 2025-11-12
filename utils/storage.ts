import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * AsyncStorage 래퍼 유틸리티
 * API 키 및 사용자 정보 저장/불러오기/삭제
 */

const STORAGE_KEYS = {
  API_KEY: '@safetyFence:apiKey',
  USER_NUMBER: '@safetyFence:userNumber',
  USER_NAME: '@safetyFence:userName',
  USER_ROLE: '@safetyFence:userRole',
  TARGET_NUMBER: '@safetyFence:targetNumber',
} as const;

export const storage = {
  // API 키 저장
  async setApiKey(apiKey: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.API_KEY, apiKey);
    } catch (error) {
      console.error('API 키 저장 실패:', error);
      throw error;
    }
  },

  // API 키 가져오기
  async getApiKey(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.API_KEY);
    } catch (error) {
      console.error('API 키 가져오기 실패:', error);
      return null;
    }
  },

  // 사용자 번호 저장
  async setUserNumber(number: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_NUMBER, number);
    } catch (error) {
      console.error('사용자 번호 저장 실패:', error);
      throw error;
    }
  },

  // 사용자 번호 가져오기
  async getUserNumber(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.USER_NUMBER);
    } catch (error) {
      console.error('사용자 번호 가져오기 실패:', error);
      return null;
    }
  },

  // 사용자 이름 저장
  async setUserName(name: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_NAME, name);
    } catch (error) {
      console.error('사용자 이름 저장 실패:', error);
      throw error;
    }
  },

  // 사용자 이름 가져오기
  async getUserName(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.USER_NAME);
    } catch (error) {
      console.error('사용자 이름 가져오기 실패:', error);
      return null;
    }
  },

  // 사용자 역할 저장
  async setUserRole(role: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
    } catch (error) {
      console.error('사용자 역할 저장 실패:', error);
      throw error;
    }
  },

  // 사용자 역할 가져오기
  async getUserRole(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.USER_ROLE);
    } catch (error) {
      console.error('사용자 역할 가져오기 실패:', error);
      return null;
    }
  },

  // 대상 번호 저장 (보호자가 추적할 이용자 번호)
  async setTargetNumber(targetNumber: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TARGET_NUMBER, targetNumber);
    } catch (error) {
      console.error('대상 번호 저장 실패:', error);
      throw error;
    }
  },

  // 대상 번호 가져오기
  async getTargetNumber(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.TARGET_NUMBER);
    } catch (error) {
      console.error('대상 번호 가져오기 실패:', error);
      return null;
    }
  },

  // 전체 로그인 정보 저장
  async setLoginInfo(apiKey: string, userNumber: string, userName: string): Promise<void> {
    try {
      await Promise.all([
        this.setApiKey(apiKey),
        this.setUserNumber(userNumber),
        this.setUserName(userName),
      ]);
    } catch (error) {
      console.error('로그인 정보 저장 실패:', error);
      throw error;
    }
  },

  // 로그아웃 (모든 정보 삭제)
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.API_KEY,
        STORAGE_KEYS.USER_NUMBER,
        STORAGE_KEYS.USER_NAME,
        STORAGE_KEYS.USER_ROLE,
        STORAGE_KEYS.TARGET_NUMBER,
      ]);
    } catch (error) {
      console.error('저장소 초기화 실패:', error);
      throw error;
    }
  },

  // 로그인 여부 확인
  async isLoggedIn(): Promise<boolean> {
    try {
      const apiKey = await this.getApiKey();
      return apiKey !== null;
    } catch (error) {
      console.error('로그인 여부 확인 실패:', error);
      return false;
    }
  },
};
