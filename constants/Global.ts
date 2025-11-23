/**
 * 전역 설정 및 상태 관리
 * - URL: API 서버 주소
 * - NUMBER: 현재 사용자 전화번호
 * - TARGET_NUMBER: 보호자가 선택한 이용자 전화번호
 * - USER_ROLE: 사용자 역할 (user | supporter)
 */
const Global = {
  // API 서버 URL - Nginx 리버스 프록시를 통한 접속 (포트 80)
  URL: 'http://54.116.21.196',

  // 사용자 정보
  NUMBER: "",
  TARGET_NUMBER: "",
  USER_ROLE: "",
};

export default Global;