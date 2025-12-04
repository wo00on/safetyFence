import apiClient from '../utils/api/axiosConfig';
import Global from '../constants/Global';
import type {
  GeofenceItem,
  CreateGeofenceRequest,
  GeofenceEnterRequest,
  DeleteGeofenceRequest,
} from '../types/api';

/**
 * 지오펜스 API 서비스
 * - 지오펜스 목록 조회
 * - 지오펜스 생성
 * - 지오펜스 진입 기록
 * - 지오펜스 삭제
 */

export const geofenceService = {
  /**
   * 지오펜스 목록 조회
   * POST /geofence/list
   * @param targetNumber - 조회할 이용자 번호 (선택사항, 없으면 본인)
   */
  async getList(targetNumber?: string): Promise<GeofenceItem[]> {
    const number = targetNumber || Global.NUMBER;
    const response = await apiClient.post<GeofenceItem[]>('/geofence/list', { number });
    return response.data;
  },

  /**
   * 지오펜스 생성
   * POST /geofence/newFence
   * @param data - 지오펜스 생성 정보
   * @param targetNumber - 생성할 이용자 번호 (선택사항, 없으면 본인)
   */
  async create(data: CreateGeofenceRequest, targetNumber?: string): Promise<string> {
    const payload = targetNumber ? { ...data, number: targetNumber } : data;
    const response = await apiClient.post<string>('/geofence/newFence', payload);
    return response.data;
  },

  /**
   * 지오펜스 진입 기록
   * POST /geofence/userFenceIn
   */
  async recordEntry(data: GeofenceEnterRequest): Promise<string> {
    const response = await apiClient.post<string>('/geofence/userFenceIn', data);
    return response.data;
  },

  /**
   * 지오펜스 삭제
   * DELETE /geofence/deleteFence
   * @param data - 삭제할 지오펜스 정보
   * @param targetNumber - 삭제할 이용자 번호 (선택사항, 없으면 본인)
   */
  async delete(data: DeleteGeofenceRequest, targetNumber?: string): Promise<string> {
    const payload = targetNumber ? { ...data, number: targetNumber } : data;
    const response = await apiClient.delete<string>('/geofence/deleteFence', { data: payload });
    return response.data;
  },
};
