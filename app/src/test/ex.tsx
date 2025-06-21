import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import {
    Bell,
    ChevronRight,
    Edit,
    LogOut,
    MapPin,
    Save,
    Settings,
    Shield,
    User,
    Users,
    X,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    SafeAreaView,
    ScrollView,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

// 타입 정의
interface UserData {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  detailAddress: string;
  role: 'user' | 'caregiver';
  joinDate: string;
  connectedUsers: ConnectedUser[];
  settings: UserSettings;
}

interface ConnectedUser {
  id: string;
  name: string;
  relationship: string;
}

interface UserSettings {
  locationNotifications: boolean;
  emergencyNotifications: boolean;
  batteryNotifications: boolean;
  emailNotifications: boolean;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// 모의 사용자 데이터
const INITIAL_USER_DATA: UserData = {
  id: "user123",
  name: "김보호자",
  phone: "010-1234-5678",
  email: "caregiver@example.com",
  address: "서울특별시 강남구 테헤란로 123",
  detailAddress: "101동 1001호",
  role: "caregiver",
  joinDate: "2024-01-15",
  connectedUsers: [
    { id: "1", name: "김할머니", relationship: "어머니" },
    { id: "2", name: "박할아버지", relationship: "아버지" },
  ],
  settings: {
    locationNotifications: true,
    emergencyNotifications: true,
    batteryNotifications: true,
    emailNotifications: false,
  },
};

const INITIAL_USER_DATA_FOR_USER: UserData = {
  id: "user456",
  name: "김할머니",
  phone: "010-9876-5432",
  email: "user@example.com",
  address: "서울특별시 강남구 테헤란로 123",
  detailAddress: "행복한 요양원",
  role: "user",
  joinDate: "2024-01-15",
  connectedUsers: [],
  settings: {
    locationNotifications: true,
    emergencyNotifications: true,
    batteryNotifications: false,
    emailNotifications: false,
  },
};

const MyPage: React.FC = () => {
  const navigation = useNavigation();
  const [userRole, setUserRole] = useState<'user' | 'caregiver' | null>(null);
  const [userData, setUserData] = useState<UserData>(INITIAL_USER_DATA);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editData, setEditData] = useState<UserData>(userData);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // 사용자 역할에 따라 데이터 설정
  useEffect(() => {
    const loadUserRole = async () => {
      try {
        const role = await AsyncStorage.getItem('userRole') as 'user' | 'caregiver' | null;
        setUserRole(role);

        if (role === 'user') {
          setUserData(INITIAL_USER_DATA_FOR_USER);
          setEditData(INITIAL_USER_DATA_FOR_USER);
        } else {
          setUserData(INITIAL_USER_DATA);
          setEditData(INITIAL_USER_DATA);
        }
      } catch (error) {
        console.error('Failed to load user role:', error);
      }
    };

    loadUserRole();
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
    setEditData(userData);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 실제 구현에서는 서버 API 호출
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setUserData(editData);
      setIsEditing(false);
    } catch (error) {
      console.error('저장 실패:', error);
      Alert.alert('오류', '저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(userData);
  };

  const handleSettingChange = (key: keyof UserSettings, value: boolean) => {
    setUserData({
      ...userData,
      settings: {
        ...userData.settings,
        [key]: value,
      },
    });
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('오류', '새 비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      // 실제 구현에서는 서버 API 호출
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsPasswordModalOpen(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      Alert.alert('성공', '비밀번호가 변경되었습니다.');
    } catch (error) {
      console.error('비밀번호 변경 실패:', error);
      Alert.alert('오류', '비밀번호 변경에 실패했습니다.');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '로그아웃 하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('userRole');
              navigation.navigate('Login' as never);
            } catch (error) {
              console.error('로그아웃 실패:', error);
            }
          },
        },
      ]
    );
  };

  const Badge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <View className="border border-gray-300 rounded-full px-2 py-1">
      <Text className="text-xs text-gray-600">{children}</Text>
    </View>
  );

  const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
    children, 
    className = "" 
  }) => (
    <View className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {children}
    </View>
  );

  const CardHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <View className="p-4 border-b border-gray-100">{children}</View>
  );

  const CardContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <View className="p-4">{children}</View>
  );

  const Button: React.FC<{
    onPress: () => void;
    children: React.ReactNode;
    variant?: 'default' | 'outline' | 'ghost';
    className?: string;
    disabled?: boolean;
  }> = ({ onPress, children, variant = 'default', className = "", disabled = false }) => {
    const baseClass = "rounded-md px-4 py-2 flex-row items-center justify-center";
    const variantClass = {
      default: "bg-blue-600",
      outline: "border border-gray-300 bg-white",
      ghost: "bg-transparent",
    }[variant];

    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        className={`${baseClass} ${variantClass} ${className} ${disabled ? 'opacity-50' : ''}`}
      >
        {children}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        <View className="max-w-2xl mx-auto space-y-6 pb-24">
          {/* 헤더 */}
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-gray-900">마이페이지</Text>
            {!isEditing ? (
              <Button onPress={handleEdit} variant="outline">
                <Edit size={16} color="#6B7280" />
                <Text className="ml-2 text-gray-700">편집</Text>
              </Button>
            ) : (
              <View className="flex-row space-x-2">
                <Button onPress={handleSave} disabled={isSaving}>
                  <Save size={16} color="white" />
                  <Text className="ml-2 text-white">
                    {isSaving ? '저장 중...' : '저장'}
                  </Text>
                </Button>
                <Button onPress={handleCancel} variant="outline">
                  <X size={16} color="#6B7280" />
                  <Text className="ml-2 text-gray-700">취소</Text>
                </Button>
              </View>
            )}
          </View>

          {/* 프로필 카드 */}
          <Card>
            <CardHeader>
              <View className="flex-row items-center">
                <User size={20} color="#6B7280" />
                <Text className="ml-2 text-lg font-semibold">프로필 정보</Text>
              </View>
            </CardHeader>
            <CardContent>
              <View className="flex-row items-center space-x-4 mb-4">
                <View className="h-16 w-16 bg-blue-100 rounded-full items-center justify-center">
                  <User size={32} color="#2563EB" />
                </View>
                <View className="flex-1">
                  <Text className="text-xl font-semibold">{userData.name}</Text>
                  <View className="mt-1">
                    <Badge>
                      {userData.role === 'caregiver' ? '보호자' : '이용자'}
                    </Badge>
                  </View>
                  <Text className="text-sm text-gray-500 mt-1">
                    가입일: {userData.joinDate}
                  </Text>
                </View>
              </View>

              <View className="space-y-4">
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-1">이름</Text>
                  {isEditing ? (
                    <TextInput
                      value={editData.name}
                      onChangeText={(text) => setEditData({ ...editData, name: text })}
                      className="border border-gray-300 rounded-md px-3 py-2"
                    />
                  ) : (
                    <Text className="text-sm font-medium">{userData.name}</Text>
                  )}
                </View>

                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-1">전화번호</Text>
                  {isEditing ? (
                    <TextInput
                      value={editData.phone}
                      onChangeText={(text) => setEditData({ ...editData, phone: text })}
                      className="border border-gray-300 rounded-md px-3 py-2"
                      keyboardType="phone-pad"
                    />
                  ) : (
                    <Text className="text-sm font-medium">{userData.phone}</Text>
                  )}
                </View>

                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-1">이메일</Text>
                  {isEditing ? (
                    <TextInput
                      value={editData.email}
                      onChangeText={(text) => setEditData({ ...editData, email: text })}
                      className="border border-gray-300 rounded-md px-3 py-2"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  ) : (
                    <Text className="text-sm font-medium">{userData.email}</Text>
                  )}
                </View>

                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-1">주소</Text>
                  {isEditing ? (
                    <View className="space-y-2">
                      <TextInput
                        value={editData.address}
                        onChangeText={(text) => setEditData({ ...editData, address: text })}
                        className="border border-gray-300 rounded-md px-3 py-2"
                        placeholder="기본 주소"
                      />
                      <TextInput
                        value={editData.detailAddress}
                        onChangeText={(text) => setEditData({ ...editData, detailAddress: text })}
                        className="border border-gray-300 rounded-md px-3 py-2"
                        placeholder="상세 주소"
                      />
                    </View>
                  ) : (
                    <View>
                      <Text className="text-sm font-medium">{userData.address}</Text>
                      <Text className="text-sm text-gray-600">{userData.detailAddress}</Text>
                    </View>
                  )}
                </View>
              </View>
            </CardContent>
          </Card>

          {/* 연결된 이용자 (보호자인 경우만 표시) */}
          {userRole === 'caregiver' && (
            <Card>
              <CardHeader>
                <View className="flex-row items-center">
                  <Users size={20} color="#6B7280" />
                  <Text className="ml-2 text-lg font-semibold">연결된 이용자</Text>
                </View>
              </CardHeader>
              <CardContent>
                <View className="space-y-3">
                  {userData.connectedUsers.map((user) => (
                    <View
                      key={user.id}
                      className="flex-row items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <View className="flex-row items-center space-x-3">
                        <View className="h-10 w-10 bg-blue-100 rounded-full items-center justify-center">
                          <User size={20} color="#2563EB" />
                        </View>
                        <View>
                          <Text className="font-medium">{user.name}</Text>
                          <Text className="text-sm text-gray-600">{user.relationship}</Text>
                        </View>
                      </View>
                      <TouchableOpacity>
                        <ChevronRight size={16} color="#6B7280" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <Button
                    onPress={() => navigation.navigate('EnterCode' as never)}
                    variant="outline"
                    className="w-full"
                  >
                    <Text className="text-gray-700">이용자 추가</Text>
                  </Button>
                </View>
              </CardContent>
            </Card>
          )}

          {/* 알림 설정 */}
          <Card>
            <CardHeader>
              <View className="flex-row items-center">
                <Bell size={20} color="#6B7280" />
                <Text className="ml-2 text-lg font-semibold">알림 설정</Text>
              </View>
            </CardHeader>
            <CardContent>
              <View className="space-y-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="font-medium">위치 알림</Text>
                    <Text className="text-sm text-gray-600">
                      {userRole === 'user' 
                        ? '내 위치 공유 시 알림' 
                        : '이용자의 위치 변경 시 알림'}
                    </Text>
                  </View>
                  <Switch
                    value={userData.settings.locationNotifications}
                    onValueChange={(value) => handleSettingChange('locationNotifications', value)}
                  />
                </View>

                <View className="h-px bg-gray-200" />

                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="font-medium">응급 알림</Text>
                    <Text className="text-sm text-gray-600">응급 상황 발생 시 즉시 알림</Text>
                  </View>
                  <Switch
                    value={userData.settings.emergencyNotifications}
                    onValueChange={(value) => handleSettingChange('emergencyNotifications', value)}
                  />
                </View>

                {userRole === 'caregiver' && (
                  <>
                    <View className="h-px bg-gray-200" />
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="font-medium">배터리 알림</Text>
                        <Text className="text-sm text-gray-600">기기 배터리 부족 시 알림</Text>
                      </View>
                      <Switch
                        value={userData.settings.batteryNotifications}
                        onValueChange={(value) => handleSettingChange('batteryNotifications', value)}
                      />
                    </View>
                  </>
                )}

                <View className="h-px bg-gray-200" />

                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="font-medium">이메일 알림</Text>
                    <Text className="text-sm text-gray-600">이메일로 알림 받기</Text>
                  </View>
                  <Switch
                    value={userData.settings.emailNotifications}
                    onValueChange={(value) => handleSettingChange('emailNotifications', value)}
                  />
                </View>
              </View>
            </CardContent>
          </Card>

          {/* 계정 설정 */}
          <Card>
            <CardHeader>
              <View className="flex-row items-center">
                <Settings size={20} color="#6B7280" />
                <Text className="ml-2 text-lg font-semibold">계정 설정</Text>
              </View>
            </CardHeader>
            <CardContent>
              <View className="space-y-3">
                <TouchableOpacity
                  onPress={() => setIsPasswordModalOpen(true)}
                  className="flex-row items-center justify-between py-2"
                >
                  <View className="flex-row items-center">
                    <Shield size={16} color="#6B7280" />
                    <Text className="ml-3 font-medium">비밀번호 변경</Text>
                  </View>
                  <ChevronRight size={16} color="#6B7280" />
                </TouchableOpacity>

                <TouchableOpacity className="flex-row items-center justify-between py-2">
                  <View className="flex-row items-center">
                    <User size={16} color="#6B7280" />
                    <Text className="ml-3 font-medium">개인정보 처리방침</Text>
                  </View>
                  <ChevronRight size={16} color="#6B7280" />
                </TouchableOpacity>

                <TouchableOpacity className="flex-row items-center justify-between py-2">
                  <View className="flex-row items-center">
                    <Settings size={16} color="#6B7280" />
                    <Text className="ml-3 font-medium">서비스 이용약관</Text>
                  </View>
                  <ChevronRight size={16} color="#6B7280" />
                </TouchableOpacity>

                <View className="h-px bg-gray-200 my-2" />

                <TouchableOpacity
                  onPress={handleLogout}
                  className="flex-row items-center py-2"
                >
                  <LogOut size={16} color="#DC2626" />
                  <Text className="ml-3 font-medium text-red-600">로그아웃</Text>
                </TouchableOpacity>
              </View>
            </CardContent>
          </Card>

          {/* 앱 정보 */}
          <Card>
            <CardContent>
              <View className="items-center">
                <Text className="text-sm text-gray-500">케어트래커 v1.0.0</Text>
                <Text className="text-sm text-gray-500">© 2024 CareTracker. All rights reserved.</Text>
              </View>
            </CardContent>
          </Card>
        </View>
      </ScrollView>

      {/* 비밀번호 변경 모달 */}
      <Modal
        visible={isPasswordModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPasswordModalOpen(false)}
      >
        <View className="flex-1 bg-black/50 justify-center p-4">
          <View className="bg-white rounded-lg p-6">
            <Text className="text-lg font-semibold mb-4">비밀번호 변경</Text>
            
            <View className="space-y-4">
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">현재 비밀번호</Text>
                <TextInput
                  value={passwordData.currentPassword}
                  onChangeText={(text) => setPasswordData({ ...passwordData, currentPassword: text })}
                  secureTextEntry
                  className="border border-gray-300 rounded-md px-3 py-2"
                />
              </View>
              
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">새 비밀번호</Text>
                <TextInput
                  value={passwordData.newPassword}
                  onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
                  secureTextEntry
                  className="border border-gray-300 rounded-md px-3 py-2"
                />
              </View>
              
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">새 비밀번호 확인</Text>
                <TextInput
                  value={passwordData.confirmPassword}
                  onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })}
                  secureTextEntry
                  className="border border-gray-300 rounded-md px-3 py-2"
                />
              </View>
              
              <View className="flex-row space-x-2 mt-6">
                <Button
                  onPress={() => setIsPasswordModalOpen(false)}
                  variant="outline"
                  className="flex-1"
                >
                  <Text className="text-gray-700">취소</Text>
                </Button>
                <Button
                  onPress={handlePasswordChange}
                  className="flex-1"
                >
                  <Text className="text-white">변경</Text>
                </Button>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* 하단 네비게이션 */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-8">
        <View className="flex-row justify-center max-w-2xl mx-auto">
          {userRole === 'user' ? (
            // 이용자용 네비게이션
            <View className="flex-row space-x-16">
              <TouchableOpacity
                onPress={() => navigation.navigate('main' as never)}
                className="items-center py-2 px-4"
              >
                <MapPin size={24} color="#6B7280" />
                <Text className="text-xs text-gray-600 mt-1">지도</Text>
              </TouchableOpacity>
              <TouchableOpacity className="items-center py-2 px-4">
                <User size={24} color="#2563EB" />
                <Text className="text-xs text-blue-600 mt-1">마이페이지</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // 보호자용 네비게이션
            <View className="flex-row space-x-8">
              <TouchableOpacity
                onPress={() => navigation.navigate('main' as never)}
                className="items-center py-2 px-4"
              >
                <MapPin size={24} color="#6B7280" />
                <Text className="text-xs text-gray-600 mt-1">지도</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('Users' as never)}
                className="items-center py-2 px-4"
              >
                <Users size={24} color="#6B7280" />
                <Text className="text-xs text-gray-600 mt-1">이용자</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('Notifications' as never)}
                className="items-center py-2 px-4"
              >
                <Bell size={24} color="#6B7280" />
                <Text className="text-xs text-gray-600 mt-1">알림</Text>
              </TouchableOpacity>
              <TouchableOpacity className="items-center py-2 px-4">
                <User size={24} color="#2563EB" />
                <Text className="text-xs text-blue-600 mt-1">마이페이지</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};
//
export default MyPage;