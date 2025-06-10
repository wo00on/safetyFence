import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import {
  User,
  MapPin,
  Plus,
  MoreVertical,
  Search,
  Bell,
  Home,
} from 'lucide-react-native';

// 타입 정의
interface User {
  id: string;
  name: string;
  relationship: string;
  status: 'active' | 'inactive';
  lastLocation: string;
  lastUpdated: string;
  address: string;
  batteryLevel: number;
}

type TabType = 'all' | 'active' | 'inactive';

type RootStackParamList = {
  main: { userId?: string };
  Users: undefined;
  Notifications: undefined;
};

// 모의 이용자 데이터
const INITIAL_USERS: User[] = [
  {
    id: '1',
    name: '김할머니',
    relationship: '어머니',
    status: 'active',
    lastLocation: '주야간보호센터',
    lastUpdated: '2분 전',
    address: '서울특별시 강남구 테헤란로 123',
    batteryLevel: 75,
  },
];

const UsersScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [newUserCode, setNewUserCode] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRelationship, setNewUserRelationship] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [showDropdown, setShowDropdown] = useState<string | null>(null);

  const filteredUsers = users.filter((user) => user.name.includes(searchQuery));

  const getTabUsers = () => {
    if (activeTab === 'active') {
      return filteredUsers.filter((user) => user.status === 'active');
    }
    if (activeTab === 'inactive') {
      return filteredUsers.filter((user) => user.status === 'inactive');
    }
    return filteredUsers;
  };

  const handleAddUser = async () => {
    setIsLoading(true);
    setError('');

    try {
      if (newUserCode.length === 6 && /^\d+$/.test(newUserCode)) {
        // 잠시 로딩 시뮬레이션
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const newUser: User = {
          id: Date.now().toString(),
          name: newUserName || `이용자 ${users.length + 1}`,
          relationship: newUserRelationship || '관계 미설정',
          status: 'active',
          lastLocation: '집',
          lastUpdated: '방금 전',
          address: '주소 정보 없음',
          batteryLevel: 100,
        };

        setUsers([...users, newUser]);
        setIsAddUserDialogOpen(false);
        setNewUserCode('');
        setNewUserName('');
        setNewUserRelationship('');
      } else {
        setError('올바른 6자리 숫자 코드를 입력해주세요.');
      }
    } catch (err) {
      setError('코드 확인 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserClick = (userId: string) => {
    navigation.navigate('main', { userId });
  };

  const handleRemoveUser = (userId: string) => {
    Alert.alert(
      '이용자 삭제',
      '정말로 이 이용자를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => setUsers(users.filter((user) => user.id !== userId)),
        },
      ]
    );
    setShowDropdown(null);
  };

  const getBatteryColor = (level: number) => {
    if (level > 50) return 'bg-green-500';
    if (level > 20) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const renderUserCard = (user: User) => (
    <TouchableOpacity
      key={user.id}
      className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-100"
      onPress={() => handleUserClick(user.id)}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className="h-12 w-12 bg-blue-100 rounded-full items-center justify-center mr-4">
            <User size={24} color="#2563eb" />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="font-medium text-gray-900">{user.name}</Text>
              <View
                className={`ml-2 px-2 py-1 rounded-full ${
                  user.status === 'active' ? 'bg-green-50' : 'bg-gray-50'
                }`}
              >
                <Text
                  className={`text-xs ${
                    user.status === 'active' ? 'text-green-700' : 'text-gray-700'
                  }`}
                >
                  {user.status === 'active' ? '활성' : '비활성'}
                </Text>
              </View>
            </View>
            <Text className="text-sm text-gray-600">{user.relationship}</Text>
          </View>
        </View>
        <TouchableOpacity
          className="p-2"
          onPress={() => setShowDropdown(showDropdown === user.id ? null : user.id)}
        >
          <MoreVertical size={16} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {showDropdown === user.id && (
        <View className="absolute right-4 top-16 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
          <TouchableOpacity className="px-4 py-3 border-b border-gray-100">
            <Text className="text-gray-700">이름 변경</Text>
          </TouchableOpacity>
          <TouchableOpacity className="px-4 py-3 border-b border-gray-100">
            <Text className="text-gray-700">알림 설정</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="px-4 py-3"
            onPress={() => handleRemoveUser(user.id)}
          >
            <Text className="text-red-600">삭제</Text>
          </TouchableOpacity>
        </View>
      )}

      <View className="mt-4 space-y-2">
        <View className="flex-row items-center">
          <MapPin size={16} color="#6b7280" />
          <Text className="text-sm text-gray-700 ml-2">
            현재 위치: <Text className="font-medium">{user.lastLocation}</Text>
          </Text>
          <Text className="text-xs text-gray-500 ml-2">({user.lastUpdated})</Text>
        </View>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <Home size={16} color="#6b7280" />
            <Text className="text-sm text-gray-700 ml-2 flex-1" numberOfLines={1}>
              {user.address}
            </Text>
          </View>
          <View className="flex-row items-center ml-4">
            <View className="h-2 w-8 bg-gray-200 rounded-full overflow-hidden">
              <View
                className={`h-full ${getBatteryColor(user.batteryLevel)}`}
                style={{ width: `${user.batteryLevel}%` }}
              />
            </View>
            <Text className="text-xs text-gray-500 ml-1">{user.batteryLevel}%</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View className="items-center py-12">
      <View className="h-16 w-16 bg-gray-100 rounded-full items-center justify-center mb-4">
        <User size={32} color="#9ca3af" />
      </View>
      <Text className="text-lg font-medium text-gray-900">이용자가 없습니다</Text>
      <Text className="text-gray-500 mt-1 text-center">
        이용자 코드를 입력하여 이용자를 추가하세요
      </Text>
      <TouchableOpacity
        className="bg-blue-600 rounded-lg px-4 py-2 flex-row items-center mt-4"
        onPress={() => setIsAddUserDialogOpen(true)}
      >
        <Plus size={16} color="white" />
        <Text className="text-white font-medium ml-2">이용자 추가</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      
      {/* 터치할 때 드롭다운 닫기 */}
      <TouchableOpacity
        className="flex-1"
        activeOpacity={1}
        onPress={() => setShowDropdown(null)}
      >
        <ScrollView className="flex-1 px-4">
          {/* 헤더 */}
          <View className="flex-row items-center justify-between py-4">
            <Text className="text-2xl font-bold text-gray-900">이용자 관리</Text>
            <TouchableOpacity
              className="bg-blue-600 rounded-lg px-4 py-2 flex-row items-center"
              onPress={() => setIsAddUserDialogOpen(true)}
            >
              <Plus size={16} color="white" />
              <Text className="text-white font-medium ml-2">이용자 추가</Text>
            </TouchableOpacity>
          </View>

          {/* 검색 */}
          <View className="relative mb-6">
            <View className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
              <Search size={16} color="#9ca3af" />
            </View>
            <TextInput
              className="bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-3"
              placeholder="이용자 검색..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* 탭 */}
          <View className="flex-row mb-4">
            {(['all', 'active', 'inactive'] as TabType[]).map((tab) => (
              <TouchableOpacity
                key={tab}
                className={`flex-1 py-3 border-b-2 ${
                  activeTab === tab
                    ? 'border-blue-600'
                    : 'border-gray-200'
                }`}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  className={`text-center font-medium ${
                    activeTab === tab ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  {tab === 'all' ? '전체' : tab === 'active' ? '활성' : '비활성'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 이용자 목록 */}
          {getTabUsers().length > 0 ? (
            <View>{getTabUsers().map(renderUserCard)}</View>
          ) : (
            renderEmptyState()
          )}

          {/* 하단 여백 (네비게이션 공간) */}
          <View className="h-20" />
        </ScrollView>
      </TouchableOpacity>

      {/* 하단 네비게이션 */}
      <View className="bg-white border-t border-gray-200 p-4">
        <View className="flex-row justify-center space-x-8">
          <TouchableOpacity
            className="items-center py-2 px-4"
            onPress={() => navigation.navigate('main')}
          >
            <MapPin size={24} color="#6b7280" />
            <Text className="text-xs text-gray-600 mt-1">지도</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="items-center py-2 px-4"
            onPress={() => navigation.navigate('Users')}
          >
            <User size={24} color="#2563eb" />
            <Text className="text-xs text-blue-600 mt-1">이용자</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="items-center py-2 px-4"
            onPress={() => navigation.navigate('Notifications')}
          >
            <Bell size={24} color="#6b7280" />
            <Text className="text-xs text-gray-600 mt-1">알림</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 이용자 추가 모달 */}
      <Modal
        visible={isAddUserDialogOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAddUserDialogOpen(false)}
      >
        <View className="flex-1 bg-black/50 justify-center px-4">
          <View className="bg-white rounded-lg p-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">새 이용자 추가</Text>
            
            <View className="space-y-4">
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  이용자 코드 *
                </Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 text-center text-xl font-mono tracking-widest"
                  placeholder="6자리 코드 입력"
                  value={newUserCode}
                  onChangeText={(text) => {
                    const value = text.replace(/\D/g, '').slice(0, 6);
                    setNewUserCode(value);
                    setError('');
                  }}
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>
              
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  이용자 이름 (선택)
                </Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3"
                  placeholder="예: 어머니"
                  value={newUserName}
                  onChangeText={setNewUserName}
                />
              </View>
              
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  관계 (선택)
                </Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3"
                  placeholder="예: 어머니, 아버지, 할머니"
                  value={newUserRelationship}
                  onChangeText={setNewUserRelationship}
                />
              </View>
              
              {error ? (
                <Text className="text-sm text-red-500">{error}</Text>
              ) : null}
              
              <View className="flex-row space-x-3 mt-6">
                <TouchableOpacity
                  className="flex-1 bg-gray-200 rounded-lg py-3"
                  onPress={() => setIsAddUserDialogOpen(false)}
                >
                  <Text className="text-center font-medium text-gray-700">취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 rounded-lg py-3 ${
                    newUserCode.length === 6 && !isLoading
                      ? 'bg-blue-600'
                      : 'bg-gray-300'
                  }`}
                  onPress={handleAddUser}
                  disabled={newUserCode.length !== 6 || isLoading}
                >
                  <Text className="text-center font-medium text-white">
                    {isLoading ? '연결 중...' : '이용자 추가'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default UsersScreen;