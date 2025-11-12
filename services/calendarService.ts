import apiClient from '../utils/api/axiosConfig';
import type { CalendarDayData, AddEventRequest } from '../types/api';

/**
 * 캘린더 API 서비스
 * - 캘린더 데이터 조회
 * - 이벤트 추가
 * - 이벤트 삭제
 */

export const calendarService = {
  /**
   * 캘린더 데이터 조회
   * GET /calendar/userData
   */
  async getUserData(): Promise<CalendarDayData[]> {
    const response = await apiClient.get<CalendarDayData[]>('/calendar/userData');
    return response.data;
  },

  /**
   * 이벤트 추가
   * POST /calendar/addEvent
   */
  async addEvent(data: AddEventRequest): Promise<string> {
    const response = await apiClient.post<string>('/calendar/addEvent', data);
    return response.data;
  },

  /**
   * 이벤트 삭제
   * DELETE /calendar/deleteEvent?eventId={id}
   */
  async deleteEvent(eventId: number): Promise<string> {
    const response = await apiClient.delete<string>(`/calendar/deleteEvent?eventId=${eventId}`);
    return response.data;
  },
};
