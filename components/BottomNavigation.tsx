import Global from '@/constants/Global';
import { useRouter } from 'expo-router'; // Import useRouter
import { useNavigation } from '@react-navigation/native';
import { Calendar, MapPin, User, Users } from 'lucide-react-native';
import React, { useEffect } from 'react'; // Import useEffect
import { Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage

interface BottomNavigationProps {
  currentScreen?: string;
}

type BottomTabScreenName = 'MapPage' | 'CalendarPage' | 'MyPage' | 'LinkPage';

const BottomNavigation: React.FC<BottomNavigationProps> = ({ currentScreen }) => {
  const navigation = useNavigation();
  const router = useRouter(); // Initialize useRouter

  const activeColor = '#16a34a'; // 활성 (녹색)
  const inactiveColor = '#6b7280'; // 비활성 (회색)

  useEffect(() => {
    const loadUserRole = async () => {
      if (!Global.USER_ROLE) {
        const storedRole = await AsyncStorage.getItem('userRole');
        if (storedRole === 'user' || storedRole === 'supporter') {
          Global.USER_ROLE = storedRole;
        }
      }
    };
    loadUserRole();
  }, []); // Run once on mount

  const navigateToScreen = (screenName: BottomTabScreenName): void => {
    router.replace(`/${screenName}`); // Use router.replace for tab navigation
  };

  const getIconColor = (screenName: string) => {
    return currentScreen === screenName ? activeColor : inactiveColor;
  };

  const getTextColor = (screenName: string) => {
    // NativeWind 클래스 반환
    return currentScreen === screenName ? 'text-green-600' : 'text-gray-500';
  };

  const getTextWeight = (screenName: string) => {
    // NativeWind 클래스 반환
    return currentScreen === screenName ? 'font-bold' : 'font-normal';
  };

  if (Global.USER_ROLE === 'user') {
    // 이용자용 네비게이션 (3개 메뉴)
    return (
      <View className="absolute bottom-0 left-0 right-0 bg-white/90 border-t border-gray-200/60 p-1 pb-4">
        <View className="flex-row justify-evenly max-w-2xl mx-auto">
          {/* --- 지도 --- */}
          <TouchableOpacity
            onPress={() => navigateToScreen('MapPage')}
            className="items-center py-2 px-4"
          >
            <MapPin size={26} color={getIconColor('MapPage')} />
            <Text style={{ fontFamily: 'System' }} className={`text-sm mt-1 ${getTextColor('MapPage')} ${getTextWeight('MapPage')}`}>
              지도
            </Text>
          </TouchableOpacity>

          {/* --- 캘린더 --- */}
          <TouchableOpacity
            onPress={() => navigateToScreen('CalendarPage')}
            className="items-center py-2 px-4"
          >
            <Calendar size={26} color={getIconColor('CalendarPage')} />
            <Text style={{ fontFamily: 'System' }} className={`text-sm mt-1 ${getTextColor('CalendarPage')} ${getTextWeight('CalendarPage')}`}>
              캘린더
            </Text>
          </TouchableOpacity>

          {/* --- 설정 (마이페이지) --- */}
          <TouchableOpacity
            onPress={() => navigateToScreen('MyPage')} // 이동할 스크린 이름은 'MyPage' 유지
            className="items-center py-2 px-4"
          >
            <User size={26} color={getIconColor('MyPage')} />
            <Text style={{ fontFamily: 'System' }} className={`text-sm mt-1 ${getTextColor('MyPage')} ${getTextWeight('MyPage')}`}>
              설정 {/* <-- "마이페이지"에서 "설정"으로 변경 */}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (Global.USER_ROLE === 'supporter') {
    // 보호자용 네비게이션 (4개 메뉴)
    return (
      <View className="absolute bottom-0 left-0 right-0 bg-white/90 border-t border-gray-200/60 p-1 pb-4">
        <View className="flex-row justify-evenly max-w-2xl mx-auto">
          {/* --- 지도 --- */}
          <TouchableOpacity
            onPress={() => navigateToScreen('MapPage')}
            className="items-center py-2 px-4"
          >
            <MapPin size={26} color={getIconColor('MapPage')} />
            <Text style={{ fontFamily: 'System' }} className={`text-sm mt-1 ${getTextColor('MapPage')} ${getTextWeight('MapPage')}`}>
              지도
            </Text>
          </TouchableOpacity>

          {/* --- 캘린더 --- */}
          <TouchableOpacity
            onPress={() => navigateToScreen('CalendarPage')}
            className="items-center py-2 px-4"
          >
            <Calendar size={26} color={getIconColor('CalendarPage')} />
            <Text style={{ fontFamily: 'System' }} className={`text-sm mt-1 ${getTextColor('CalendarPage')} ${getTextWeight('CalendarPage')}`}>
              캘린더
            </Text>
          </TouchableOpacity>

          {/* --- 설정 (마이페이지) --- */}
          <TouchableOpacity
            onPress={() => navigateToScreen('MyPage')} // 이동할 스크린 이름은 'MyPage' 유지
            className="items-center py-2 px-4"
          >
            <User size={26} color={getIconColor('MyPage')} />
            <Text style={{ fontFamily: 'System' }} className={`text-sm mt-1 ${getTextColor('MyPage')} ${getTextWeight('MyPage')}`}>
              설정 {/* <-- "마이페이지"에서 "설정"으로 변경 */}
            </Text>
          </TouchableOpacity>

          {/* --- 이용자 --- */}
          <TouchableOpacity
            onPress={() => navigateToScreen('LinkPage')}
            className="items-center py-2 px-4"
          >
            <Users size={26} color={getIconColor('LinkPage')} />
            <Text style={{ fontFamily: 'System' }} className={`text-sm mt-1 ${getTextColor('LinkPage')} ${getTextWeight('LinkPage')}`}>
              이용자
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 역할이 없으면 네비게이션 숨김
  return null;
};

export default BottomNavigation;