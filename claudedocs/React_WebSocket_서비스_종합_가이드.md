# WebSocket 서비스 종합 가이드

## 📋 목차
1. [개요](#개요)
2. [아키텍처](#아키텍처)
3. [핵심 컴포넌트](#핵심-컴포넌트)
4. [데이터 흐름](#데이터-흐름)
5. [연결 및 구독 흐름](#연결-및-구독-흐름)
6. [위치 전송 흐름](#위치-전송-흐름)
7. [백그라운드 처리](#백그라운드-처리)
8. [에러 처리 및 재연결](#에러-처리-및-재연결)
9. [사용 예시](#사용-예시)
10. [타입 정의](#타입-정의)

---

## 개요

SafetyFence 프로젝트의 WebSocket 서비스는 **실시간 위치 공유**를 위한 핵심 인프라입니다.

### 주요 기술 스택
- **STOMP over WebSocket**: 메시징 프로토콜 (순수 WebSocket 사용)
- **@stomp/stompjs**: STOMP 클라이언트 라이브러리
- **Expo Location**: 위치 추적
- **Expo Task Manager**: 백그라운드 작업 관리

### 핵심 기능
- ✅ 실시간 양방향 위치 공유
- ✅ 자동 재연결 (최대 5회)
- ✅ 백그라운드 위치 추적 및 전송
- ✅ Heartbeat를 통한 연결 유지
- ✅ 역할 기반 동작 (이용자 ↔ 보호자)

---

## 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    React Native 앱                          │
├─────────────────────────────────────────────────────────────┤
│  MapPage (UI)                                               │
│    ↕                                                        │
│  LocationContext (전역 상태 관리)                            │
│    ↕                          ↕                            │
│  WebSocketService         BackgroundLocationService        │
│    ↕                          ↕                            │
│  STOMP Client            TaskManager                        │
│    ↕                          ↕                            │
│  SockJS                   Expo Location                     │
└─────────────────────────────────────────────────────────────┘
                     ↕
         ┌──────────────────────┐
         │   Backend Server     │
         ├──────────────────────┤
         │   /ws (SockJS)       │
         │   /app/location      │
         │   /topic/location/*  │
         └──────────────────────┘
```

### 역할별 동작

#### 🔵 이용자 (USER)
```
┌──────────────────┐
│  Location Update │ (2초마다)
└────────┬─────────┘
         ↓
┌──────────────────┐
│  LocationContext │
└────────┬─────────┘
         ↓ (2초마다)
┌──────────────────┐
│  WebSocket Send  │ → /app/location
└──────────────────┘
```

#### 🟢 보호자 (SUPPORTER)
```
┌──────────────────────┐
│  WebSocket Subscribe │ ← /topic/location/{targetNumber}
└────────┬─────────────┘
         ↓
┌──────────────────────┐
│  LocationContext     │
└────────┬─────────────┘
         ↓
┌──────────────────────┐
│  MapPage Display     │
└──────────────────────┘
```

---

## 핵심 컴포넌트

### 1. WebSocketService (`services/websocketService.ts`)

**목적**: STOMP over WebSocket 연결 관리 및 메시징

#### 주요 속성
```typescript
class WebSocketService {
  private client: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private locationCallbacks: Map<string, LocationCallback> = new Map();
  private connectionCallback: ConnectionCallback | null = null;
  private userNumber: string = '';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
}
```

#### 주요 메서드

| 메서드 | 설명 | 파라미터 |
|-------|------|---------|
| `connect()` | WebSocket 연결 시작 | `userNumber`, `onConnectionChange` |
| `disconnect()` | WebSocket 연결 해제 | - |
| `sendLocation()` | 위치 데이터 전송 | `LocationData` |
| `subscribeToUserLocation()` | 특정 사용자 위치 구독 | `targetUserNumber`, `callback` |
| `unsubscribeFromUserLocation()` | 위치 구독 해제 | `targetUserNumber` |
| `isConnected()` | 연결 상태 확인 | - |
| `getSubscribedUsers()` | 구독 중인 사용자 목록 | - |

#### 연결 설정
```typescript
// HTTP URL을 WebSocket URL로 변환 (http:// → ws://, https:// → wss://)
const wsUrl = Global.URL.replace('http://', 'ws://').replace('https://', 'wss://') + '/ws';

this.client = new Client({
  brokerURL: wsUrl,  // 순수 WebSocket 사용
  connectHeaders: {
    userNumber: userNumber,
  },
  heartbeatIncoming: 10000,  // 서버 → 클라이언트 10초
  heartbeatOutgoing: 10000,  // 클라이언트 → 서버 10초
  // ... 이벤트 핸들러
});
```

#### STOMP 엔드포인트

| 엔드포인트 | 타입 | 설명 |
|-----------|------|------|
| `/app/location` | SEND | 내 위치 전송 |
| `/topic/location/{userNumber}` | SUBSCRIBE | 특정 사용자 위치 구독 |

---

### 2. LocationContext (`contexts/LocationContext.tsx`)

**목적**: 전역 위치 추적 상태 관리 및 WebSocket 통합

#### Context 상태
```typescript
interface LocationContextState {
  // 위치 추적 상태
  isTracking: boolean;
  currentLocation: RealTimeLocation | null;
  locationHistory: RealTimeLocation[];
  error: string | null;
  isLoading: boolean;

  // WebSocket 상태
  isWebSocketConnected: boolean;

  // 보호자용: 이용자 위치
  targetLocation: RealTimeLocation | null;

  // 함수
  startTracking: () => Promise<void>;
  stopTracking: () => Promise<void>;
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
}
```

#### 주요 기능

**1. 위치 추적 시작** (`startTracking`)
```typescript
// 1. 권한 확인 및 요청
let { status } = await Location.getForegroundPermissionsAsync();
if (status !== 'granted') {
  const result = await Location.requestForegroundPermissionsAsync();
}

// 2. 초기 위치 가져오기
const initialLocation = await Location.getLastKnownPositionAsync();

// 3. 실시간 위치 추적 시작
const subscription = await Location.watchPositionAsync(
  {
    accuracy: Location.Accuracy.High,
    timeInterval: 2000,      // 2초마다
    distanceInterval: 10,    // 10미터 이동 시
  },
  (newLocation) => {
    // 위치 업데이트 콜백
  }
);

// 4. 백그라운드 추적 시작 (이용자만)
if (Global.USER_ROLE === 'user') {
  await startBackgroundLocationTracking();
  setupMovementDetection(); // 배터리 최적화
}
```

**2. WebSocket 연결** (`connectWebSocket`)
```typescript
websocketService.connect(Global.NUMBER, (connected) => {
  setIsWebSocketConnected(connected);

  // 보호자인 경우 이용자 위치 구독
  if (Global.USER_ROLE === 'supporter' && Global.TARGET_NUMBER) {
    websocketService.subscribeToUserLocation(
      Global.TARGET_NUMBER,
      (locationData) => {
        setTargetLocation({...locationData});
      }
    );
  }
});
```

**3. 위치 전송 (이용자만)**
```typescript
useEffect(() => {
  if (Global.USER_ROLE !== 'user') return;
  if (!currentLocation || !isTracking) return;
  if (!isWebSocketConnected) return;

  // 즉시 첫 위치 전송
  websocketService.sendLocation({
    latitude: currentLocation.latitude,
    longitude: currentLocation.longitude,
    timestamp: currentLocation.timestamp,
  });

  // 2초마다 위치 전송
  const interval = setInterval(() => {
    websocketService.sendLocation({
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      timestamp: currentLocation.timestamp,
    });
  }, 2000);

  return () => clearInterval(interval);
}, [currentLocation, isTracking, isWebSocketConnected]);
```

**4. 배터리 최적화 - 움직임 감지**
```typescript
const setupMovementDetection = () => {
  Accelerometer.setUpdateInterval(1000);
  const subscription = Accelerometer.addListener(data => {
    const { x, y, z } = data;
    const magnitude = Math.sqrt(x * x + y * y + z * z);

    if (magnitude > 1.1) { // 움직임 감지
      // 백그라운드 위치 추적 재시작
      startBackgroundLocationTracking();
    } else { // 움직임 없음
      // 10분 후 백그라운드 추적 중지 예약
      setTimeout(() => {
        stopBackgroundLocationTracking();
      }, 600000);
    }
  });
};
```

---

### 3. BackgroundLocationService (`services/backgroundLocationService.ts`)

**목적**: 앱이 백그라운드에 있을 때도 위치 추적 및 전송

#### TaskManager 작업 정의
```typescript
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('백그라운드 위치 작업 에러:', error);
    return;
  }

  const { locations } = data;
  const location = locations[0];

  // AsyncStorage에서 사용자 정보 읽기
  const [userRole, userNumber] = await Promise.all([
    storage.getUserRole(),
    storage.getUserNumber(),
  ]);

  // 이용자일 때만 위치 전송
  if (userRole === 'user' && userNumber) {
    if (websocketService.isConnected()) {
      // WebSocket으로 전송
      websocketService.sendLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
      });
    } else {
      // Fallback: HTTP POST로 전송
      await fetch(`${Global.URL}/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userNumber,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: location.timestamp,
        }),
      });
    }
  }
});
```

#### 백그라운드 추적 시작
```typescript
export const startBackgroundLocationTracking = async () => {
  // 1. 권한 확인
  const { status: foregroundStatus } =
    await Location.requestForegroundPermissionsAsync();
  const { status: backgroundStatus } =
    await Location.requestBackgroundPermissionsAsync();

  if (foregroundStatus !== 'granted' || backgroundStatus !== 'granted') {
    return false;
  }

  // 2. 백그라운드 위치 추적 시작
  await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
    accuracy: Location.Accuracy.High,
    timeInterval: 15000,         // 15초마다
    distanceInterval: 10,        // 10미터 이동 시
    foregroundService: {
      notificationTitle: 'SafetyFence 위치 추적',
      notificationBody: '안전을 위해 위치를 추적하고 있습니다.',
      notificationColor: '#22c55e',
    },
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
  });

  return true;
};
```

---

## 데이터 흐름

### 전체 시퀀스 다이어그램

```
이용자 앱                LocationContext          WebSocketService          서버
   │                          │                          │                   │
   │──startTracking()────────>│                          │                   │
   │                          │──connect()──────────────>│                   │
   │                          │                          │───WebSocket────-->│
   │                          │<──onConnected()──────────│<──CONNECTED───────│
   │                          │                          │                   │
   │<──isTracking=true────────│                          │                   │
   │                          │                          │                   │
   │                          │ (5초마다 위치 업데이트)   │                   │
   │                          │<──currentLocation────────│                   │
   │                          │                          │                   │
   │                          │ (15초마다)                │                   │
   │                          │──sendLocation()─────────>│                   │
   │                          │                          │──SEND /app/loc───>│
   │                          │                          │                   │
   │                          │                          │                   │
   │                          │                          │                   │
보호자 앱              LocationContext          WebSocketService          서버
   │                          │                          │                   │
   │──connectWebSocket()─────>│                          │                   │
   │                          │──connect()──────────────>│                   │
   │                          │                          │───WebSocket────-->│
   │                          │<──onConnected()──────────│<──CONNECTED───────│
   │                          │──subscribeToUserLoc()───>│                   │
   │                          │                          │──SUBSCRIBE────────>│
   │                          │                          │   /topic/loc/{num}│
   │                          │                          │                   │
   │                          │                          │<──MESSAGE─────────│
   │                          │<──locationCallback───────│                   │
   │<──targetLocation─────────│                          │                   │
   │                          │                          │                   │
```

---

## 연결 및 구독 흐름

### 1. 이용자 연결 흐름

```typescript
// 1. Context 초기화 (LocationProvider)
<LocationProvider>
  {/* 앱 컴포넌트 */}
</LocationProvider>

// 2. MapPage에서 위치 추적 및 WebSocket 연결
const { startTracking, connectWebSocket } = useLocation();

useEffect(() => {
  startTracking();      // 위치 추적 시작
  connectWebSocket();   // WebSocket 연결
}, []);

// 3. WebSocket 연결 성공
websocketService.connect(Global.NUMBER, (connected) => {
  if (connected) {
    console.log('연결 성공');
    // 자동으로 15초마다 위치 전송 시작
  }
});
```

### 2. 보호자 구독 흐름

```typescript
// 1. WebSocket 연결
connectWebSocket();

// 2. 연결 성공 시 자동으로 이용자 위치 구독
websocketService.connect(Global.NUMBER, (connected) => {
  if (connected && Global.USER_ROLE === 'supporter') {
    // 이용자 번호로 위치 구독
    websocketService.subscribeToUserLocation(
      Global.TARGET_NUMBER,
      (locationData) => {
        // 실시간 위치 업데이트
        setTargetLocation(locationData);
      }
    );
  }
});
```

---

## 위치 전송 흐름

### 포그라운드 위치 전송 (이용자)

```typescript
// LocationContext.tsx

useEffect(() => {
  if (Global.USER_ROLE !== 'user') return;
  if (!currentLocation || !isTracking) return;
  if (!isWebSocketConnected) return;

  // 즉시 첫 위치 전송
  websocketService.sendLocation({
    latitude: currentLocation.latitude,
    longitude: currentLocation.longitude,
    timestamp: currentLocation.timestamp,
  });

  // 2초마다 위치 전송
  const interval = setInterval(() => {
    if (currentLocation && isWebSocketConnected) {
      websocketService.sendLocation({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        timestamp: currentLocation.timestamp,
      });
    }
  }, 2000);

  return () => clearInterval(interval);
}, [currentLocation, isTracking, isWebSocketConnected]);
```

### 백그라운드 위치 전송 (이용자)

```typescript
// backgroundLocationService.ts

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  const location = data.locations[0];

  // WebSocket 연결 확인
  if (websocketService.isConnected()) {
    // WebSocket으로 전송 (우선)
    websocketService.sendLocation({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: location.timestamp,
    });
  } else {
    // HTTP POST로 fallback
    await fetch(`${Global.URL}/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userNumber: userNumber,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
      }),
    });
  }
});
```

---

## 백그라운드 처리

### 백그라운드 동작 흐름

```
앱 포그라운드          앱 백그라운드          앱 포그라운드
     │                      │                      │
     │  watchPosition       │  TaskManager         │  watchPosition
     │  (2초 간격)          │  (15초 간격)         │  (2초 간격)
     │                      │                      │
     │  WebSocket           │  WebSocket           │  WebSocket
     │  (2초 전송)          │  or HTTP             │  (2초 전송)
     │                      │  (fallback)          │
     ▼                      ▼                      ▼
   시간 →
```

### 백그라운드 권한 설정

**app.json**
```json
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "SafetyFence는 안전을 위해 항상 위치 정보가 필요합니다.",
          "isAndroidBackgroundLocationEnabled": true,
          "isAndroidForegroundServiceEnabled": true
        }
      ]
    ]
  }
}
```

### 배터리 최적화 전략

1. **움직임 감지**: Accelerometer로 사용자 움직임 감지
2. **조건부 추적**: 10분 이상 움직임 없으면 백그라운드 추적 중지
3. **움직임 재감지**: 다시 움직이면 백그라운드 추적 재개
4. **간격 조정**: 포그라운드 2초 → 백그라운드 15초

---

## 에러 처리 및 재연결

### 자동 재연결 로직

```typescript
// websocketService.ts

class WebSocketService {
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  onDisconnect: () => {
    console.log('WebSocket 연결 해제');
    this.connectionCallback?.(false);

    // 자동 재연결 (최대 5회)
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

      setTimeout(() => {
        this.connect(this.userNumber, this.connectionCallback || undefined);
      }, this.reconnectDelay);
    } else {
      console.error('최대 재연결 시도 횟수 초과');
    }
  }
}
```

### AppState 변경 감지 (포그라운드 복귀 시 재연결)

```typescript
// LocationContext.tsx

useEffect(() => {
  const subscription = AppState.addEventListener('change', (nextAppState) => {
    // 백그라운드 → 포그라운드
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      console.log('앱이 포그라운드로 돌아옴');

      // WebSocket 재연결 시도
      if (!isWebSocketConnected && Global.NUMBER) {
        console.log('WebSocket 재연결 시도');
        connectWebSocket();
      }
    }
    appState.current = nextAppState;
  });

  return () => subscription.remove();
}, [isWebSocketConnected]);
```

### 에러 타입별 처리

| 에러 타입 | 처리 방법 |
|----------|----------|
| `onWebSocketError` | 연결 실패 → 재연결 시도 |
| `onStompError` | STOMP 프로토콜 에러 로그 |
| `TaskManager error` | 백그라운드 작업 에러 로그 |
| HTTP fallback 실패 | 콘솔 에러, 다음 주기에 재시도 |

---

## 사용 예시

### 기본 사용법 (MapPage)

```typescript
import { useLocation } from '../contexts/LocationContext';

const MapPage: React.FC = () => {
  const {
    isTracking,              // 위치 추적 중인지
    currentLocation,         // 현재 위치 (이용자)
    isWebSocketConnected,    // WebSocket 연결 상태
    targetLocation,          // 이용자 위치 (보호자용)
    startTracking,
    connectWebSocket,
  } = useLocation();

  useEffect(() => {
    // 위치 추적 시작
    startTracking();

    // WebSocket 연결
    connectWebSocket();
  }, []);

  return (
    <View>
      {/* 연결 상태 표시 */}
      <Text>
        {isWebSocketConnected ? '서버 연결됨' : '서버 연결 안됨'}
      </Text>

      {/* 위치 표시 */}
      {currentLocation && (
        <Marker
          coordinate={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          }}
        />
      )}

      {/* 보호자: 이용자 위치 표시 */}
      {targetLocation && (
        <Marker
          coordinate={{
            latitude: targetLocation.latitude,
            longitude: targetLocation.longitude,
          }}
        />
      )}
    </View>
  );
};
```

### WebSocket 직접 사용 (고급)

```typescript
import { websocketService } from '../services/websocketService';

// 연결
websocketService.connect('01012345678', (connected) => {
  console.log('연결 상태:', connected);
});

// 위치 전송
websocketService.sendLocation({
  latitude: 37.5665,
  longitude: 126.9780,
  timestamp: Date.now(),
});

// 특정 사용자 위치 구독
websocketService.subscribeToUserLocation(
  '01087654321',
  (locationData) => {
    console.log('위치 수신:', locationData);
  }
);

// 구독 해제
websocketService.unsubscribeFromUserLocation('01087654321');

// 연결 해제
websocketService.disconnect();
```

---

## 타입 정의

### LocationData (전송용)

```typescript
export interface LocationData {
  latitude: number;
  longitude: number;
  timestamp?: number;
}
```

### ReceivedLocationData (수신용)

```typescript
export interface ReceivedLocationData extends LocationData {
  userNumber: string;
}
```

### RealTimeLocation (Context 상태)

```typescript
export interface RealTimeLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  speed?: number;
  heading?: number;
}
```

### Callback 타입

```typescript
type LocationCallback = (location: ReceivedLocationData) => void;
type ConnectionCallback = (connected: boolean) => void;
```

---

## 파일 위치

| 파일 | 경로 | 설명 |
|------|------|------|
| WebSocketService | `services/websocketService.ts` | STOMP over WebSocket 서비스 |
| LocationContext | `contexts/LocationContext.tsx` | 전역 위치 관리 Context |
| BackgroundLocationService | `services/backgroundLocationService.ts` | 백그라운드 위치 추적 |
| MapPage | `app/MapPage.tsx` | WebSocket 사용 UI 예시 |
| API 타입 | `types/api.d.ts` | WebSocket 관련 타입 정의 |

---

## 디버깅 팁

### 로그 확인

모든 주요 동작에는 콘솔 로그가 포함되어 있습니다:

```typescript
// WebSocket
console.log('✅ WebSocket 연결 성공');
console.log('❌ WebSocket 연결 해제');
console.log('📍 위치 전송:', locationData);
console.log('📍 위치 수신:', locationData);

// Location
console.log('📍 위치 추적 시작');
console.log('📍 위치 업데이트:', realTimeLocation);

// Background
console.log('📍 백그라운드 위치 수신:', location);
console.log('✅ 백그라운드 위치 전송 성공');
```

### 자주 발생하는 문제

| 문제 | 원인 | 해결 방법 |
|------|------|----------|
| WebSocket 연결 안 됨 | 서버 주소 오류 | `Global.URL` 확인 |
| 위치 전송 안 됨 | WebSocket 연결 끊김 | 재연결 시도 또는 HTTP fallback |
| 백그라운드 추적 안 됨 | 권한 없음 | 백그라운드 위치 권한 요청 |
| 보호자 위치 안 보임 | 구독 실패 | `TARGET_NUMBER` 확인 |

---

## 성능 최적화

### 전송 주기 조정

- **포그라운드**: 2초마다 위치 업데이트 및 전송 (실시간 공유)
- **백그라운드**: 15초마다 위치 업데이트 및 전송 (배터리 절약)
- **배터리 절약**: 움직임 없으면 10분 후 백그라운드 추적 중지

### Heartbeat 설정

```typescript
heartbeatIncoming: 10000,  // 10초 (연결 유지)
heartbeatOutgoing: 10000,  // 10초 (연결 유지)
```

### 메모리 관리

- 위치 히스토리 최대 20개 유지
- 구독 해제 시 콜백 정리
- 컴포넌트 언마운트 시 리소스 해제

---

## 보안 고려사항

1. **인증**: WebSocket 연결 시 `userNumber`를 헤더로 전송
2. **권한 검증**: 서버에서 구독 권한 확인 필요
3. **데이터 암호화**: HTTPS/WSS 사용 권장
4. **민감 정보**: 위치 데이터는 암호화 전송 고려

---

## 결론

SafetyFence의 WebSocket 서비스는 **실시간 위치 공유**를 위한 견고하고 최적화된 솔루션입니다.

### 핵심 특징
- ✅ **안정성**: 자동 재연결, fallback 메커니즘
- ✅ **효율성**: 배터리 최적화, 조건부 추적
- ✅ **확장성**: 역할 기반 동작, 다중 구독 지원
- ✅ **사용성**: Context API를 통한 간편한 통합

### 다음 단계
- [ ] WebSocket 메시지 암호화
- [ ] 오프라인 모드 지원 (큐잉)
- [ ] 위치 정확도 개선
- [ ] 배터리 사용량 모니터링

---

**작성일**: 2025-11-12
**작성자**: Claude Code
**프로젝트**: SafetyFence
