import Global from '@/constants/Global';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import {
    ChevronRight,
    LogOut,
    Settings,
    Shield,
    User
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import BottomNavigation from '../components/BottomNavigation';

// 타입 정의
interface UserData {
  name: string;
  number: string;
  homeStreetAddress: string;
  homeStreetAddressDetail: string;
  centerStreetAddress: string;
  linkCode: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const MyPage: React.FC = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async () => {
    setLoading(true);
    setError(null);

    if (!Global.NUMBER) {
      setError('사용자 식별값(Global.NUMBER)이 없습니다. 로그인 상태를 확인하세요.');
      setLoading(false);
      return;
    }

    try {
      console.info('fetchUserData number:', Global.NUMBER);

      // 타임아웃 옵션 추가
      const response = await axios.post(
        `${Global.URL}/myPage/getInformation`,
        { number: Global.NUMBER },
        { timeout: 8000 }
      );

      const data = response.data;

      // 응답 구조에 따라 아래 매핑을 조정하세요.
      setUserData({
        name: data.name,
        number: data.number,
        homeStreetAddress: data.homeStreetAddress,
        homeStreetAddressDetail: data.homeStreetAddressDetail,
        centerStreetAddress: data.centerStreetAddress,
        linkCode: data.linkCode,
      });
    } catch (err: any) {
      console.error('사용자 정보 불러오기 실패:', err);
      // 네트워크/타임아웃 메시지 처리
      const msg = err?.message || '서버 요청 실패';
      setError(msg.includes('timeout') ? '서버 응답이 지연되고 있습니다. 네트워크를 확인하세요.' : '사용자 정보를 불러올 수 없습니다.');
      Alert.alert('오류', '사용자 정보를 불러올 수 없습니다. 네트워크 또는 서버를 확인하세요.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('오류', '새 비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      // 실제 구현에서는 서버 API 호출
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsPasswordModalOpen(false);

      // api 요청
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
                Global.NUMBER = "";
                Global.TARGET_NUMBER = "";
                Global.USER_ROLE = "";
          
              navigation.navigate('index' as never);
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
    <View className="p-3 border-b border-gray-100">{children}</View>
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

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="mt-3">사용자 정보를 불러오는 중입니다...</Text>
      </SafeAreaView>
    );
  }

  if (error && !userData) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center p-4">
        <Text className="text-base text-red-600 mb-3">오류: {error}</Text>
        <TouchableOpacity
          onPress={fetchUserData}
          className="bg-blue-600 px-4 py-2 rounded-md"
        >
          <Text className="text-white">다시 시도</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mt-3 bg-gray-200 px-4 py-2 rounded-md"
        >
          <Text>이전 화면으로</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!userData) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <Text>사용자 정보를 불러올 수 없습니다.</Text>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
        <View className="w-full px-4 space-y-6 pb-24">
          {/* 헤더 */}
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-gray-900 ml-3">마이페이지</Text>
          </View>

          <Text>{}</Text>

          {/* 프로필 카드 */}
          <Card className="mb-3">
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
                      {Global.USER_ROLE === 'supporter' ? '보호자' : '이용자'}
                    </Badge>                    
                  </View>
                </View>
              </View>

              <View className="space-y-4">
                <View>
                  <Text className="text-sm font-bold text-gray-700 mb-1">이름</Text>
                  <Text className="text-sm font-medium">{userData.name}</Text>
                </View>

                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-1">전화번호</Text>
                  <Text className="text-sm font-medium">{userData.number}</Text>
                </View>

                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-1">주소</Text>
                  <View>
                    <Text className="text-sm font-medium">{userData.homeStreetAddress}</Text>
                    <Text className="text-sm text-gray-600">{userData.homeStreetAddressDetail}</Text>
                  </View>
                </View>

                {Global.USER_ROLE === 'user' && (
                  <View className="mt-4">
                    <Text className="text-sm font-medium text-gray-700 mb-1">센터 주소</Text>
                    <Text className="text-sm font-medium">{userData.centerStreetAddress}</Text>

                    <Text className="text-sm font-medium text-gray-700 mt-3 mb-1">링크 코드</Text>
                    <Text className="text-sm font-medium">{userData.linkCode}</Text>
                  </View>
                 )}
              </View>
            </CardContent>
          </Card>
          
          {/* 계정 설정 */}
          <Card className="mb-3">
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
                <Text className="text-sm text-gray-500">페이패스 v1.0.0</Text>
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

      <BottomNavigation currentScreen="MyPage" />
    </SafeAreaView>
  );
};
//
export default MyPage;