import Global from '@/constants/Global';
import { websocketService } from './websocketService';
import { storage } from '../utils/storage';

type TransportMode = 'auto' | 'http-only';

type SendResult =
  | { ok: true }
  | { ok: false; reason: string };

export async function sendLocationUpdate(opts: {
  latitude: number;
  longitude: number;
  timestamp?: number;
  transport?: TransportMode;
}): Promise<SendResult> {
  try {
    const [apiKey, userNumber] = await Promise.all([
      storage.getApiKey(),
      storage.getUserNumber(),
    ]);

    if (!apiKey || !userNumber) {
      console.warn('⚠️ API key 또는 userNumber가 없어 위치 전송 중단');
      return { ok: false, reason: 'missing-credentials' };
    }

    const payload = {
      latitude: opts.latitude,
      longitude: opts.longitude,
      timestamp: opts.timestamp ?? Date.now(),
    };

    const transportMode = opts.transport ?? 'auto';

    if (transportMode !== 'http-only' && websocketService.isConnected()) {
      try {
        websocketService.sendLocation(payload);
        return { ok: true };
      } catch (err) {
        console.warn('⚠️ WebSocket 전송 실패, HTTP fallback 시도:', err);
      }
    }

    try {
      const response = await fetch(`${Global.URL}/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
          userNumber: userNumber,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error('❌ HTTP 위치 전송 실패:', response.status);
        return { ok: false, reason: `http-${response.status}` };
      }

      console.log('✅ HTTP 위치 전송 성공');
      return { ok: true };
    } catch (err) {
      console.error('❌ HTTP 위치 전송 중 네트워크 오류:', err);
      return { ok: false, reason: 'network-error' };
    }
  } catch (err) {
    console.error('❌ 위치 전송 준비 중 오류 발생:', err);
    return { ok: false, reason: 'unexpected-error' };
  }
}
