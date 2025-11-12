/**
 * WebSocket 실시간 위치 공유 서비스
 * - STOMP over WebSocket (SockJS)
 * - 위치 전송: /app/location
 * - 위치 구독: /topic/location/{targetUserNumber}
 */

import Global from '@/constants/Global';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface LocationData {
  latitude: number;
  longitude: number;
  timestamp?: number;
}

export interface ReceivedLocationData extends LocationData {
  userNumber: string;
}

type LocationCallback = (location: ReceivedLocationData) => void;
type ConnectionCallback = (connected: boolean) => void;

class WebSocketService {
  private client: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private locationCallbacks: Map<string, LocationCallback> = new Map();
  private connectionCallback: ConnectionCallback | null = null;
  private userNumber: string = '';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  /**
   * WebSocket 연결
   * @param userNumber 현재 사용자 전화번호
   * @param onConnectionChange 연결 상태 변경 콜백
   */
  connect(userNumber: string, onConnectionChange?: ConnectionCallback): void {
    if (this.client?.connected) {
      console.log('WebSocket 이미 연결되어 있음');
      return;
    }

    this.userNumber = userNumber;
    this.connectionCallback = onConnectionChange || null;

    try {
      // SockJS는 HTTP URL을 받아야 함 (내부적으로 WebSocket으로 업그레이드)
      const wsUrl = Global.URL + '/ws';
      console.log('WebSocket 연결 시도:', wsUrl);

      // SockJS 소켓 생성
      const socket = new SockJS(wsUrl);

      // STOMP 클라이언트 생성
      this.client = new Client({
        webSocketFactory: () => socket as any,
        connectHeaders: {
          userNumber: userNumber,
        },
        // Heartbeat 설정: 백그라운드에서도 연결 유지
        heartbeatIncoming: 10000, // 서버로부터 10초마다 heartbeat 수신
        heartbeatOutgoing: 10000, // 서버로 10초마다 heartbeat 전송
        debug: (str) => {
          console.log('STOMP:', str);
        },
        onConnect: () => {
          console.log('✅ WebSocket 연결 성공');
          this.reconnectAttempts = 0;
          this.connectionCallback?.(true);
        },
        onDisconnect: () => {
          console.log('❌ WebSocket 연결 해제');
          this.connectionCallback?.(false);

          // 자동 재연결
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
            setTimeout(() => {
              this.connect(this.userNumber, this.connectionCallback || undefined);
            }, this.reconnectDelay);
          }
        },
        onStompError: (frame) => {
          console.error('❌ STOMP 에러:', frame.headers['message']);
          console.error('에러 상세:', frame.body);
          this.connectionCallback?.(false);
        },
        onWebSocketError: (event) => {
          console.error('❌ WebSocket 에러:', event);
          this.connectionCallback?.(false);
        },
      });

      this.client.activate();
    } catch (error) {
      console.error('WebSocket 연결 실패:', error);
      this.connectionCallback?.(false);
    }
  }

  /**
   * WebSocket 연결 해제
   */
  disconnect(): void {
    if (this.client) {
      console.log('WebSocket 연결 해제 중...');

      // 모든 구독 해제
      this.subscriptions.forEach((subscription) => {
        subscription.unsubscribe();
      });
      this.subscriptions.clear();
      this.locationCallbacks.clear();

      // 클라이언트 비활성화
      this.client.deactivate();
      this.client = null;
      this.connectionCallback?.(false);
    }
  }

  /**
   * 내 위치 전송
   * @param location 위도, 경도 정보
   */
  sendLocation(location: LocationData): void {
    if (!this.client?.connected) {
      console.warn('WebSocket이 연결되지 않음 - 위치 전송 불가');
      return;
    }

    try {
      const locationData = {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: location.timestamp || Date.now(),
      };

      this.client.publish({
        destination: '/app/location',
        body: JSON.stringify(locationData),
      });

      console.log('📍 위치 전송:', locationData);
    } catch (error) {
      console.error('위치 전송 실패:', error);
    }
  }

  /**
   * 특정 사용자 위치 구독 (보호자가 이용자 위치 구독)
   * @param targetUserNumber 구독할 대상 사용자 전화번호
   * @param callback 위치 업데이트 콜백
   */
  subscribeToUserLocation(targetUserNumber: string, callback: LocationCallback): void {
    if (!this.client?.connected) {
      console.warn('WebSocket이 연결되지 않음 - 구독 불가');
      return;
    }

    // 이미 구독 중인지 확인
    if (this.subscriptions.has(targetUserNumber)) {
      console.log(`이미 ${targetUserNumber}의 위치를 구독 중`);
      return;
    }

    try {
      const destination = `/topic/location/${targetUserNumber}`;

      const subscription = this.client.subscribe(destination, (message: IMessage) => {
        try {
          const locationData: ReceivedLocationData = JSON.parse(message.body);
          console.log(`📍 ${targetUserNumber} 위치 수신:`, locationData);
          callback(locationData);
        } catch (error) {
          console.error('위치 데이터 파싱 실패:', error);
        }
      });

      this.subscriptions.set(targetUserNumber, subscription);
      this.locationCallbacks.set(targetUserNumber, callback);
      console.log(`✅ ${targetUserNumber}의 위치 구독 시작`);
    } catch (error) {
      console.error('위치 구독 실패:', error);
    }
  }

  /**
   * 특정 사용자 위치 구독 해제
   * @param targetUserNumber 구독 해제할 대상 사용자 전화번호
   */
  unsubscribeFromUserLocation(targetUserNumber: string): void {
    const subscription = this.subscriptions.get(targetUserNumber);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(targetUserNumber);
      this.locationCallbacks.delete(targetUserNumber);
      console.log(`❌ ${targetUserNumber}의 위치 구독 해제`);
    }
  }

  /**
   * 연결 상태 확인
   */
  isConnected(): boolean {
    return this.client?.connected || false;
  }

  /**
   * 현재 구독 중인 사용자 목록
   */
  getSubscribedUsers(): string[] {
    return Array.from(this.subscriptions.keys());
  }
}

// 싱글톤 인스턴스
export const websocketService = new WebSocketService();
