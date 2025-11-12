import apiClient from '../utils/api/axiosConfig';
import type {
  MyPageData,
  ChangePasswordRequest,
  ChangeHomeAddressRequest,
  ChangeCenterAddressRequest,
} from '../types/api';

/**
 * 마이페이지/사용자 API 서비스
 * - 마이페이지 데이터 조회
 * - 비밀번호 변경
 * - 집 주소 변경
 * - 센터 주소 변경
 */

export const userService = {
  /**
   * 마이페이지 데이터 조회
   * GET /get/myPageData
   */
  async getMyPageData(): Promise<MyPageData> {
    const response = await apiClient.get<MyPageData>('/get/myPageData');
    return response.data;
  },

  /**
   * 비밀번호 변경
   * PATCH /mypage/password
   */
  async changePassword(data: ChangePasswordRequest): Promise<string> {
    const response = await apiClient.patch<string>('/mypage/password', data);
    return response.data;
  },

  /**
   * 집 주소 변경
   * PATCH /mypage/homeAddress
   */
  async changeHomeAddress(data: ChangeHomeAddressRequest): Promise<string> {
    const response = await apiClient.patch<string>('/mypage/homeAddress', data);
    return response.data;
  },

  /**
   * 센터 주소 변경
   * PATCH /mypage/centerAddress
   */
  async changeCenterAddress(data: ChangeCenterAddressRequest): Promise<string> {
    const response = await apiClient.patch<string>('/mypage/centerAddress', data);
    return response.data;
  },
};
