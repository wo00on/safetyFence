import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import {
  BarChart,
  Bell,
  Filter,
  Loader,
  Locate,
  MapPin,
  Navigation,
  Pause,
  Play,
  Search,
  User,
  Users,
  X,
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

const customMapStyle = [
  {
    featureType: 'all',
    elementType: 'geometry',
    stylers: [
      {
        color: '#f5f5f5'
      }
    ]
  },
  {
    featureType: 'all',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#616161'
      }
    ]
  },
  {
    featureType: 'all',
    elementType: 'labels.text.stroke',
    stylers: [
      {
        color: '#f5f5f5'
      }
    ]
  },
  {
    featureType: 'administrative.land_parcel',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#bdbdbd'
      }
    ]
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [
      {
        color: '#eeeeee'
      }
    ]
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#757575'
      }
    ]
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [
      {
        color: '#e5f3e5'
      }
    ]
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#4a7c59'
      }
    ]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [
      {
        color: '#ffffff'
      }
    ]
  },
  {
    featureType: 'road.arterial',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#757575'
      }
    ]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [
      {
        color: '#dadada'
      }
    ]
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#616161'
      }
    ]
  },
  {
    featureType: 'road.local',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#9e9e9e'
      }
    ]
  },
  {
    featureType: 'transit.line',
    elementType: 'geometry',
    stylers: [
      {
        color: '#e5e5e5'
      }
    ]
  },
  {
    featureType: 'transit.station',
    elementType: 'geometry',
    stylers: [
      {
        color: '#eeeeee'
      }
    ]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [
      {
        color: '#c9e6f0'
      }
    ]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#4a7c59'
      }
    ]
  }
];


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

interface CareCenter {
  id: number;
  name: string;
  address: string;
  type: string;
  lat: number;
  lng: number;
  phone: string;
  rating: number;
}

interface UserLocation {
  lat: number;
  lng: number;
  name: string;
  status: string;
}

interface UserLocations {
  [key: string]: UserLocation;
}

type UserRole = 'user' | 'caregiver' | null;

const CARE_CENTERS: CareCenter[] = [
  {
    id: 1,
    name: '행복한 요양원',
    address: '서울특별시 강남구 테헤란로 123',
    type: '요양원',
    lat: 37.5665,
    lng: 126.978,
    phone: '02-1234-5678',
    rating: 4.5,
  },
  {
    id: 2,
    name: '건강한 노인복지센터',
    address: '서울특별시 서초구 서초대로 456',
    type: '복지센터',
    lat: 37.4979,
    lng: 127.0276,
    phone: '02-2345-6789',
    rating: 4.2,
  },
  {
    id: 3,
    name: '편안한 주야간보호센터',
    address: '서울특별시 송파구 올림픽로 789',
    type: '주야간보호센터',
    lat: 37.5145,
    lng: 127.1059,
    phone: '02-3456-7890',
    rating: 4.7,
  },
];

const USER_LOCATIONS: UserLocations = {
  '1': { lat: 37.5665, lng: 126.978, name: '김할머니', status: 'active' },
};

interface MainPageProps {}

