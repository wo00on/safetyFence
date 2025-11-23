import Global from '@/constants/Global';
import { customMapStyle } from '@/styles/MapPageStyles';
import { geofenceService } from '../services/geofenceService';
import type { GeofenceItem } from '../types/api';
import { useLocation } from '../contexts/LocationContext';

import apiClient from '@/utils/api/axiosConfig';
import { isAxiosError } from 'axios';
import * as Location from 'expo-location';
import {
  MapPin, // FAB 버튼용 MapPin은 유지
  Plus,
} from 'lucide-react-native';
import { Accelerometer } from 'expo-sensors';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  Image, // Image 컴포넌트 임포트 확인
  Linking, // 설정으로 이동하기 위한 Linking 추가
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'; // react-native 임포트 정리
import MapView, { Marker, PROVIDER_GOOGLE, Circle } from 'react-native-maps'; // Circle 추가
import BottomNavigation from '../components/BottomNavigation';
import GeofenceModal from '../components/GeofenceModal';

// (Interface 정의들은 이전과 동일)
interface RealTimeLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  speed?: number;
  heading?: number;
}
interface LocationTrackingState {
  isTracking: boolean;
  currentLocation: RealTimeLocation | null;
  locationHistory: RealTimeLocation[];
  error: string | null;
  isLoading: boolean;
}
interface UserLocation {
  lat: number;
  lng: number;
  name: string;
  status: string;
}
type UserRole = 'user' | 'supporter' | null;

