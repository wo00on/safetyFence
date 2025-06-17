import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Bell, Clock, MapPin } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    FlatList,
    SafeAreaView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// 라우트 파라미터 타입 정의
type RootStackParamList = {
  main: { userId: string };
  Users: undefined;
  MyLocationNotifications: undefined;
};

// navigation 타입 명시
type NavigationProp = StackNavigationProp<RootStackParamList, 'MyLocationNotifications'>;

// 내 위치 알림 타입
interface MyLocationNotification {
  id: string;
  title: string;
  time: string;
  location: string;
  read: boolean;
}

// 모의 내 위치 알림 데이터
const INITIAL_MY_LOCATION_NOTIFICATIONS: MyLocationNotification[] = [
  {
    id: '1',
    title: '집에 도착했습니다',
    time: '5분 전',
    location: '자택',
    read: false,
  },
  {
    id: '2',
    title: '회사에 도착했습니다',
    time: '3시간 전',
    location: '직장',
    read: true,
  },
  {
    id: '3',
    title: '카페에 도착했습니다',
    time: '어제',
    location: '스타벅스 강남점',
    read: true,
  },
  {
    id: '4',
    title: '병원에 도착했습니다',
    time: '2일 전',
    location: '서울대학교병원',
    read: true,
  },
];

const MyLocationNotificationsPage: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [notifications, setNotifications] = useState<MyLocationNotification[]>(INITIAL_MY_LOCATION_NOTIFICATIONS);

  const markAsRead = (notificationId: string): void => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const handleNotificationClick = (notification: MyLocationNotification): void => {
    markAsRead(notification.id);
    // 내 위치 정보이므로 특별한 네비게이션 없이 읽음 처리만
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const NotificationCard: React.FC<{ item: MyLocationNotification }> = ({ item }) => (
    <TouchableOpacity
      className={`bg-white rounded-lg shadow-sm mb-4 p-4 ${!item.read ? 'border-l-4 border-blue-500' : ''}`}
      onPress={() => handleNotificationClick(item)}
      activeOpacity={0.7}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <View className="flex-row items-center mb-2">
            <View className="h-10 w-10 bg-blue-100 rounded-full items-center justify-center mr-3">
              <MapPin size={20} color="#2563eb" />
            </View>
            <View className="flex-1">
              <Text className="font-medium text-gray-900">{item.title}</Text>
              <View className="flex-row items-center mt-1">
                <Clock size={12} color="#6b7280" />
                <Text className="text-sm text-gray-500 ml-1">{item.time}</Text>
              </View>
            </View>
          </View>
          <View className="flex-row items-center mt-2">
            <MapPin size={16} color="#6b7280" />
            <Text className="text-sm text-gray-600 ml-1">{item.location}</Text>
          </View>
        </View>
        {!item.read && <View className="h-2 w-2 bg-blue-500 rounded-full ml-2" />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <View className="flex-1 p-4 pb-20">
        <View className="max-w-2xl mx-auto w-full">
          {/* 헤더 */}
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-2xl font-bold text-gray-900">내 위치 알림</Text>
            {unreadCount > 0 && (
              <View className="bg-blue-500 px-3 py-1 rounded-full">
                <Text className="text-white text-sm font-medium">{unreadCount}개 새로운 알림</Text>
              </View>
            )}
          </View>

          {/* 알림 리스트 */}
          <FlatList
            data={notifications}
            renderItem={({ item }) => <NotificationCard item={item} />}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={
              <View className="items-center justify-center py-12">
                <MapPin size={48} color="#9ca3af" />
                <Text className="text-gray-500 text-lg mt-4">위치 알림이 없습니다</Text>
              </View>
            }
          />
        </View>
      </View>

      {/* 하단 네비게이션 */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <View className="flex-row justify-center space-x-8 max-w-2xl mx-auto">
          <TouchableOpacity
            className="items-center py-2 px-4"
            onPress={() => navigation.navigate('main', { userId: '1' })}
          >
            <MapPin size={24} color="#6b7280" />
            <Text className="text-xs text-gray-600 mt-1">지도</Text>
          </TouchableOpacity>

          {/* <TouchableOpacity
            className="items-center py-2 px-4"
            onPress={() => navigation.navigate('Users')}
          >
            <User size={24} color="#6b7280" />
            <Text className="text-xs text-gray-600 mt-1">이용자</Text>
          </TouchableOpacity> */}

          <TouchableOpacity className="items-center py-2 px-4">
            <Bell size={24} color="#2563eb" />
            <Text className="text-xs text-blue-600 mt-1">내 위치</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default MyLocationNotificationsPage;