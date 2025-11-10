/**
 * 전역 설정 및 상태 관리
 * - URL: API 서버 주소
 * - NUMBER: 현재 사용자 전화번호
 * - TARGET_NUMBER: 보호자가 선택한 이용자 전화번호
 * - USER_ROLE: 사용자 역할 (user | supporter)
 */
const Global = {
  // API 서버 URL (로컬 네트워크 IP - 같은 WiFi에서만 접속 가능)
  URL: 'http://54.116.21.196:8080',

  // 사용자 정보
  NUMBER: "",
  TARGET_NUMBER: "",
  USER_ROLE: "",
};

export default Global;