const MainPage: React.FC<MainPageProps> = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as { userId?: string } | undefined;
  const userId = params?.userId || '1';

  const mapRef = useRef<MapView>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  const [selectedCenter, setSelectedCenter] = useState<CareCenter | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [userRole, setUserRole] = useState<UserRole>(null);

  // 실시간 위치 추적 관련 상태들
  const [locationState, setLocationState] = useState<LocationTrackingState>({
    isTracking: false,
    currentLocation: null,
    locationHistory: [],
    error: null,
    isLoading: false,
  });

  // 권한 요청 및 초기 위치 설정
  useEffect(() => {
    const initializeLocation = async () => {
      try {
        // 위치 권한 요청
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          setLocationState(prev => ({
            ...prev,
            error: '위치 접근 권한이 필요합니다. 설정에서 권한을 허용해주세요.',
          }));
          return;
        }

        // 초기 위치 한 번 가져오기 (빠른 응답을 위해)
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

        // 지도를 현재 위치로 이동
        moveToLocation(realTimeLocation);

      } catch (error) {
        console.error('위치 초기화 오류:', error);
        setLocationState(prev => ({
          ...prev,
          error: '위치 정보를 가져올 수 없습니다. GPS가 활성화되어 있는지 확인해주세요.',
        }));
      }
    };

    initializeLocation();
  }, []);

  // 앱 상태 변화 감지 (배터리 최적화)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background' && locationState.isTracking) {
        // 백그라운드로 갈 때 추적 일시 중지
        stopLocationTracking();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [locationState.isTracking]);

  // 컴포넌트 언마운트 시 추적 중지
  useEffect(() => {
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    const getUserRole = async () => {
      try {
        const role = await AsyncStorage.getItem('userRole') as UserRole;
        setUserRole(role);
      } catch (error) {
        console.error('역할 가져오기 실패:', error);
      }
    };
    getUserRole();
  }, []);

  // 실시간 위치 추적 시작
  const startLocationTracking = async () => {
    try {
      setLocationState(prev => ({ ...prev, isLoading: true, error: null }));

      // 위치 권한 재확인
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('위치 권한이 필요합니다.');
      }

      // 위치 추적 시작
      const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High, // 높은 정확도로 추적
            timeInterval: 3000, // 3초마다 업데이트
            distanceInterval: 5, // 5미터 이동시 업데이트
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
              locationHistory: [...prev.locationHistory.slice(-20), realTimeLocation], // 최근 20개 위치만 보관
              isLoading: false,
            }));

            // 지도 자동 추적 (옵션)
            // moveToLocation(realTimeLocation);
          }
      );

      locationSubscription.current = subscription;
      setLocationState(prev => ({
        ...prev,
        isTracking: true,
        isLoading: false,
        error: null
      }));

      Alert.alert('추적 시작', '실시간 위치 추적이 시작되었습니다.');

    } catch (error) {
      console.error('위치 추적 시작 오류:', error);
      setLocationState(prev => ({
        ...prev,
        isLoading: false,
        error: '위치 추적을 시작할 수 없습니다.',
      }));
      Alert.alert('오류', '위치 추적을 시작할 수 없습니다. 설정을 확인해주세요.');
    }
  };

  // 실시간 위치 추적 중지
  const stopLocationTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }

    setLocationState(prev => ({
      ...prev,
      isTracking: false,
      isLoading: false
    }));

    Alert.alert('추적 중지', '실시간 위치 추적이 중지되었습니다.');
  };

  // 특정 위치로 지도 이동
  const moveToLocation = (location: RealTimeLocation) => {
    mapRef.current?.animateToRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 1000);
  };

  const moveToMyLocation = async () => {
    if (locationState.currentLocation) {
      // 실시간 위치가 있으면 그것을 사용
      moveToLocation(locationState.currentLocation);
    } else {
      // 실시간 위치가 없으면 새로 가져오기
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
        console.error('현재 위치 가져오기 오류:', error);
        setLocationState(prev => ({ ...prev, isLoading: false }));
        Alert.alert('오류', '현재 위치를 가져올 수 없습니다.');
      }
    }
  };
  
  const handleSearch = (): void => {
    console.log('검색어:', searchQuery);
    Alert.alert('검색', `"${searchQuery}" 검색 결과를 찾고 있습니다.`);
  };

  const handleCenterPress = (center: CareCenter): void => {
    setSelectedCenter(center);
    mapRef.current?.animateToRegion({
      latitude: center.lat,
      longitude: center.lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  const handleCenterDetail = (): void => {
    if (selectedCenter) {
      Alert.alert('상세 정보', `${selectedCenter.name}의 상세 정보를 표시합니다.`);
    }
  };

  const navigateToScreen = (screenName: string): void => {
    navigation.navigate(screenName as never);
  };

  // 현재 위치 결정 (실시간 위치 우선, 없으면 모의 데이터)
  const getCurrentDisplayLocation = () => {
    if (locationState.currentLocation) {
      return {
        lat: locationState.currentLocation.latitude,
        lng: locationState.currentLocation.longitude,
        name: userRole === 'user' ? '내 위치' : '이용자 현재 위치',
        status: 'active'
      };
    }
    return USER_LOCATIONS[userId] || {
      lat: 37.5665,
      lng: 126.978,
      name: '사용자',
      status: 'active'
    };
  };

  const userLocation = getCurrentDisplayLocation();

  // 지도 영역
  const region = {
    latitude: userLocation.lat,
    longitude: userLocation.lng,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  // 실시간 추적 토글 버튼 컴포넌트
  const RealTimeTrackingButton = () => (
      <TouchableOpacity
          className={`absolute bottom-44 right-4 p-4 rounded-full shadow-lg border-2 ${
              locationState.isTracking
                  ? 'bg-red-500 border-red-200'
                  : 'bg-green-500 border-green-200'
          }`}
          onPress={locationState.isTracking ? stopLocationTracking : startLocationTracking}
          disabled={locationState.isLoading}
          style={{
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
          }}
      >
        {locationState.isLoading ? (
            <Loader size={24} color="white" />
        ) : locationState.isTracking ? (
            <Pause size={24} color="white" />
        ) : (
            <Play size={24} color="white" />
        )}
      </TouchableOpacity>
  );

  // 위치 정보 표시 컴포넌트
  const LocationInfoCard = () => {
    if (!locationState.currentLocation) return null;

    return (
        <View className="absolute top-20 left-4 right-4 bg-white rounded-2xl shadow-lg p-4 border border-gray-100"
              style={{
                elevation: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
              }}
        >
          <Text className="text-sm font-semibold text-gray-800 mb-2">실시간 위치 정보</Text>
          <Text className="text-xs text-gray-600">
            위도: {locationState.currentLocation.latitude.toFixed(6)}
          </Text>
          <Text className="text-xs text-gray-600">
            경도: {locationState.currentLocation.longitude.toFixed(6)}
          </Text>
          <Text className="text-xs text-gray-600">
            정확도: {locationState.currentLocation.accuracy.toFixed(0)}m
          </Text>
          {locationState.currentLocation.speed && (
              <Text className="text-xs text-gray-600">
                속도: {(locationState.currentLocation.speed * 3.6).toFixed(1)} km/h
              </Text>
          )}
          <Text className="text-xs text-gray-500 mt-1">
            업데이트: {new Date(locationState.currentLocation.timestamp).toLocaleTimeString()}
          </Text>
        </View>
    );
  };

  // 이용자인 경우 UI
  if (userRole === 'user') {
    return (
        <SafeAreaView className="flex-1 bg-gray-50">
          <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

          {/* 상단 헤더 */}
          <View className="bg-white shadow-lg p-6">
            <View className="items-center">
              <Text className="text-2xl font-bold text-gray-900 mb-1">내 위치</Text>
              <Text className="text-sm text-gray-500">
                {locationState.isTracking ? '실시간 추적 중' : '현재 위치를 확인하세요'}
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
                customMapStyle={customMapStyle}
                showsUserLocation={false}
                showsMyLocationButton={false}
                showsCompass={false}
                toolbarEnabled={false}
            >
              <Marker
                  coordinate={{
                    latitude: userLocation.lat,
                    longitude: userLocation.lng,
                  }}
                  title="내 위치"
                  description={locationState.isTracking ? "실시간 추적 중" : "현재 위치"}
              >
                <View className="items-center">
                  <View className={`p-3 rounded-full shadow-lg border-4 border-white ${
                      locationState.isTracking ? 'bg-green-500' : 'bg-blue-500'
                  }`}>
                    <Navigation size={20} color="white" />
                  </View>
                  <View className="mt-1 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200">
                    <Text className="text-xs font-medium text-gray-700">{userLocation.name}</Text>
                  </View>
                </View>
              </Marker>
            </MapView>

            {/* 위치 정보 카드 */}
            <LocationInfoCard />

            {/* 실시간 추적 버튼 */}
            <RealTimeTrackingButton />

            {/* 내 위치 버튼 */}
            <TouchableOpacity
                className="absolute bottom-32 right-4 bg-white p-4 rounded-full shadow-lg border border-gray-200"
                onPress={moveToMyLocation}
                style={{
                  elevation: 8,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                }}
            >
              <Locate size={24} color="#2563eb" />
            </TouchableOpacity>
          </View>

          {/* 하단 네비게이션 */}
          <View className="bg-white border-t border-gray-100 px-4 py-2"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: -2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 8,
                }}
          >
            <View className="flex-row justify-center space-x-12">
              <TouchableOpacity className="items-center py-3 px-4">
                <View className="bg-blue-50 p-2 rounded-full">
                  <MapPin size={24} color="#2563eb" />
                </View>
                <Text className="text-xs text-blue-600 mt-2 font-medium">지도</Text>
              </TouchableOpacity>

              <TouchableOpacity
                  className="items-center py-3 px-4"
                  onPress={() => navigateToScreen('Notifications')}
              >
                <View className="bg-gray-50 p-2 rounded-full">
                  <BarChart size={24} color="#6b7280" />
                </View>
                <Text className="text-xs text-gray-600 mt-2">알림</Text>
              </TouchableOpacity>

              <TouchableOpacity
                  className="items-center py-3 px-4"
                  onPress={() => navigateToScreen('MyPage')}
              >
                <View className="bg-gray-50 p-2 rounded-full">
                  <User size={24} color="#6b7280" />
                </View>
                <Text className="text-xs text-gray-600 mt-2">마이페이지</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
    );
  }

  return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

        {/* 상단 검색 바 */}
        <View className="bg-white shadow-lg px-4 py-6">
          <View className="flex-row items-center space-x-3">
            <View className="flex-1 relative">
              <View className="absolute left-4 top-4 z-10">
                <Search size={18} color="#9ca3af" />
              </View>
              <TextInput
                  className="bg-gray-50 rounded-2xl pl-12 pr-4 py-4 text-gray-900 border border-gray-100"
                  placeholder="요양원, 보호센터 검색..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                  style={{
                    fontSize: 16,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 2,
                  }}
              />
            </View>

            <TouchableOpacity
                className="bg-blue-600 px-6 py-4 rounded-2xl"
                onPress={handleSearch}
                style={{
                  shadowColor: '#2563eb',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 4,
                }}
            >
              <Text className="text-white font-semibold">검색</Text>
            </TouchableOpacity>

            <TouchableOpacity
                className="border border-gray-200 p-4 rounded-2xl bg-white"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 2,
                }}
            >
              <Filter size={18} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 지도 영역 */}
        <View className="flex-1 relative">
          <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={{ flex: 1 }}
              initialRegion={region}
              customMapStyle={customMapStyle}
              showsUserLocation={false}
              showsMyLocationButton={false}
              showsCompass={false}
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
            >
              <View className="items-center">
                <View className={`p-3 rounded-full shadow-lg border-4 border-white ${
                    locationState.isTracking ? 'bg-green-500' : 'bg-blue-500'
                }`}>
                  <User size={20} color="white" />
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

            {/* 요양원/보호센터 마커들 */}
            {CARE_CENTERS.map((center) => (
                <Marker
                    key={center.id}
                    coordinate={{
                      latitude: center.lat,
                      longitude: center.lng,
                    }}
                    title={center.name}
                    description={center.type}
                    onPress={() => handleCenterPress(center)}
                >
                  <View className="items-center">
                    <View className="bg-orange-500 p-3 rounded-full shadow-lg border-4 border-white">
                      <MapPin size={18} color="white" />
                    </View>
                    <View className="mt-1 bg-white px-2 py-0.5 rounded-full shadow-sm border border-gray-200">
                      <Text className="text-xs font-medium text-orange-600">{center.type}</Text>
                    </View>
                  </View>
                </Marker>
            ))}
          </MapView>

          {/* 위치 정보 카드 */}
          <LocationInfoCard />

          {/* 실시간 추적 버튼 */}
          <RealTimeTrackingButton />

          {/* 내 위치 버튼 */}
          <TouchableOpacity
              className="absolute bottom-32 right-4 bg-white p-4 rounded-full shadow-lg border border-gray-200"
              onPress={moveToMyLocation}
              style={{
                elevation: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
              }}
          >
            <Locate size={24} color="#2563eb" />
          </TouchableOpacity>

          {/* 선택된 센터 정보 카드 */}
          {selectedCenter && (
              <View className="absolute bottom-32 left-4 right-4 bg-white rounded-2xl shadow-2xl p-6 border border-gray-100"
                    style={{
                      elevation: 12,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.15,
                      shadowRadius: 12,
                    }}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-3">
                      <Text className="text-xl font-bold mr-3 text-gray-900">
                        {selectedCenter.name}
                      </Text>
                      <View className="bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                        <Text className="text-sm text-orange-700 font-medium">
                          {selectedCenter.type}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center mb-2">
                      <MapPin size={16} color="#6b7280" />
                      <Text className="text-sm text-gray-600 ml-2 flex-1">
                        {selectedCenter.address}
                      </Text>
                    </View>

                    <Text className="text-sm text-gray-600 mb-3">
                      전화: {selectedCenter.phone}
                    </Text>

                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center bg-yellow-50 px-3 py-1 rounded-full">
                        <Text className="text-yellow-500 text-lg">★</Text>
                        <Text className="text-sm ml-1 font-medium text-yellow-700">{selectedCenter.rating}</Text>
                      </View>

                      <TouchableOpacity
                          className="bg-blue-600 px-6 py-3 rounded-xl"
                          onPress={handleCenterDetail}
                          style={{
                            shadowColor: '#2563eb',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.2,
                            shadowRadius: 4,
                            elevation: 4,
                          }}
                      >
                        <Text className="text-white text-sm font-semibold">
                          상세 정보
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                      className="p-2 bg-gray-50 rounded-full ml-3"
                      onPress={() => setSelectedCenter(null)}
                  >
                    <X size={20} color="#9ca3af" />
                  </TouchableOpacity>
                </View>
              </View>
          )}
        </View>

        {/* 하단 네비게이션 - 보호자용 */}
        <View className="bg-white border-t border-gray-100 px-4 py-2"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 8,
              }}
        >
          <View className="flex-row justify-center space-x-6">
            <TouchableOpacity className="items-center py-3 px-4">
              <View className="bg-blue-50 p-2 rounded-full">
                <MapPin size={24} color="#2563eb" />
              </View>
              <Text className="text-xs text-blue-600 mt-2 font-medium">지도</Text>
            </TouchableOpacity>

            <TouchableOpacity
                className="items-center py-3 px-4"
                onPress={() => navigateToScreen('Users')}
            >
              <View className="bg-gray-50 p-2 rounded-full">
                <Users size={24} color="#6b7280" />
              </View>
              <Text className="text-xs text-gray-600 mt-2">이용자</Text>
            </TouchableOpacity>

            <TouchableOpacity
                className="items-center py-3 px-4"
                onPress={() => navigateToScreen('Notifications')}
            >
              <View className="bg-gray-50 p-2 rounded-full">
                <Bell size={24} color="#6b7280" />
              </View>
              <Text className="text-xs text-gray-600 mt-2">알림</Text>
            </TouchableOpacity>

            <TouchableOpacity
                className="items-center py-3 px-4"
                onPress={() => navigateToScreen('MyPage')}
            >
              <View className="bg-gray-50 p-2 rounded-full">
                <User size={24} color="#6b7280" />
              </View>
              <Text className="text-xs text-gray-600 mt-2">마이페이지</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
  );
};

export default MainPage;
