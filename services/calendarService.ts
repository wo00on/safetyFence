import apiClient from '../utils/api/axiosConfig';
import Global from '../constants/Global';
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
   * 또는 POST /calendar/userData (이용자 번호 지정)
   * @param targetNumber - 조회할 이용자 번호 (선택사항, 없으면 본인)
   */
  async getUserData(targetNumber?: string): Promise<CalendarDayData[]> {
    // 이용자 번호가 있으면 POST로 전송 (지오펜스 API와 동일한 방식)
    if (targetNumber) {
      const response = await apiClient.post<CalendarDayData[]>('/calendar/userData', { number: targetNumber });
      return response.data;
    }
    // 없으면 기존 GET 방식
    const response = await apiClient.get<CalendarDayData[]>('/calendar/userData');
    return response.data;
  },

  /**
   * 이벤트 추가
   * POST /calendar/addEvent
   * @param data - 이벤트 정보
   * @param targetNumber - 추가할 이용자 번호 (선택사항, 없으면 본인)
   */
  async addEvent(data: AddEventRequest, targetNumber?: string): Promise<string> {
    const payload = targetNumber ? { ...data, number: targetNumber } : data;
    const response = await apiClient.post<string>('/calendar/addEvent', payload);
    return response.data;
  },

  /**
   * 이벤트 삭제
   * DELETE /calendar/deleteEvent?eventId={id}&number={number}
   * @param eventId - 삭제할 이벤트 ID
   * @param targetNumber - 삭제할 이용자 번호 (선택사항, 없으면 본인)
   */
  async deleteEvent(eventId: number, targetNumber?: string): Promise<string> {
    const url = targetNumber
      ? `/calendar/deleteEvent?eventId=${eventId}&number=${targetNumber}`
      : `/calendar/deleteEvent?eventId=${eventId}`;
    const response = await apiClient.delete<string>(url);
    return response.data;
  },
};
