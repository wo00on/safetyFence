import Global from '@/constants/Global';
import { useNavigation } from '@react-navigation/native';
import { Calendar, MapPin, User, Users } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface BottomNavigationProps {
  currentScreen?: string;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ currentScreen }) => {
  const navigation = useNavigation();

  const activeColor = '#16a34a';
  const inactiveColor = '#6b7280';

  const navigateToScreen = (screenName: string): void => {
    navigation.navigate(screenName as never);
  };

  const getIconColor = (screenName: string) => {
    return currentScreen === screenName ? activeColor : inactiveColor;
  };

  const getTextColor = (screenName: string) => {
    return currentScreen === screenName ? 'text-green-600' : 'text-gray-500';
  };

  const getTextWeight = (screenName: string) => {
    return currentScreen === screenName ? 'font-bold' : 'font-normal';
  };

  if (Global.USER_ROLE === 'user') {
    // 이용자용 네비게이션
    return (
      <View className="absolute bottom-0 left-0 right-0 bg-white/90 border-t border-gray-200/60 p-1 pb-4">
        {/* [수정] justify-around -> justify-evenly 로 변경하여 간격 확보 */}
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

          {/* --- 마이페이지 --- */}
          <TouchableOpacity
            onPress={() => navigateToScreen('MyPage')}
            className="items-center py-2 px-4"
          >
            <User size={26} color={getIconColor('MyPage')} />
            <Text style={{ fontFamily: 'System' }} className={`text-sm mt-1 ${getTextColor('MyPage')} ${getTextWeight('MyPage')}`}>
              마이페이지
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (Global.USER_ROLE === 'supporter') {
    // 보호자용 네비게이션
    return (
      <View className="absolute bottom-0 left-0 right-0 bg-white/90 border-t border-gray-200/60 p-1 pb-4">
        {/* [수정] justify-around -> justify-evenly 로 변경하여 간격 확보 */}
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

          {/* --- 마이페이지 --- */}
          <TouchableOpacity
            onPress={() => navigateToScreen('MyPage')}
            className="items-center py-2 px-4"
          >
            <User size={26} color={getIconColor('MyPage')} />
            <Text style={{ fontFamily: 'System' }} className={`text-sm mt-1 ${getTextColor('MyPage')} ${getTextWeight('MyPage')}`}>
              마이페이지
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

  return null;
};

export default BottomNavigation;