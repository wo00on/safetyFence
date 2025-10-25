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

  const navigateToScreen = (screenName: string): void => {
    navigation.navigate(screenName as never);
  };

  const getIconColor = (screenName: string) => {
    return currentScreen === screenName ? '#2563eb' : '#6b7280';
  };

  const getTextColor = (screenName: string) => {
    return currentScreen === screenName ? 'text-blue-600' : 'text-gray-600';
  };

  const getTextWeight = (screenName: string) => {
    return currentScreen === screenName ? 'font-medium' : '';
  };

  const getBackgroundColor = (screenName: string) => {
    return currentScreen === screenName ? 'bg-blue-50' : 'bg-gray-50';
  };

  if (Global.USER_ROLE === 'user') {
    // 이용자용 네비게이션
    return (
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-8">
        <View className="flex-row justify-center max-w-2xl mx-auto">
          <View className="flex-row space-x-16">
            <TouchableOpacity
              onPress={() => navigateToScreen('MapPage')}
              className="items-center py-2 px-4"
            >
              <View className={`p-2 rounded-full ${getBackgroundColor('MapPage')}`}>
                <MapPin size={24} color={getIconColor('MapPage')} />
              </View>
              <Text className={`text-xs mt-1 ${getTextColor('MapPage')} ${getTextWeight('MapPage')}`}>
                지도
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigateToScreen('CalendarPage')}
              className="items-center py-2 px-4"
            >
              <View className={`p-2 rounded-full ${getBackgroundColor('CalendarPage')}`}>
                <Calendar size={24} color={getIconColor('CalendarPage')} />
              </View>
              <Text className={`text-xs mt-1 ${getTextColor('CalendarPage')} ${getTextWeight('CalendarPage')}`}>
                캘린더
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigateToScreen('MyPage')}
              className="items-center py-2 px-4"
            >
              <View className={`p-2 rounded-full ${getBackgroundColor('MyPage')}`}>
                <User size={24} color={getIconColor('MyPage')} />
              </View>
              <Text className={`text-xs mt-1 ${getTextColor('MyPage')} ${getTextWeight('MyPage')}`}>
                마이페이지
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (Global.USER_ROLE === 'supporter') {
    // 보호자용 네비게이션
    return (
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-8">
        <View className="flex-row justify-center max-w-2xl mx-auto">
          <View className="flex-row space-x-8">
            <TouchableOpacity
              onPress={() => navigateToScreen('MapPage')}
              className="items-center py-2 px-4"
            >
              <View className={`p-2 rounded-full ${getBackgroundColor('MapPage')}`}>
                <MapPin size={24} color={getIconColor('MapPage')} />
              </View>
              <Text className={`text-xs mt-1 ${getTextColor('MapPage')} ${getTextWeight('MapPage')}`}>
                지도
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigateToScreen('CalendarPage')}
              className="items-center py-2 px-4"
            >
              <View className={`p-2 rounded-full ${getBackgroundColor('CalendarPage')}`}>
                <Calendar size={24} color={getIconColor('CalendarPage')} />
              </View>
              <Text className={`text-xs mt-1 ${getTextColor('CalendarPage')} ${getTextWeight('CalendarPage')}`}>
                캘린더
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigateToScreen('MyPage')}
              className="items-center py-2 px-4"
            >
              <View className={`p-2 rounded-full ${getBackgroundColor('MyPage')}`}>
                <User size={24} color={getIconColor('MyPage')} />
              </View>
              <Text className={`text-xs mt-1 ${getTextColor('MyPage')} ${getTextWeight('MyPage')}`}>
                마이페이지
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigateToScreen('LinkPage')}
              className="items-center py-2 px-4"
            >
              <View className={`p-2 rounded-full ${getBackgroundColor('LinkPage')}`}>
                <Users size={24} color={getIconColor('LinkPage')} />
              </View>
              <Text className={`text-xs mt-1 ${getTextColor('LinkPage')} ${getTextWeight('LinkPage')}`}>
                이용자
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return null;
};

export default BottomNavigation;
