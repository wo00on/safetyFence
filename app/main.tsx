import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  BarChart,
  Bell,
  Filter,
  Locate,
  MapPin,
  Navigation,
  Search,
  User,
  Users,
  X,
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

// 맞춤형 지도 스타일
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

// 타입 정의
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

// 모의 요양원/보호센터 데이터
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

// 모의 이용자 위치 데이터
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
  const [selectedCenter, setSelectedCenter] = useState<CareCenter | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [userRole, setUserRole] = useState<UserRole>(null);

  // 사용자 역할 확인
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

  // 내 위치로 이동하는 함수
  const moveToMyLocation = (): void => {
    const userLocation = USER_LOCATIONS[userId] || { lat: 37.5665, lng: 126.978, name: '사용자', status: 'active' };
    
    mapRef.current?.animateToRegion({
      latitude: userLocation.lat,
      longitude: userLocation.lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 1000);
  };

  // 이용자 위치 가져오기
  const userLocation = USER_LOCATIONS[userId] || { lat: 37.5665, lng: 126.978, name: '사용자', status: 'active' };

  // 지도 영역
  const region = {
    latitude: userLocation.lat,
    longitude: userLocation.lng,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
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
            <Text className="text-sm text-gray-500">현재 위치를 확인하세요</Text>
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
              description="현재 위치"
            >
              <View className="items-center">
                <View className="bg-blue-500 p-3 rounded-full shadow-lg border-4 border-white">
                  <Navigation size={20} color="white" />
                </View>
                <View className="mt-1 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200">
                  <Text className="text-xs font-medium text-gray-700">{userLocation.name}</Text>
                </View>
              </View>
            </Marker>
          </MapView>

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

        {/* 하단 네비게이션 - 이용자용 */}
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

  // 보호자인 경우 UI
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
            description="이용자 위치"
          >
            <View className="items-center">
              <View className="bg-blue-500 p-3 rounded-full shadow-lg border-4 border-white">
                <User size={20} color="white" />
              </View>
              <View className="mt-1 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200">
                <Text className="text-xs font-medium text-blue-600">{userLocation.name}</Text>
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
                <View className="bg-green-500 p-3 rounded-full shadow-lg border-4 border-white">
                  <MapPin size={18} color="white" />
                </View>
                <View className="mt-1 bg-white px-2 py-0.5 rounded-full shadow-sm border border-gray-200">
                  <Text className="text-xs font-medium text-green-600">{center.type}</Text>
                </View>
              </View>
            </Marker>
          ))}
        </MapView>

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
                  <View className="bg-green-50 px-3 py-1 rounded-full border border-green-200">
                    <Text className="text-sm text-green-700 font-medium">
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