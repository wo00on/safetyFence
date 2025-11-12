import apiClient from '../utils/api/axiosConfig';
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
   */
  async getList(): Promise<GeofenceItem[]> {
    const response = await apiClient.post<GeofenceItem[]>('/geofence/list');
    return response.data;
  },

  /**
   * 지오펜스 생성
   * POST /geofence/newFence
   */
  async create(data: CreateGeofenceRequest): Promise<string> {
    const response = await apiClient.post<string>('/geofence/newFence', data);
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
   */
  async delete(data: DeleteGeofenceRequest): Promise<string> {
    const response = await apiClient.delete<string>('/geofence/deleteFence', { data });
    return response.data;
  },
};
