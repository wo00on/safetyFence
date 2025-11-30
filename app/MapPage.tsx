import Global from '@/constants/Global';
import { customMapStyle } from '@/styles/MapPageStyles';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useLocation } from '../contexts/LocationContext';
import { geofenceService } from '../services/geofenceService';

import {
  MapPin, // FAB 버튼용 MapPin은 유지
  Plus,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image, // Image 컴포넌트 임포트 확인
  Linking, // 설정으로 이동하기 위한 Linking 추가
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'; // react-native 임포트 정리
import MapView, { Callout, Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps'; // Callout, Circle 추가
import { SafeAreaView } from 'react-native-safe-area-context';
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
    geofences,
    loadGeofences,
  } = useLocation();

  const router = useRouter(); // useRouter 초기화

  const mapRef = useRef<MapView>(null);

  // Animation setup
  const animatedValue = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const animatedStyle = {
    transform: [
      {
        translateY: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -10], // Bounces 10px up
        }),
      },
    ],
  };

  const shadowAnimatedStyle = {
    opacity: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 0.2], // Higher animated opacity range
    }),
    transform: [
      {
        scale: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.8],
        }),
      },
    ],
  };

  // MapPage만의 로컬 상태
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isGeofenceModalVisible, setIsGeofenceModalVisible] = useState(false);
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  const moveToLocation = useCallback((location: RealTimeLocation) => {
    mapRef.current?.animateToRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.0005,
      longitudeDelta: 0.0005,
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


  // 화면 focus 시 지오펜스 목록 로드
  useFocusEffect(
    useCallback(() => {
      if (userRole) {
        loadGeofences();
      }
    }, [userRole, loadGeofences])
  );

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

      // 보호자 모드인 경우 선택한 이용자 번호 가져오기
      const targetNumber = userRole === 'supporter' && Global.TARGET_NUMBER
        ? Global.TARGET_NUMBER
        : undefined;

      // API 호출: POST /geofence/newFence
      await geofenceService.create({
        name: data.name,
        address: data.address,
        type: apiType,
        startTime,
        endTime,
      }, targetNumber);

      // LocationContext의 지오펜스 목록 새로고침
      await loadGeofences();

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
              const targetNumber = userRole === 'supporter' && Global.TARGET_NUMBER
                ? Global.TARGET_NUMBER
                : undefined;

              await geofenceService.delete({ id: geofenceId }, targetNumber);

              // LocationContext의 지오펜스 목록 새로고침
              await loadGeofences();

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

  useEffect(() => {
    if (!userLocation) {
      return;
    }
    setTracksViewChanges(true);
    const timeout = setTimeout(() => setTracksViewChanges(false), 600);
    return () => clearTimeout(timeout);
  }, [userLocation]);

  const getSupporterDisplayLabel = () => {
    const relation = (Global.TARGET_RELATION || '').trim();
    if (relation) {
      return relation;
    }
    if (Global.TARGET_NUMBER) {
      return Global.TARGET_NUMBER;
    }
    return '이용자';
  };

  const supporterDisplayLabel = getSupporterDisplayLabel();

  const formatRelativeTime = (diffMs: number) => {
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) {
      return '방금 전';
    }
    if (diffMinutes < 60) {
      return `약 ${diffMinutes}분 전`;
    }
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `약 ${diffHours}시간 전`;
    }
    const diffDays = Math.floor(diffHours / 24);
    return `약 ${diffDays}일 전`;
  };

  const getLocationFreshnessMessage = () => {
    const location = userRole === 'supporter' ? targetLocation : currentLocation;
    if (!location?.timestamp) return null;

    const diffMs = Date.now() - location.timestamp;
    if (diffMs < 0) return null;

    if (diffMs < 60000) {
      return userRole === 'supporter'
        ? `${supporterDisplayLabel}의 위치는 방금 전 업데이트되었습니다.`
        : '내 위치는 방금 전 업데이트되었습니다.';
    }

    const relative = formatRelativeTime(diffMs);
    return userRole === 'supporter'
      ? `마지막으로 확인된 ${supporterDisplayLabel}의 위치: ${relative}`
      : `마지막으로 확인된 위치: ${relative}`;
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



  const headerText = userRole === 'user'
    ? '내 위치'
    : Global.TARGET_NUMBER
      ? `${supporterDisplayLabel}의 위치`
      : '이용자 위치';
  const baseHeaderSubText = userRole === 'user'
    ? (isTracking
        ? `GPS 데이터 수집 중${isWebSocketConnected ? ' • 서버 연결됨' : ' • 서버 연결 안됨'}`
        : 'GPS 미작동 중')
    : (!Global.TARGET_NUMBER
        ? '추적할 이용자를 선택해주세요.'
        : !isWebSocketConnected
          ? `${supporterDisplayLabel}의 위치 정보를 받지 못하고 있습니다.`
          : targetLocation
            ? `${supporterDisplayLabel}의 위치를 지도에 표시하고 있습니다.`
            : `${supporterDisplayLabel}의 위치 데이터를 수신하는 중입니다...`);

  const headerSubText = locationFreshnessMessage
    ? `${baseHeaderSubText}\n${locationFreshnessMessage}`
    : baseHeaderSubText;

  return (
    <View className="flex-1 bg-green-50">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      
      {/* MapView가 전체 배경을 차지하도록 설정 */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        region={region}
        customMapStyle={customMapStyle}
        showsCompass={false}
        showsUserLocation={false}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        loadingEnabled={true}
        loadingIndicatorColor="#22c55e"
        moveOnMarkerPress={false}
        zoomEnabled={true}
        scrollEnabled={true}
        pitchEnabled={false}
        rotateEnabled={false}
      >
        {userLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.lat,
              longitude: userLocation.lng,
            }}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={tracksViewChanges}
          >
            <View
              style={styles.markerWrapper}
              collapsable={false}
              pointerEvents="none"
            >
              <Animated.View style={animatedStyle}>
                <Image
                  source={require('../assets/images/mappin1.png')}
                  style={styles.markerImage}
                />
              </Animated.View>
              <Animated.View style={[styles.shadow, shadowAnimatedStyle]} />
            </View>
            <Callout tooltip>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{userLocation.name}</Text>
                <Text style={styles.calloutDescription}>
                  {isTracking ? "실시간 추적 중" : "현재 위치"}
                </Text>
              </View>
            </Callout>
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
              pinColor={fence.type === 0 ? '#8fffb4ff' : '#04faac'}
              onCalloutPress={() => handleGeofenceDelete(fence.id, fence.name)}
            />
          </React.Fragment>
        ))}
      </MapView>

      {/* Header (상단에 오버레이) */}
      <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0 }} edges={['top']}>
        <View className="p-3">
          <View
            className="border border-green-400 rounded-xl p-3 bg-white/90 shadow-md"
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontFamily: 'System' }} className="text-lg font-bold text-green-800 text-center">{headerText}</Text>
              <Text style={{ fontFamily: 'System' }} className="text-sm text-green-600 text-center mt-1">{headerSubText}</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* Floating Buttons and Bottom Navigation (하단에 오버레이) */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <FloatingButtons />
        <BottomNavigation currentScreen="MapPage" />
      </View>

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
  markerWrapper: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  markerImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  shadow: {
    backgroundColor: 'rgba(0,0,0,0.3)', // Darker shadow
    borderRadius: 30, // Larger borderRadius
    width: 10, // Wider shadow
    height: 8, // Taller shadow
    marginTop: -2, // Move slightly down
  },
  calloutContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    width: 140,
    borderColor: '#04faacff',
    borderWidth: 1,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 4,
    color: '#333',
  },
  calloutDescription: {
    fontSize: 14,
    textAlign: 'center',
    color: '#555',
  },
}); // StyleSheet 닫는 괄호
