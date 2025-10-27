import Global from '@/constants/Global';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import * as Location from 'expo-location';
import {
  MapPin,
  Navigation,
  Plus,
  User
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

  // 1. moveToLocation 먼저 정의
  const moveToLocation = useCallback((location: RealTimeLocation) => {
    mapRef.current?.animateToRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 1000);
  }, []);

  // 2. startLocationTracking 정의, moveToLocation 의존
  const startLocationTracking = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationState(prev => ({
          ...prev,
          error: '위치 권한이 필요합니다.',
        }));
        return;
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
        },
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
      setLocationState(prev => ({
        ...prev,
        error: '실시간 위치 추적 중 오류가 발생했습니다.',
      }));
    }
  }, [moveToLocation]);

  // 초기 위치 권한 요청 및 초기화, startLocationTracking, moveToLocation 의존
  useEffect(() => {
    const initializeLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          setLocationState(prev => ({
            ...prev,
            error: '위치 접근 권한이 필요합니다. 설정에서 권한을 허용해주세요.',
          }));
          return;
        }

        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

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
        setLocationState(prev => ({
          ...prev,
          error: '위치 정보를 가져올 수 없습니다. GPS가 활성화되어 있는지 확인해주세요.',
        }));
      }
    };

    initializeLocation();
  }, [startLocationTracking, moveToLocation]);

  // 앱 상태 변화 감지 - 백그라운드 진입 시 위치 추적 중지
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background' && locationState.isTracking) {
        stopLocationTracking();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [locationState.isTracking]);

  // 컴포넌트 언마운트 시 위치 추적 해제
  useEffect(() => {
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
    };
  }, []);

  // 사용자 역할 초기 설정
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
        }, {
          headers: {
            'Content-Type': 'application/json',
          }
        });

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

  // 위치 추적 중지 함수
  const stopLocationTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }

    setLocationState(prev => ({
      ...prev,
      isTracking: false,
      isLoading: false,
    }));

    Alert.alert('추적 중지', '실시간 위치 추적이 중지되었습니다.');
  };

  // 내 위치로 지도 이동 (현재 위치 또는 새 위치 요청)
  const moveToMyLocation = async () => {
    if (locationState.currentLocation) {
      moveToLocation(locationState.currentLocation);
    } else {
      try {
        setLocationState(prev => ({ ...prev, isLoading: true }));

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const realTimeLocation: RealTimeLocation = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          accuracy: currentLocation.coords.accuracy || 0,
          timestamp: currentLocation.timestamp,
        };

        setLocationState(prev => ({
          ...prev,
          currentLocation: realTimeLocation,
          isLoading: false,
        }));

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

  // 현재 표시할 위치 결정 (실시간 위치 우선)
  const getCurrentDisplayLocation = (): UserLocation | null => {
    if (locationState.currentLocation) {
      return {
        lat: locationState.currentLocation.latitude,
        lng: locationState.currentLocation.longitude,
        name: userRole === 'user' ? '내 위치' : '이용자 현재 위치',
        status: 'active',
      };
    }
    return null;
  };

  const userLocation = getCurrentDisplayLocation();

  if (!userLocation) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-700 text-lg">위치 정보를 불러오는 중입니다. 잠시만 기다려 주세요</Text>
      </SafeAreaView>
    );
  }

  const region = {
    latitude: userLocation.lat,
    longitude: userLocation.lng,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  // --- Floating Buttons: 오른쪽 아래, 위: 영역추가, 아래: 현위치 ---
  const FloatingButtons: React.FC = () => (
    <View style={styles.fabContainer} pointerEvents="box-none">
      <TouchableOpacity
        style={[styles.fab, styles.fabSecondary]}
        onPress={() => setIsGeofenceModalVisible(true)}
        activeOpacity={0.85}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Plus size={20} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.fab, styles.fabPrimary]}
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
        <SafeAreaView className="flex-1 bg-gray-50">
          <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

          {/* 상단 헤더 */}
          <View className="bg-white shadow-lg p-2">
            <View className="items-center">
              <Text className="text-xl font-bold text-gray-900 mb-1">내 위치</Text>
              <Text className="text-sm text-gray-500">
                {locationState.isTracking ? '원활한서비스를 위해 GPS 데이터를 수집 중 입니다.' : 'GPS 미작동 중 '}
              </Text>
              {locationState.error && (
                  <Text className="text-xs text-red-500 mt-1">{locationState.error}</Text>
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
                showsCompass={false}
                showsUserLocation={false}
                showsMyLocationButton={false}
                toolbarEnabled={false}
            >
              <Marker
                  coordinate={{
                    latitude: userLocation.lat,
                    longitude: userLocation.lng,
                  }}
                  title="내 위치"
                  description={locationState.isTracking ? "실시간 추적 중" : "현재 위치"}
                  anchor={{ x: 0.5, y: 1 }}  // 가로 중앙, 세로 하단 기준점
              >
                <View style={{ alignItems: 'center', width: 40 }}>
                  <View className={`p-3 rounded-full shadow-lg border-4 border-white ${
                      locationState.isTracking ? 'bg-green-500' : 'bg-blue-500'
                  }`}>
                    <Navigation size={10} color="white" />
                  </View>
                  <View className="mt-1 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200">
                    <Text className="text-xs font-medium text-gray-700">{userLocation.name}</Text>
                  </View>
                </View>
              </Marker>
            </MapView>

            <FloatingButtons />

            <BottomNavigation currentScreen="MapPage" />
            
            {/* 지오펜스 모달 - 원래대로 GeofenceModal 직접 사용 */}
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

  if (userRole === 'supporter') {
    return (
        <SafeAreaView className="flex-1 bg-gray-50">
          <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

          {/* 상단 헤더 */}
          <View className="bg-white shadow-lg p-6">
            <View className="items-center">
              <Text className="text-2xl font-bold text-gray-900 mb-1">사용자 위치</Text>
              <Text className="text-sm text-gray-500">
                {locationState.isTracking ? '보호자께서 선택하신 이용자의 위치를 표시 중입니다.' : 'GPS 미작동 중 '}
              </Text>
              {locationState.error && (
                  <Text className="text-xs text-red-500 mt-1">{locationState.error}</Text>
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
                showsCompass={false}
                showsUserLocation={false}
                showsMyLocationButton={false}
                toolbarEnabled={false}
            >
              {/* 이용자 마커 */}
              <Marker
                coordinate={{
                  latitude: userLocation.lat,
                  longitude: userLocation.lng,
                }}
                  title={userLocation.name}
                  description={locationState.isTracking ? "실시간 추적 중" : "이용자 위치"}
                  anchor={{ x: 0.5, y: 1 }}  // 가로 중앙, 세로 하단 기준점
                >
                  <View style={{ alignItems: 'center', width: 40 }}>
                  <View className={`p-3 rounded-full shadow-lg border-4 border-white ${
                      locationState.isTracking ? 'bg-green-500' : 'bg-blue-500'
                  }`}>
                    <User size={10} color="white" />
                  </View>
                  <View className="mt-1 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200">
                    <Text className={`text-xs font-medium ${
                        locationState.isTracking ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {userLocation.name}
                    </Text>
                  </View>
                </View>
              </Marker>
            </MapView>

            <FloatingButtons />

            <BottomNavigation currentScreen="MapPage" />
            
            {/* 지오펜스 모달 - 원래대로 GeofenceModal 직접 사용 */}
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
};

export default MainPage;

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    right: 16,
    bottom: Platform.OS === 'ios' ? 200 : 100, // 하단 네비, safe area 여유
    alignItems: 'center',
    zIndex: 50,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20, // 버튼 간 간격
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  fabPrimary: {
    backgroundColor: '#2563eb',
  },
  fabSecondary: {
    backgroundColor: '#6eec6eff',
  },
  fabAdd: {
    backgroundColor: '#0ea5a8',
  },
});

//디자인 : 전체적인 색감, 영역추가(우편주소 추가), 네비게이션 바 바꾸기, 캘린더 수정, 마이페이지 
// 