import apiClient from '../utils/api/axiosConfig';
import type { LinkItem, AddLinkRequest, DeleteLinkRequest } from '../types/api';

/**
 * 링크(연결) 관리 API 서비스
 * - 링크 목록 조회
 * - 링크 추가
 * - 링크 삭제
 */

export const linkService = {
  /**
   * 링크 목록 조회
   * GET /link/list
   */
  async getList(): Promise<LinkItem[]> {
    const response = await apiClient.get<LinkItem[]>('/link/list');
    return response.data;
  },

  /**
   * 링크 추가
   * POST /link/addUser
   */
  async addUser(data: AddLinkRequest): Promise<string> {
    const response = await apiClient.post<string>('/link/addUser', data);
    return response.data;
  },

  /**
   * 링크 삭제
   * DELETE /link/deleteUser
   */
  async deleteUser(data: DeleteLinkRequest): Promise<string> {
    const response = await apiClient.delete<string>('/link/deleteUser', { data });
    return response.data;
  },
};