const MainPage: React.FC = () => {
  // Context에서 위치 및 WebSocket 상태 가져오기
  const {
    isTracking,
    currentLocation,
    error: locationError,
    isLoading,
    isWebSocketConnected,
    targetLocation,
  } = useLocation();

  const mapRef = useRef<MapView>(null);

  // MapPage만의 로컬 상태
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [geofences, setGeofences] = useState<GeofenceItem[]>([]);
  const [isGeofenceModalVisible, setIsGeofenceModalVisible] = useState(false);
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const [lastGeofenceCheck, setLastGeofenceCheck] = useState<{ [key: number]: boolean }>({});

  const moveToLocation = useCallback((location: RealTimeLocation) => {
    mapRef.current?.animateToRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 1000);
  }, []);

  // MapPage 초기화: userRole 설정 및 초기 위치로 지도 이동
  useEffect(() => {
    // 사용자 역할 설정
    const role = Global.USER_ROLE;
    if (role === 'user' || role === 'supporter') {
      setUserRole(role);
      console.log('📍 MapPage - 사용자 역할:', role);
    }

    // Context에서 가져온 현재 위치로 지도 이동
    if (currentLocation) {
      console.log('📍 MapPage - 초기 위치로 지도 이동');
      moveToLocation(currentLocation);
    }
  }, [currentLocation, moveToLocation]);


  // 지오펜스 목록 로드
  useEffect(() => {
    const loadGeofences = async () => {
      if (!userRole) return;

      try {
        const data = await geofenceService.getList();
        setGeofences(data);
        console.log('지오펜스 목록 로드 성공:', data.length);
      } catch (error) {
        console.error('지오펜스 목록 로드 실패:', error);
      }
    };

    loadGeofences();
  }, [userRole]);

  // 지오펜스 진입 감지 (user role일 때만, 10초마다)
  useEffect(() => {
    if (userRole !== 'user' || geofences.length === 0) {
      return;
    }

    // Haversine 공식으로 거리 계산 (미터 단위)
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371000; // 지구 반지름 (미터)
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const checkGeofenceEntry = async () => {
      // 최신 currentLocation 사용
      if (!currentLocation) return;

      const currentLat = currentLocation.latitude;
      const currentLng = currentLocation.longitude;
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      // 시간 체크 헬퍼 함수
      const isWithinTimeRange = (startTime: string | null, endTime: string | null): boolean => {
        if (!startTime || !endTime) return true; // 시간 미설정 시 항상 활성

        const [currentHour, currentMin] = currentTime.split(':').map(Number);
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);

        const currentMinutes = currentHour * 60 + currentMin;
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        // 자정을 넘는 경우 (예: 23:00 ~ 02:00)
        if (startMinutes > endMinutes) {
          return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
        }

        // 일반 케이스 (예: 14:00 ~ 18:00)
        return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
      };

      for (const fence of geofences) {
        // 1. 거리 체크
        const distance = calculateDistance(currentLat, currentLng, fence.latitude, fence.longitude);
        const radius = 200; // 기본 반경 200미터
        const isInside = distance <= radius;

        // 2. 시간 체크 (일시적 지오펜스만)
        const isTimeActive = fence.type === 0 || isWithinTimeRange(fence.startTime, fence.endTime);

        // 3. 진입 조건: 거리 내 + 시간 조건 만족
        const canEnter = isInside && isTimeActive;

        // 진입 감지: 이전에 밖에 있었는데 지금 안에 들어옴
        if (canEnter && !lastGeofenceCheck[fence.id]) {
          try {
            await geofenceService.recordEntry({ geofenceId: fence.id });
            console.log(`✅ 지오펜스 진입 기록: ${fence.name} (${fence.type === 0 ? '영구' : `일시 ${fence.startTime}-${fence.endTime}`})`);
            setLastGeofenceCheck(prev => ({ ...prev, [fence.id]: true }));
          } catch (error) {
            console.error('❌ 지오펜스 진입 기록 실패:', error);
          }
        }
        // 이탈 감지: 영구 지오펜스만 이탈 추적 (일시적 지오펜스는 진입 후 사라짐)
        else if (fence.type === 0 && (!canEnter) && lastGeofenceCheck[fence.id]) {
          console.log(`🚪 영구 지오펜스 이탈: ${fence.name}`);
          setLastGeofenceCheck(prev => {
            const updated = { ...prev };
            delete updated[fence.id];
            return updated;
          });
        }
      }
    };

    // 10초마다 지오펜스 검사
    const geofenceCheckInterval = setInterval(() => {
      checkGeofenceEntry();
    }, 10000);

    // 초기 검사 (즉시 실행)
    checkGeofenceEntry();

    console.log('🔍 지오펜스 검사 시작 (10초 주기)');

    return () => {
      clearInterval(geofenceCheckInterval);
      console.log('🔍 지오펜스 검사 중지');
    };
  }, [userRole, geofences]);

  const moveToMyLocation = () => {
    // Context에서 현재 위치 가져오기
    const location = currentLocation || targetLocation; // 이용자 또는 보호자 위치
    if (location) {
      moveToLocation(location);
    } else {
      Alert.alert('위치 정보 없음', '현재 위치 정보를 가져올 수 없습니다.');
    }
  };

  const handleGeofenceSave = async (data: {
    name: string;
    address: string;
    type: 'permanent' | 'temporary';
    startTime?: Date;
    endTime?: Date
  }) => {
    try {
      // type 변환: 'permanent' -> 0, 'temporary' -> 1
      const apiType = data.type === 'permanent' ? 0 : 1;

      // 시간 변환: Date -> HH:mm 형식 문자열
      const startTime = data.startTime
        ? `${String(data.startTime.getHours()).padStart(2, '0')}:${String(data.startTime.getMinutes()).padStart(2, '0')}`
        : null;
      const endTime = data.endTime
        ? `${String(data.endTime.getHours()).padStart(2, '0')}:${String(data.endTime.getMinutes()).padStart(2, '0')}`
        : null;

      // API 호출: POST /geofence/newFence
      await geofenceService.create({
        name: data.name,
        address: data.address,
        type: apiType,
        startTime,
        endTime,
      });

      // 지오펜스 목록 새로고침
      const updatedGeofences = await geofenceService.getList();
      setGeofences(updatedGeofences);

      Alert.alert('성공', `${data.name} 영역이 추가되었습니다.`);
      console.log('새로운 안전 영역 추가 성공');
    } catch (error) {
      console.error('지오펜스 추가 실패:', error);
      Alert.alert('오류', '안전 영역 추가에 실패했습니다.');
    }
  };

  const handleGeofenceDelete = (geofenceId: number, geofenceName: string) => {
    Alert.alert(
      '지오펜스 삭제',
      `"${geofenceName}" 영역을 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await geofenceService.delete({ id: geofenceId });
              const updatedGeofences = await geofenceService.getList();
              setGeofences(updatedGeofences);
              Alert.alert('성공', '지오펜스가 삭제되었습니다.');
              console.log('지오펜스 삭제 성공:', geofenceId);
            } catch (error) {
              console.error('지오펜스 삭제 실패:', error);
              Alert.alert('오류', '지오펜스 삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const getCurrentDisplayLocation = (): UserLocation | null => {
    // 보호자: 이용자의 위치 표시
    if (userRole === 'supporter' && targetLocation) {
      return {
        lat: targetLocation.latitude,
        lng: targetLocation.longitude,
        name: '이용자',
        status: isWebSocketConnected ? 'tracking' : 'idle',
      };
    }

    // 이용자: 자신의 위치 표시
    if (userRole === 'user' && currentLocation) {
      return {
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
        name: '내 위치',
        status: isTracking ? 'tracking' : 'idle',
      };
    }

    return null;
  }; // getCurrentDisplayLocation 닫는 괄호


  const userLocation = getCurrentDisplayLocation();

  const getLocationFreshnessMessage = () => {
    const location = userRole === 'supporter' ? targetLocation : currentLocation;
    if (!location?.timestamp) return null;

    const now = Date.now();
    const diffMs = now - location.timestamp;
    if (diffMs < 0) return null;

    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes <= 10) {
      return '사용자의 현 위치입니다.';
    }

    return `마지막으로 확인된 위치: 약 ${diffMinutes}분 전`;
  };

  const locationFreshnessMessage = getLocationFreshnessMessage();

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-green-50">
        <Text style={{ fontFamily: 'System' }} className="text-gray-700 text-lg">위치 정보를 불러오는 중...</Text>
      </SafeAreaView>
    );
  } // if 닫는 괄호

  if (locationError) {
     return (
      <SafeAreaView className="flex-1 justify-center items-center bg-green-50 p-5">
        <Text style={{ fontFamily: 'System' }} className="text-red-600 text-lg text-center mb-4">오류 발생</Text>
        <Text style={{ fontFamily: 'System' }} className="text-gray-700 text-base text-center">{locationError}</Text>
        {locationError.includes("권한") && (
          <TouchableOpacity
            className="mt-6 bg-green-600 px-6 py-3 rounded-lg"
            onPress={() => Linking.openSettings()}
          >
            <Text style={{ fontFamily: 'System' }} className="text-white font-medium">설정으로 이동</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    );
  } // if 닫는 괄호

  if (userRole === null) {
     return (
      <SafeAreaView className="flex-1 justify-center items-center bg-green-50">
        <Text style={{ fontFamily: 'System' }} className="text-gray-700 text-lg">역할 정보를 확인 중입니다...</Text>
      </SafeAreaView>
    );
  } // if 닫는 괄호

  if (!userLocation) {
      return (
      <SafeAreaView className="flex-1 justify-center items-center bg-green-50">
        <Text style={{ fontFamily: 'System' }} className="text-gray-700 text-lg">현재 위치를 찾는 중...</Text>
      </SafeAreaView>
    );
  } // if 닫는 괄호

  const region = { // userLocation이 있다는 것이 보장됨
    latitude: userLocation.lat,
    longitude: userLocation.lng,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  }; // region 객체 닫는 괄호


  const FloatingButtons: React.FC = () => (
    <View style={styles.fabContainer} pointerEvents="box-none">
      <TouchableOpacity
        style={[styles.fab, styles.fabSecondary]}
        onPress={() => setIsGeofenceModalVisible(true)}
        activeOpacity={0.85}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Plus size={24} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.fab, styles.fabPrimary]}
        onPress={moveToMyLocation}
        activeOpacity={0.85}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <MapPin size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  ); // FloatingButtons 닫는 괄호

  const renderMapView = (roleSpecificTitle: string) => (
    <MapView
      ref={mapRef}
      provider={PROVIDER_GOOGLE}
      style={{ flex: 1 }}
      region={region}
      customMapStyle={customMapStyle}
      showsCompass={false}
      showsUserLocation={false}
      showsMyLocationButton={false}
      toolbarEnabled={false}
    >
      {userLocation && (
        <Marker
          coordinate={{
            latitude: userLocation.lat,
            longitude: userLocation.lng,
          }}
          title={userLocation.name}
          description={isTracking ? "실시간 추적 중" : "현재 위치"}
          anchor={{ x: 0.5, y: 1 }}
          tracksViewChanges={tracksViewChanges}
        >
          <Image
            source={require('../assets/images/mappin.png')}
            style={{
              width: 35,
              height: 35,
              resizeMode: 'contain',
            }}
            onLoad={() => setTracksViewChanges(false)}
          />
        </Marker>
      )}

      {/* 지오펜스 Circle과 Marker 렌더링 */}
      {geofences.map((fence) => (
        <React.Fragment key={fence.id}>
          <Circle
            center={{ latitude: fence.latitude, longitude: fence.longitude }}
            radius={200} // 기본 반경 200미터
            strokeColor="rgba(37, 235, 103, 0.5)"
            strokeWidth={2}
            fillColor="rgba(37, 235, 103, 0.15)"
          />
          <Marker
            coordinate={{ latitude: fence.latitude, longitude: fence.longitude }}
            title={fence.name}
            description={`${fence.address} (${fence.type === 0 ? '영구' : '일시적'})`}
            pinColor={fence.type === 0 ? '#25eb67' : '#04faac'}
            onCalloutPress={() => handleGeofenceDelete(fence.id, fence.name)}
          />
        </React.Fragment>
      ))}
    </MapView>
  ); // renderMapView 닫는 괄호

  const headerText = userRole === 'user' ? '내 위치' : '이용자 위치';
  const baseHeaderSubText = userRole === 'user'
    ? (isTracking
        ? `GPS 데이터 수집 중${isWebSocketConnected ? ' • 서버 연결됨' : ' • 서버 연결 안됨'}`
        : 'GPS 미작동 중')
    : (isWebSocketConnected && targetLocation
        ? '선택한 이용자의 위치를 표시합니다.'
        : isWebSocketConnected
          ? '이용자 위치 대기 중...'
          : '서버 연결 안됨');

  const headerSubText = locationFreshnessMessage
    ? `${baseHeaderSubText}\n${locationFreshnessMessage}`
    : baseHeaderSubText;

  return (
    <SafeAreaView className="flex-1 bg-green-50">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      <View className="bg-white/90" style={{ paddingTop: StatusBar.currentHeight || 0 }}>
        <View className="p-3">
          <View className="border border-green-400 rounded-xl p-3 bg-green-50/50">
            <Text style={{ fontFamily: 'System' }} className="text-lg font-bold text-green-800 text-center">{headerText}</Text>
            <Text style={{ fontFamily: 'System' }} className="text-sm text-green-600 text-center mt-1">{headerSubText}</Text>
          </View>
        </View>
      </View>
      <View className="flex-1 relative">
        {renderMapView(userLocation.name)}
        <FloatingButtons />
        <BottomNavigation currentScreen="MapPage" />
        <GeofenceModal
           visible={isGeofenceModalVisible}
           onClose={() => setIsGeofenceModalVisible(false)}
           onSave={handleGeofenceSave}
           initialLocation={currentLocation ? {
             latitude: currentLocation.latitude,
             longitude: currentLocation.longitude
           } : undefined}
         />
      </View>
    </SafeAreaView>
  ); // return 닫는 괄호
}; // MainPage 컴포넌트 닫는 괄호

export default MainPage;

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: Platform.OS === 'ios' ? 110 : 90,
    alignItems: 'center',
    zIndex: 50,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  fabPrimary: {
    backgroundColor: '#27f572ff',
  },
  fabSecondary: {
    backgroundColor: '#04faacff',
  },
}); // StyleSheet 닫는 괄호
