import apiClient from '../utils/api/axiosConfig';
import type { SignupRequest, SignupResponse, SignInRequest, SignInResponse } from '../types/api';

/**
 * 인증 관련 API 서비스
 * - 회원가입
 * - 로그인
 */

export const authService = {
  /**
   * 회원가입
   * POST /user/signup
   */
  async signup(data: SignupRequest): Promise<SignupResponse> {
    const response = await apiClient.post<SignupResponse>('/user/signup', data);
    return response.data;
  },

  /**
   * 로그인
   * POST /user/signIn
   */
  async signIn(data: SignInRequest): Promise<SignInResponse> {
    const response = await apiClient.post<SignInResponse>('/user/signIn', data);
    return response.data;
  },
};
