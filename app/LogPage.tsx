import Global from '@/constants/Global';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import axios from 'axios';
import { Bell, Clock, MapPin } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  StatusBar,
  Text,
  View
} from 'react-native';
import BottomNavigation from '../components/BottomNavigation';

// 라우트 파라미터 타입 정의
type RootStackParamList = {
  MapPage: undefined;
  LinkPage: undefined;
  LogPage: undefined;
};

// navigation 타입 명시
type NavigationProp = StackNavigationProp<RootStackParamList, 'LogPage'>;

// 알림 타입
interface Notification {
  number: string;
  name: string;
  departureTime: string;
  arrivalTime: string;
  departureLocation: string;
  arrivalLocation: string;
}

const NotificationsPage: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axios.post(`${Global.URL}/log/getLogList`, {
          number: Global.NUMBER,
        });
        setNotifications(response.data);
      } catch (error) {
        console.error('알림 불러오기 실패:', error);
      }
    };

    fetchNotifications();
  }, []);

  

  const NotificationCard: React.FC<{ item: Notification }> = ({ item }) => (
  <View className="bg-white rounded-lg shadow-sm mb-4 p-4">
    <View className="flex-row items-start justify-between">
      <View className="flex-1">
        <View className="flex-row items-center mb-2">
          <View className="h-12 w-12 bg-blue-100 rounded-full items-center justify-center mr-3 mt-2">
            <MapPin size={20} color="#2563eb" />
          </View>
          <View className="flex-1">
            <Text className="font-medium text-gray-900">{item.name} 님의 이동 기록</Text>
            <View className="flex-row items-center mt-1">
              <Clock size={12} color="#6b7280" />
              <Text className="text-sm text-gray-500 ml-1">
                출발: {item.departureTime.replace('T', ' ')}
              </Text>
            </View>
            <View className="flex-row items-center mt-1">
              <Clock size={12} color="#6b7280" />
              <Text className="text-sm text-gray-500 ml-1">
                도착: {item.arrivalTime.replace('T', ' ')}
              </Text>
            </View>
          </View>
        </View>
        <Text className="text-sm text-gray-600 mt-2">
          {item.departureLocation}에서 {item.arrivalLocation}으로 이동하셨습니다.
        </Text>
      </View>
    </View>
  </View>
);



  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <View className="flex-1 p-4 pb-20">
        <View className="max-w-2xl mx-auto w-full">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-2xl font-bold text-gray-900">이동 기록</Text>
          </View>

          <FlatList
            data={notifications}
            renderItem={({ item }) => <NotificationCard item={item} />}
            keyExtractor={(item, index) => index.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={
              <View className="items-center justify-center py-12">
                <Bell size={48} color="#9ca3af" />
                <Text className="text-gray-500 text-lg mt-4">기록이 없습니다</Text>
              </View>
            }
          />
        </View>
      </View>

      <BottomNavigation currentScreen="LogPage" />
    </SafeAreaView>
  );
};

export default NotificationsPage;
