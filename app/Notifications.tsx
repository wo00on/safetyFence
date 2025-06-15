import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Bell, Clock, MapPin, User } from 'lucide-react-native';
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
  Notifications: undefined;
};

// navigation 타입 명시
type NavigationProp = StackNavigationProp<RootStackParamList, 'Notifications'>;

// 알림 타입
interface Notification {
  id: string;
  type: 'location' | 'battery';
  title: string;
  time: string;
  location?: string;
  detail?: string;
  read: boolean;
  userId: string;
}

type TabType = 'all' | 'unread' | 'location';

// 모의 알림 데이터
const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'location',
    title: '김할머니님이 주야간보호센터에 도착했습니다',
    time: '10분 전',
    location: '편안한 주야간보호센터',
    read: false,
    userId: '1',
  },
  {
    id: '2',
    type: 'location',
    title: '김할머니님이 집을 나섰습니다',
    time: '1시간 전',
    location: '자택',
    read: true,
    userId: '1',
  },
  {
    id: '3',
    type: 'battery',
    title: '김할머니님의 기기 배터리가 부족합니다',
    time: '2시간 전',
    detail: '배터리 잔량 15%',
    read: true,
    userId: '1',
  },
];

const NotificationsPage: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const markAsRead = (notificationId: string): void => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const handleNotificationClick = (notification: Notification): void => {
    markAsRead(notification.id);

    if (notification.type === 'location') {
      navigation.navigate('main', { userId: notification.userId });
    }
  };

  const getFilteredNotifications = (): Notification[] => {
    switch (activeTab) {
      case 'unread':
        return notifications.filter((n) => !n.read);
      case 'location':
        return notifications.filter((n) => n.type === 'location');
      default:
        return notifications;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const NotificationCard: React.FC<{ item: Notification }> = ({ item }) => (
    <TouchableOpacity
      className={`bg-white rounded-lg shadow-sm mb-4 p-4 ${!item.read ? 'border-l-4 border-blue-500' : ''}`}
      onPress={() => handleNotificationClick(item)}
      activeOpacity={0.7}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <View className="flex-row items-center mb-2">
            {item.type === 'location' ? (
              <View className="h-10 w-10 bg-blue-100 rounded-full items-center justify-center mr-3">
                <MapPin size={20} color="#2563eb" />
              </View>
            ) : (
              <View className="h-10 w-10 bg-amber-100 rounded-full items-center justify-center mr-3">
                <Bell size={20} color="#d97706" />
              </View>
            )}
            <View className="flex-1">
              <Text className="font-medium text-gray-900">{item.title}</Text>
              <View className="flex-row items-center mt-1">
                <Clock size={12} color="#6b7280" />
                <Text className="text-sm text-gray-500 ml-1">{item.time}</Text>
              </View>
            </View>
          </View>
          {item.location && (
            <View className="flex-row items-center mt-2">
              <MapPin size={16} color="#6b7280" />
              <Text className="text-sm text-gray-600 ml-1">{item.location}</Text>
            </View>
          )}
          {item.detail && <Text className="text-sm text-gray-600 mt-2">{item.detail}</Text>}
        </View>
        {!item.read && <View className="h-2 w-2 bg-blue-500 rounded-full ml-2" />}
      </View>
    </TouchableOpacity>
  );

  const TabButton: React.FC<{ tab: TabType; title: string }> = ({ tab, title }) => (
    <TouchableOpacity
      className={`flex-1 py-3 items-center rounded-md ${activeTab === tab ? 'bg-blue-600' : 'bg-gray-100'}`}
      onPress={() => setActiveTab(tab)}
    >
      <Text className={`font-medium ${activeTab === tab ? 'text-white' : 'text-gray-700'}`}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <View className="flex-1 p-4 pb-20">
        <View className="max-w-2xl mx-auto w-full">
          {/* 헤더 */}
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-2xl font-bold text-gray-900">알림</Text>
            {unreadCount > 0 && (
              <View className="bg-blue-500 px-3 py-1 rounded-full">
                <Text className="text-white text-sm font-medium">{unreadCount}개 읽지 않음</Text>
              </View>
            )}
          </View>

          {/* 탭 */}
          <View className="flex-row space-x-2 mb-4">
            <TabButton tab="all" title="전체" />
            <TabButton tab="unread" title="읽지 않음" />
            <TabButton tab="location" title="위치" />
          </View>

          {/* 알림 리스트 */}
          <FlatList
            data={getFilteredNotifications()}
            renderItem={({ item }) => <NotificationCard item={item} />}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={
              <View className="items-center justify-center py-12">
                <Bell size={48} color="#9ca3af" />
                <Text className="text-gray-500 text-lg mt-4">알림이 없습니다</Text>
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

          <TouchableOpacity
            className="items-center py-2 px-4"
            onPress={() => navigation.navigate('Users')}
          >
            <User size={24} color="#6b7280" />
            <Text className="text-xs text-gray-600 mt-1">이용자</Text>
          </TouchableOpacity>

          <TouchableOpacity className="items-center py-2 px-4">
            <Bell size={24} color="#2563eb" />
            <Text className="text-xs text-blue-600 mt-1">알림</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default NotificationsPage;
