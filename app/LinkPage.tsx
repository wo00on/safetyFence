import Global from '@/constants/Global';
import { useLocation } from '@/contexts/LocationContext';
import { NavigationProp, useNavigation, useRoute } from '@react-navigation/native';
import {
  MoreVertical,
  Plus,
  Search,
  User
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomNavigation from '../components/BottomNavigation';
import { linkService } from '../services/linkService';

interface User {
  id: number;
  userNumber: string;
  relation: string;
}

type RootStackParamList = {
  MapPage: undefined;
  LinkPage: undefined;
  LogPage: undefined;
  MyPage: undefined;
};

const UsersScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { setSupporterTarget } = useLocation();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [newUserCode, setNewUserCode] = useState('');
  const [newUserRelationship, setNewUserRelationship] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDropdown, setShowDropdown] = useState<string | null>(null);

  const handleAddUser = async () => {
    setIsLoading(true);
    setError('');

    try {
      // 코드 검증
      if (!newUserCode || newUserCode.length < 6) {
        setError('6자리 이상의 코드를 입력해주세요.');
        return;
      }
      if (!newUserRelationship.trim()) {
        setError('관계를 입력해주세요.');
        return;
      }

      // API 호출: POST /link/addUser
      await linkService.addUser({
        linkCode: newUserCode,
        relation: newUserRelationship,
      });

      // 목록 새로고침: GET /link/list
      const updatedUsers = await linkService.getList();
      setUsers(updatedUsers);

      // 모달 닫기 및 초기화
      setIsAddUserDialogOpen(false);
      setNewUserCode('');
      setNewUserRelationship('');

      Alert.alert('성공', '이용자가 추가되었습니다.');
    } catch (err: any) {
      const message = err.response?.data?.message;
      setError(message || '이용자 추가 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // API 호출: GET /link/list
        const data = await linkService.getList();
        setUsers(data);
      } catch (err) {
        console.error('이용자 목록 불러오기 실패:', err);
        Alert.alert('오류', '이용자 목록을 불러오는 데 실패했습니다.');
      }
    };
    fetchUsers();
  }, []);

  const handleUserClick = (userNumber: string) => {
    Global.TARGET_NUMBER = userNumber;
    setSupporterTarget(userNumber);
    navigation.navigate('MapPage');
  };

  const handleRemoveUser = (userNumber: string) => {
    Alert.alert('이용자 삭제', '정말로 이 이용자를 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            // API 호출: DELETE /link/deleteUser
            await linkService.deleteUser({ number: userNumber });

            // 목록 새로고침: GET /link/list
            const updatedUsers = await linkService.getList();
            setUsers(updatedUsers);

            Alert.alert('성공', '이용자가 삭제되었습니다.');
          } catch (error: any) {
            Alert.alert('오류', error.response?.data?.message || '이용자 삭제 중 문제가 발생했습니다.');
          } finally {
            setShowDropdown(null);
          }
        },
      },
    ]);
  };

  const getTabUsers = () => {
    if (!searchQuery) return users;
    return users.filter(user =>
      user.relation?.includes(searchQuery) ||
      user.userNumber?.includes(searchQuery)
    );
  };

  const renderUserCard = (user: User) => (
    <TouchableOpacity
      key={user.userNumber}
      className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-100"
      onPress={() => handleUserClick(user.userNumber)}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className="h-12 w-12 bg-green-100 rounded-full items-center justify-center mr-4">
            <User size={24} color="#25eb25ff" />
          </View>
          <View className="flex-1">
            <Text className="font-medium text-gray-900 mb-1">{user.relation}</Text>
            <Text className="text-sm text-gray-600">{user.userNumber}</Text>
          </View>
        </View>
        <TouchableOpacity className="p-2" onPress={() => setShowDropdown(showDropdown === user.userNumber ? null : user.userNumber)}>
          <MoreVertical size={16} color="#6b7280" />
        </TouchableOpacity>
      </View>
      {showDropdown === user.userNumber && (
        <View className="absolute right-4 top-16 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
          <TouchableOpacity className="px-4 py-3" onPress={() => handleRemoveUser(user.userNumber)}>
            <Text className="text-red-600">삭제</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View className="items-center py-12">
      <View className="h-16 w-16 bg-gray-100 rounded-full items-center justify-center mb-4">
        <User size={32} color="#9ca3af" />
      </View>
      <Text className="text-lg font-medium text-gray-900">이용자가 없습니다</Text>
      <Text className="text-gray-500 mt-1 text-center">이용자 코드를 입력하여 이용자를 추가하세요</Text>
      <TouchableOpacity className="bg-green-500 rounded-lg px-4 py-2 flex-row items-center mt-4" onPress={() => setIsAddUserDialogOpen(true)}>
        <Plus size={16} color="white" />
        <Text className="text-white font-medium ml-2">이용자 추가</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50 pt-safe">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <TouchableOpacity className="flex-1" activeOpacity={1} onPress={() => setShowDropdown(null)}>
        <ScrollView className="flex-1 px-4">
          <View className="flex-row items-center justify-between py-4">
            <Text className="text-2xl font-bold text-gray-900">이용자 관리</Text>
            <TouchableOpacity
              className="bg-green-500 rounded-lg px-3 py-2 flex-row items-center"
              onPress={() => setIsAddUserDialogOpen(true)}
            >
              <Plus size={16} color="white" />
              <Text className="text-white font-medium ml-1">추가</Text>
            </TouchableOpacity>
          </View>
          <View className="relative mb-6">
            <View className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
              <Search size={16} color="#9ca3af" />
            </View>
            <TextInput className="bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-3" placeholder="이용자 검색..." value={searchQuery} onChangeText={setSearchQuery} />
          </View>
          {getTabUsers().length > 0 ? (
            <View>{getTabUsers().map(renderUserCard)}</View>
          ) : (
            renderEmptyState()
          )}
          <View className="h-20" />
        </ScrollView>
      </TouchableOpacity>

      <BottomNavigation currentScreen="LinkPage" />

      <Modal visible={isAddUserDialogOpen} transparent animationType="slide" onRequestClose={() => setIsAddUserDialogOpen(false)}>
        <View className="flex-1 bg-black/50 justify-center px-4">
          <View className="bg-white rounded-lg p-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">새 이용자 추가</Text>
            <View className="space-y-4">
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">이용자 코드 *</Text>
                <TextInput className="border border-gray-300 rounded-lg px-4 py-3 text-center text-xl font-mono tracking-widest" placeholder="6자리 코드 입력" value={newUserCode} onChangeText={(text) => {
                  const value = text.replace(/[^0-9a-zA-Z]/g, '').slice(0, 6);
                  setNewUserCode(value);
                  setError('');
                }} keyboardType="default" maxLength={6} />
              </View>
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">관계 (선택)</Text>
                <TextInput className="border border-gray-300 rounded-lg px-4 py-3" placeholder="예: 어머니, 아버지, 할머니" value={newUserRelationship} onChangeText={setNewUserRelationship} />
              </View>
              {error ? <Text className="text-sm text-red-500">{error}</Text> : null}
              <View className="flex-row justify-center mt-6">
                <TouchableOpacity className="bg-gray-200 rounded-lg py-3 w-28" onPress={() => setIsAddUserDialogOpen(false)}>
                  <Text className="text-center font-medium text-gray-700">취소</Text>
                </TouchableOpacity>
                <View className="w-3" />
                <TouchableOpacity className={`rounded-lg py-3 w-28 ${newUserCode.length === 6 && !isLoading ? 'bg-blue-600' : 'bg-gray-300'}`} onPress={handleAddUser} disabled={newUserCode.length !== 6 || isLoading}>
                  <Text className="text-center font-medium text-white">{isLoading ? '연결 중...' : '사용자 추가'}</Text>
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
