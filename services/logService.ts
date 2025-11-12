import apiClient from '../utils/api/axiosConfig';
import type { LogItem } from '../types/api';

/**
 * 로그 조회 API 서비스
 * - 로그 목록 조회
 */

export const logService = {
  /**
   * 로그 조회
   * GET /logs
   */
  async getLogs(): Promise<LogItem[]> {
    const response = await apiClient.get<LogItem[]>('/logs');
    return response.data;
  },
};
