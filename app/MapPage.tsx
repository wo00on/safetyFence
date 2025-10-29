import Global from '@/constants/Global';
import { customMapStyle } from '@/styles/MapPageStyles';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import * as Location from 'expo-location';
import {
  MapPin,
  Plus,
  User,
  Users, // [수정] Navigation 대신 Users 임포트
} from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
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
interface GeofenceData {
  id: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  radius: number;
  type?: 'permanent' | 'temporary';
}
interface UserLocation {
  lat: number;
  lng: number;
  name: string;
  status: string;
}
type UserRole = 'user' | 'supporter' | null;
interface MainPageProps {}

const MainPage: React.FC<MainPageProps> = () => {
  const navigation = useNavigation();

  const mapRef = useRef<MapView>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  const [userRole, setUserRole] = useState<UserRole>(null);
  const [geofences, setGeofences] = useState<GeofenceData[]>([]);
  const [isGeofenceModalVisible, setIsGeofenceModalVisible] = useState(false);

  const [locationState, setLocationState] = useState<LocationTrackingState>({
    isTracking: false,
    currentLocation: null,
    locationHistory: [],
    error: null,
    isLoading: false,
  });

  // (모든 핸들러 및 useEffect 로직은 이전과 동일)
  const moveToLocation = useCallback((location: RealTimeLocation) => {
    mapRef.current?.animateToRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 1000);
  }, []);

  const startLocationTracking = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationState(prev => ({ ...prev, error: '위치 권한이 필요합니다.' }));
        return;
      }
      const subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000 },
        (newLocation) => {
          const realTimeLocation: RealTimeLocation = {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
            accuracy: newLocation.coords.accuracy || 0,
            timestamp: newLocation.timestamp,
            speed: newLocation.coords.speed || undefined,
            heading: newLocation.coords.heading || undefined,
          };
          setLocationState(prev => ({
            ...prev,
            currentLocation: realTimeLocation,
            locationHistory: [...prev.locationHistory.slice(-19), realTimeLocation],
            isTracking: true,
          }));
          moveToLocation(realTimeLocation);
        }
      );
      locationSubscription.current = subscription;
    } catch (error) {
      console.error('실시간 추적 실패:', error);
      setLocationState(prev => ({ ...prev, error: '실시간 위치 추적 중 오류가 발생했습니다.' }));
    }
  }, [moveToLocation]);

  useEffect(() => {
    const initializeLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationState(prev => ({ ...prev, error: '위치 접근 권한이 필요합니다. 설정에서 권한을 허용해주세요.' }));
          return;
        }
        const initialLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const realTimeLocation: RealTimeLocation = {
          latitude: initialLocation.coords.latitude,
          longitude: initialLocation.coords.longitude,
          accuracy: initialLocation.coords.accuracy || 0,
          timestamp: initialLocation.timestamp,
          speed: initialLocation.coords.speed || undefined,
          heading: initialLocation.coords.heading || undefined,
        };
        setLocationState(prev => ({
          ...prev,
          currentLocation: realTimeLocation,
          locationHistory: [realTimeLocation],
          error: null,
        }));
        moveToLocation(realTimeLocation);
        await startLocationTracking();
      } catch (error) {
        console.error('위치 초기화 오류:', error);
        setLocationState(prev => ({ ...prev, error: '위치 정보를 가져올 수 없습니다. GPS가 활성화되어 있는지 확인해주세요.' }));
      }
    };
    initializeLocation();
  }, [startLocationTracking, moveToLocation]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background' && locationState.isTracking) {
        stopLocationTracking();
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [locationState.isTracking]);

  useEffect(() => {
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
    };
  }, []);

  useEffect(() => {
    try {
      const role = Global.USER_ROLE;
      if (role === 'user' || role === 'supporter') {
        setUserRole(role);
      } else {
        setUserRole(null);
        console.warn('사용자 역할 오류 발생:', role);
      }
    } catch (error) {
      console.error('역할 가져오기 실패:', error);
    }
  }, []);

  useEffect(() => {
    const sendLocationToServer = async (location: RealTimeLocation) => {
      try {
        const httpResponse = await axios.post(`${Global.URL}/user/getUserLocation`, {
          number: Global.NUMBER,
          latitude: location.latitude,
          longitude: location.longitude,
        }, { headers: { 'Content-Type': 'application/json' } });
        console.log('위치 전송 성공:', httpResponse.data, ', 전송 데이터: ', location);
      } catch (error) {
        console.error('서버 위치 전송 중 오류:', error);
      }
    };
    const intervalId = setInterval(() => {
      if (locationState.currentLocation) {
        sendLocationToServer(locationState.currentLocation);
      }
    }, 5000);
    return () => clearInterval(intervalId);
  }, [locationState.currentLocation]);

  const stopLocationTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    setLocationState(prev => ({ ...prev, isTracking: false, isLoading: false }));
    Alert.alert('추적 중지', '실시간 위치 추적이 중지되었습니다.');
  };

  const moveToMyLocation = async () => {
    if (locationState.currentLocation) {
      moveToLocation(locationState.currentLocation);
    } else {
      try {
        setLocationState(prev => ({ ...prev, isLoading: true }));
        const currentLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const realTimeLocation: RealTimeLocation = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          accuracy: currentLocation.coords.accuracy || 0,
          timestamp: currentLocation.timestamp,
        };
        setLocationState(prev => ({ ...prev, currentLocation: realTimeLocation, isLoading: false }));
        moveToLocation(realTimeLocation);
      } catch (error) {
        console.error('현재 위치 가져오기 오류 발생:', error);
        setLocationState(prev => ({ ...prev, isLoading: false }));
        Alert.alert('오류', '현재 위치를 가져올 수 없습니다.');
      } 
    }
  };

  const navigateToScreen = (screenName: string): void => {
    navigation.navigate(screenName as never);
  };

  const handleGeofenceSave = (data: Omit<GeofenceData, 'id' | 'radius'>) => {
    const newGeofence: GeofenceData = {
      ...data,
      id: Date.now().toString(),
      radius: 100, // 기본 반경 100미터
    };
    setGeofences(prev => [...prev, newGeofence]);
    console.log('새로운 안전 영역 추가:', newGeofence);
    Alert.alert('성공', `${newGeofence.name} 영역이 추가되었습니다.`);
  };

  const getCurrentDisplayLocation = (): UserLocation | null => {
    if (locationState.currentLocation) {
      return {
        lat: locationState.currentLocation.latitude,
        lng: locationState.currentLocation.longitude,
        name: userRole === 'user' ? '내 위치' : '이용자', // [수정] 이름 간결하게
        status: 'active',
      };
    }
    return null;
  };

  const userLocation = getCurrentDisplayLocation();

  if (!userLocation) {
    return (
      // [수정] 로딩 페이지 배경색 변경 및 폰트 적용
      <SafeAreaView className="flex-1 justify-center items-center bg-white-50">
        <Text style={{ fontFamily: 'System' }} className="text-gray-700 text-lg">위치 정보를 불러오는 중입니다.</Text>
      </SafeAreaView>
    );
  }

  const region = {
    latitude: userLocation.lat,
    longitude: userLocation.lng,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  const FloatingButtons: React.FC = () => (
    <View style={styles.fabContainer} pointerEvents="box-none">
      <TouchableOpacity
        style={[styles.fab, styles.fabSecondary]} // 영역 추가
        onPress={() => setIsGeofenceModalVisible(true)}
        activeOpacity={0.85}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Plus size={20} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.fab, styles.fabPrimary]} // 현위치
        onPress={moveToMyLocation}
        activeOpacity={0.85}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <MapPin size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  // 이용자인 경우 UI
  if (userRole === 'user') {
    return (
      // [수정] 배경색 변경
      <SafeAreaView className="flex-1 bg-green-50">
        <StatusBar barStyle="dark-content" backgroundColor="#eafaf1" /> {/* [수정] 헤더 색상과 맞춤 */}

        {/* [수정] 상단 헤더 디자인 변경 */}
        <View className="bg-green-100 shadow-md p-4">
          <View className="items-center">
            <Text style={{ fontFamily: 'System' }} className="text-xl font-bold text-green-800 mb-1">내 위치</Text>
            <Text style={{ fontFamily: 'System' }} className="text-sm text-green-600">
              {locationState.isTracking ? '원활한 서비스를 위해 GPS 데이터를 수집 중입니다.' : 'GPS 미작동 중 '}
            </Text>
            {locationState.error && (
                <Text style={{ fontFamily: 'System' }} className="text-xs text-red-500 mt-1">{locationState.error}</Text>
            )}
          </View>
        </View>

        {/* 지도 영역 */}
        <View className="flex-1 relative">
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={{ flex: 1 }}
            initialRegion={region}
            customMapStyle={customMapStyle} // [추가] 커스텀 지도 스타일 적용
            showsCompass={false}
            showsUserLocation={false}
            showsMyLocationButton={false}
            toolbarEnabled={false}
          >
            {/* [수정] 이용자 마커 디자인 변경 */}
            <Marker
              coordinate={{
                latitude: userLocation.lat,
                longitude: userLocation.lng,
              }}
              title="내 위치"
              description={locationState.isTracking ? "실시간 추적 중" : "현재 위치"}
              anchor={{ x: 0.5, y: 1 }}
            >
              <View style={{ alignItems: 'center' }}>
                <View className={`p-3 rounded-full shadow-lg border-4 border-green-100 ${
                    locationState.isTracking ? 'bg-green-600' : 'bg-green-500'
                  }`}>
                  <User size={12} color="white" /> {/* [수정] Navigation -> User 아이콘 */}
                </View>
                <View className="mt-1 bg-green-50 px-3 py-1 rounded-full shadow-sm border border-green-200">
                  <Text style={{ fontFamily: 'System' }} className="text-xs font-medium text-green-800">{userLocation.name}</Text>
                </View>
              </View>
            </Marker>
            {/* TODO: geofences 렌더링 */}
          </MapView>

          <FloatingButtons />

          <BottomNavigation currentScreen="MapPage" />
          
          <GeofenceModal
            visible={isGeofenceModalVisible}
            onClose={() => setIsGeofenceModalVisible(false)}
            onSave={handleGeofenceSave}
            initialLocation={locationState.currentLocation ? {
              latitude: locationState.currentLocation.latitude,
              longitude: locationState.currentLocation.longitude
            } : undefined}
          />
        </View>
      </SafeAreaView>
    );
  }

  // 보호자인 경우 UI
  if (userRole === 'supporter') {
    return (
      // [수정] 배경색 변경
      <SafeAreaView className="flex-1 bg-green-50">
        <StatusBar barStyle="dark-content" backgroundColor="#eafaf1" /> {/* [수정] 헤더 색상과 맞춤 */}

        {/* [수정] 상단 헤더 디자인 변경 (p-6 -> p-4) */}
        <View className="bg-green-100 shadow-md p-4">
          <View className="items-center">
            <Text style={{ fontFamily: 'System' }} className="text-xl font-bold text-green-800 mb-1">이용자 위치</Text>
            <Text style={{ fontFamily: 'System' }} className="text-sm text-green-600">
              {locationState.isTracking ? '선택한 이용자의 위치를 실시간 표시합니다.' : 'GPS 미작동 중 '}
            </Text>
            {locationState.error && (
                <Text style={{ fontFamily: 'System' }} className="text-xs text-red-500 mt-1">{locationState.error}</Text>
            )}
          </View>
        </View>

        {/* 지도 영역 */}
        <View className="flex-1 relative">
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={{ flex: 1 }}
            initialRegion={region}
            customMapStyle={customMapStyle} // [추가] 커스텀 지도 스타일 적용
            showsCompass={false}
            showsUserLocation={false}
            showsMyLocationButton={false}
            toolbarEnabled={false}
          >
            {/* [수정] 보호자가 보는 이용자 마커 디자인 변경 */}
            <Marker
              coordinate={{
                latitude: userLocation.lat,
                longitude: userLocation.lng,
              }}
              title={userLocation.name}
              description={locationState.isTracking ? "실시간 추적 중" : "이용자 위치"}
              anchor={{ x: 0.5, y: 1 }}
            >
              <View style={{ alignItems: 'center' }}>
                <View className={`p-3 rounded-full shadow-lg border-4 border-green-100 ${
                    locationState.isTracking ? 'bg-green-600' : 'bg-green-500'
                  }`}>
                  <Users size={12} color="white" /> {/* [수정] User -> Users 아이콘 */}
                </View>
                <View className="mt-1 bg-green-50 px-3 py-1 rounded-full shadow-sm border border-green-200">
                  <Text style={{ fontFamily: 'System' }} className="text-xs font-medium text-green-800">
                    {userLocation.name}
                  </Text>
                </View>
              </View>
            </Marker>
            {/* TODO: geofences 렌더링 */}
          </MapView>

          <FloatingButtons />

          <BottomNavigation currentScreen="MapPage" />
          
          <GeofenceModal
            visible={isGeofenceModalVisible}
            onClose={() => setIsGeofenceModalVisible(false)}
            onSave={handleGeofenceSave}
            initialLocation={locationState.currentLocation ? {
              latitude: locationState.currentLocation.latitude,
              longitude: locationState.currentLocation.longitude
            } : undefined}
          />
        </View>
      </SafeAreaView>
    );
  }

  // 역할 로딩 중
  return (
    <SafeAreaView className="flex-1 justify-center items-center bg-green-50">
      <Text style={{ fontFamily: 'System' }} className="text-gray-700 text-lg">역할 정보를 불러오는 중입니다.</Text>
    </SafeAreaView>
  );
};

export default MainPage;

// [수정] StyleSheet 색상 및 간격 변경
const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    right: 20, // 간격 살짝 조정
    bottom: Platform.OS === 'ios' ? 110 : 90, // [수정] 네비게이션 바 높이 고려
    alignItems: 'center',
    zIndex: 50,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16, // [수정] 버튼 간 간격
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, // 그림자 약하게
    shadowOpacity: 0.1, // 그림자 약하게
    shadowRadius: 6,
  },
  fabPrimary: {
    backgroundColor: '#16a34a', // [수정] green-600
  },
  fabSecondary: {
    backgroundColor: '#059669', // [수정] emerald-600
  },
  // fabAdd는 사용되지 않으므로 제거
});