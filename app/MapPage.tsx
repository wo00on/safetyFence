import Global from '@/constants/Global';
import { customMapStyle } from '@/styles/MapPageStyles';
// 이미지 임포트 (경로 확인 필수!)
import mapPinImage from '../assets/images/mappin.png';

import axios, { isAxiosError } from 'axios';
import * as Location from 'expo-location';
import {
  MapPin, // FAB 버튼용 MapPin은 유지
  Plus,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  Image, // Image 컴포넌트 임포트 확인
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'; // react-native 임포트 정리
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'; // Marker 임포트 확인
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

const MainPage: React.FC = () => {
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
    isLoading: true, // 초기 로딩 상태 true
  });

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
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
         setLocationState(prev => ({ ...prev, isLoading: false, error: '지도 표시를 위해 위치 권한이 필요합니다. 설정에서 권한을 허용해주세요.' }));
         return;
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
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
            isLoading: false,
            error: null,
          }));
        }
      ); // watchPositionAsync 닫는 괄호
      locationSubscription.current = subscription;
    } catch (error) {
      console.error('실시간 위치 추적 시작 실패:', error);
      setLocationState(prev => ({ ...prev, isLoading: false, error: '실시간 위치 추적 중 오류가 발생했습니다.' }));
    }
  }, []); // useCallback 닫는 괄호


  useEffect(() => {
    const initializeApp = async () => {
      setLocationState(prev => ({ ...prev, isLoading: true }));
      try {
        const role = Global.USER_ROLE;
        if (role === 'user' || role === 'supporter') {
          setUserRole(role);
        } else {
          setUserRole(null);
          console.warn('유효하지 않은 사용자 역할:', role);
           setLocationState(prev => ({ ...prev, isLoading: false, error: '사용자 역할을 확인할 수 없습니다.' }));
          return;
        }

        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') {
           setLocationState(prev => ({ ...prev, isLoading: false, error: '지도 표시를 위해 위치 권한이 필요합니다.' }));
           return;
        }

        const initialLocation = await Location.getLastKnownPositionAsync();

        if (initialLocation) {
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
            isLoading: false,
          }));
          moveToLocation(realTimeLocation);
        } else {
           console.log("No last known location found, waiting for watchPosition...");
        }

        await startLocationTracking();

      } catch (error) {
        console.error('앱 초기화 오류:', error);
        setLocationState(prev => ({ ...prev, isLoading: false, error: '앱 초기화 중 오류가 발생했습니다.' }));
      }
    }; // initializeApp 닫는 괄호
    initializeApp();
  }, [startLocationTracking, moveToLocation]);


  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState.match(/inactive|background/) && locationState.isTracking) {
         console.log('App is in background.');
      } else if (nextAppState === 'active') {
        console.log('App is active.');
        if (!locationState.isTracking && userRole && !locationState.error) {
           // startLocationTracking(); // 필요하다면 추적 재시작
        }
      }
    }; // handleAppStateChange 닫는 괄호
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [locationState.isTracking, locationState.error, userRole]);


  useEffect(() => {
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
        console.log("Location subscription removed on unmount.");
      }
    }; // useEffect cleanup 닫는 괄호
  }, []); // useEffect 의존성 배열 닫는 괄호

  useEffect(() => {
    const sendLocationToServer = async (location: RealTimeLocation) => {
      if (userRole !== 'user') return;
      try {
        const httpResponse = await axios.post(`${Global.URL}/user/getUserLocation`, {
          number: Global.NUMBER,
          latitude: location.latitude,
          longitude: location.longitude,
        }, { headers: { 'Content-Type': 'application/json' }, timeout: 10000 });
        console.log('위치 전송 성공:', httpResponse.status);
      } catch (error) {
        if (isAxiosError(error)) {
           console.error('서버 위치 전송 Axios 오류:', error.message, error.response?.status);
        } else {
           console.error('서버 위치 전송 일반 오류:', error);
        }
      }
    }; // sendLocationToServer 닫는 괄호
    const intervalId = setInterval(() => {
      if (locationState.currentLocation && locationState.isTracking) {
        sendLocationToServer(locationState.currentLocation);
      }
    }, 15000);

    return () => clearInterval(intervalId);
  }, [locationState.currentLocation, locationState.isTracking, userRole]);

  const moveToMyLocation = async () => {
    let location = locationState.currentLocation;

    if (!location) {
      setLocationState(prev => ({ ...prev, isLoading: true }));
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('권한 필요', '위치 권한이 필요합니다.');
          setLocationState(prev => ({ ...prev, isLoading: false, error: '위치 권한 거부됨' }));
          return;
        }
        const currentPosition = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        location = {
          latitude: currentPosition.coords.latitude,
          longitude: currentPosition.coords.longitude,
          accuracy: currentPosition.coords.accuracy || 0,
          timestamp: currentPosition.timestamp,
        };
        setLocationState(prev => ({ ...prev, currentLocation: location, isLoading: false, error: null }));
      } catch (error) {
        console.error('현재 위치 가져오기 오류:', error);
        setLocationState(prev => ({ ...prev, isLoading: false, error: '현재 위치를 가져올 수 없습니다.' }));
        Alert.alert('오류', '현재 위치를 가져올 수 없습니다.');
        return;
      }
    } // if (!location) 닫는 괄호

    if (location) {
      moveToLocation(location);
    }
  }; // moveToMyLocation 닫는 괄호

  const handleGeofenceSave = (data: Omit<GeofenceData, 'id' | 'radius'>) => {
    const newGeofence: GeofenceData = {
      ...data,
      id: Date.now().toString(),
      radius: 100,
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
        name: userRole === 'user' ? '내 위치' : '이용자',
        status: locationState.isTracking ? 'tracking' : 'idle',
      };
    } // if 닫는 괄호
    return null;
  }; // getCurrentDisplayLocation 닫는 괄호


  const userLocation = getCurrentDisplayLocation();

  if (locationState.isLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-green-50">
        <Text style={{ fontFamily: 'System' }} className="text-gray-700 text-lg">위치 정보를 불러오는 중...</Text>
      </SafeAreaView>
    );
  } // if 닫는 괄호

  if (locationState.error) {
     return (
      <SafeAreaView className="flex-1 justify-center items-center bg-green-50 p-5">
        <Text style={{ fontFamily: 'System' }} className="text-red-600 text-lg text-center mb-4">오류 발생</Text>
        <Text style={{ fontFamily: 'System' }} className="text-gray-700 text-base text-center">{locationState.error}</Text>
        {locationState.error.includes("권한") && (
          <TouchableOpacity
            className="mt-6 bg-green-600 px-6 py-3 rounded-lg"
            // onPress={() => Linking.openSettings()} // 설정 이동 기능 추가 시
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
          title={roleSpecificTitle}
          description={locationState.isTracking ? "실시간 추적 중" : (roleSpecificTitle === '내 위치' ? "현재 위치" : "이용자 위치")}
          anchor={{ x: 0.5, y: 1 }}
        >
          <View style={{ alignItems: 'center' }}>
            <Image
              source={mapPinImage}
              style={{
                width: 45, // 크기 조절
                height: 45, // 크기 조절
                resizeMode: 'center',
              }}
            />
            <View className="mt-1 bg-green-50 px-3 py-1 rounded-full shadow-sm border border-green-200">
              <Text style={{ fontFamily: 'System' }} className="text-xs font-medium text-green-800">
                {userLocation.name}
              </Text>
            </View>
          </View>
        </Marker>
      )}
      {/* TODO: geofences 렌더링 */}
    </MapView>
  ); // renderMapView 닫는 괄호

  const headerText = userRole === 'user' ? '내 위치' : '이용자 위치';
  const headerSubText = userRole === 'user'
    ? (locationState.isTracking ? '원활한 서비스를 위해 GPS 데이터를 수집 중입니다.' : 'GPS 미작동 중')
    : (locationState.isTracking ? '선택한 이용자의 위치를 실시간 표시합니다.' : 'GPS 미작동 중');

  return (
    <SafeAreaView className="flex-1 bg-green-50">
      <StatusBar barStyle="dark-content" backgroundColor="#eafaf1" />
      <View className="bg-green-100 shadow-md p-4" style={{ paddingTop: StatusBar.currentHeight || 0 }}>
         <View className="items-center">
           <Text style={{ fontFamily: 'System' }} className="text-xl font-bold text-green-800 mb-1">{headerText}</Text>
           <Text style={{ fontFamily: 'System' }} className="text-sm text-green-600">{headerSubText}</Text>
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
           initialLocation={locationState.currentLocation ? {
             latitude: locationState.currentLocation.latitude,
             longitude: locationState.currentLocation.longitude
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