import Global from '@/constants/Global';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import {
  ChevronRight,
  LogOut,
  MapPin, // Added MapPin
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

interface GeofenceData {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius: number;
  type: 'permanent' | 'temporary';
  startTime?: string; // ISO string or similar
  endTime?: string;   // ISO string or similar
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const MyPage: React.FC = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [geofences, setGeofences] = useState<GeofenceData[]>([]);
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

    // 더미 데이터 사용
    const DUMMY_USER_DATA: UserData = {
      name: "김더미",
      number: "01012345678",
      homeStreetAddress: "서울특별시 강남구 테헤란로 123",
      homeStreetAddressDetail: "101동 1001호",
      centerStreetAddress: "서울특별시 서초구 서초대로 456",
      linkCode: "ABCDEF",
    };

    const DUMMY_GEOFENCES: GeofenceData[] = [
      {
        id: "geo1",
        name: "집",
        address: "서울특별시 강남구 테헤란로 123",
        latitude: 37.5665,
        longitude: 126.9780,
        radius: 100,
        type: "permanent",
      },
      {
        id: "geo2",
        name: "병원",
        address: "서울특별시 서초구 서초대로 456",
        latitude: 37.4830,
        longitude: 127.0320,
        radius: 50,
        type: "temporary",
        startTime: "09:00",
        endTime: "17:00",
      },
      {
        id: "geo3",
        name: "경로당",
        address: "서울특별시 송파구 올림픽로 789",
        latitude: 37.5145,
        longitude: 127.1050,
        radius: 70,
        type: "permanent",
      },
    ];

    try {
      // API 호출 대신 더미 데이터 설정
      await new Promise(resolve => setTimeout(resolve, 500)); // 로딩 효과를 위한 지연
      setUserData(DUMMY_USER_DATA);
      setGeofences(DUMMY_GEOFENCES);
    } catch (err: any) {
      console.error('사용자 정보 불러오기 실패:', err);
      const msg = err?.message || '더미 데이터 로드 실패';
      setError(msg);
      Alert.alert('오류', '더미 사용자 정보를 불러올 수 없습니다.');
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
    <View className="rounded-full px-2 py-1 bg-blue-50">
      <Text className="text-xs text-blue-600 font-medium">{children}</Text>
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

  const ProfileItem: React.FC<{ label: string; value: string | React.ReactNode; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <View className="flex-row items-center py-2">
      <View className="w-8 items-center justify-center">
        {icon}
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-xs font-medium text-gray-500 mb-0.5">{label}</Text>
        {typeof value === 'string' ? (
          <Text className="text-base font-semibold text-gray-800">{value}</Text>
        ) : (
          value
        )}
      </View>
    </View>
  );

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
      <SafeAreaView className="flex-1 bg-gray-50 pt-safe">
        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
          <View className="w-full max-w-2xl mx-auto space-y-8 pb-16">
            {/* 헤더 */}
            <View className="flex-row items-center justify-center py-4">
              <Text className="text-2xl font-bold text-gray-900">마이페이지</Text>
            </View>

            {/* 프로필 카드 */}
            <Card className="mb-4">
              <CardHeader>
                <View className="flex-row items-center">
                  <User size={20} color="#6B7280" />
                  <Text className="ml-2 text-lg font-semibold">프로필 정보</Text>
                </View>
              </CardHeader>
              <CardContent>
                <View className="flex-row items-center space-x-4 mb-6 pb-4 border-b border-gray-100">
                  <View className="flex-1">
                    <Text className="text-2xl font-bold text-gray-900">{userData.name}</Text>
                    <View className="mt-1">
                      <Badge>
                        {Global.USER_ROLE === 'supporter' ? '보호자' : '이용자'}
                      </Badge>                    
                    </View>
                  </View>
                </View>

                <View className="space-y-2">
                  <ProfileItem label="이름" value={userData.name} icon={<User size={18} color="#6B7280" />} />
                  <ProfileItem label="전화번호" value={userData.number} icon={<Text className="text-lg">📞</Text>} />
                  <ProfileItem
                    label="주소"
                    value={
                      <View>
                        <Text className="text-base font-semibold text-gray-800">{userData.homeStreetAddress}</Text>
                        <Text className="text-sm text-gray-600">{userData.homeStreetAddressDetail}</Text>
                      </View>
                    }
                    icon={<MapPin size={18} color="#6B7280" />}
                  />

                  {Global.USER_ROLE === 'user' && (
                    <>
                      <ProfileItem label="센터 주소" value={userData.centerStreetAddress} icon={<Text className="text-lg">🏥</Text>} />
                      <ProfileItem label="링크 코드" value={userData.linkCode} icon={<Text className="text-lg">🔗</Text>} />
                    </>
                   )}
                </View>
              </CardContent>
            </Card>

            {/* 등록된 영역 리스트 */}
            <Card className="mb-4">
              <CardHeader>
                <View className="flex-row items-center">
                  <MapPin size={20} color="#6B7280" />
                  <Text className="ml-2 text-lg font-semibold text-gray-900">등록된 영역 리스트</Text>
                </View>
              </CardHeader>
              <CardContent>
                {geofences.length > 0 ? (
                  <View className="space-y-3">
                    {geofences.map((geofence) => (
                      <View key={geofence.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <Text className="font-medium text-gray-900">{geofence.name}</Text>
                        <Text className="text-sm text-gray-600">{geofence.address}</Text>
                        {geofence.type === 'temporary' && geofence.startTime && geofence.endTime && (
                          <Text className="text-xs text-gray-500 mt-1">
                            시간: {geofence.startTime} - {geofence.endTime}
                          </Text>
                        )}
                        <View className={`self-start mt-2 px-2 py-1 rounded-full ${geofence.type === 'permanent' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                          <Text className={`text-xs font-semibold ${geofence.type === 'permanent' ? 'text-green-700' : 'text-yellow-700'}`}>
                            {geofence.type === 'permanent' ? '영구 영역' : '일시적 영역'}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text className="text-gray-500 text-center py-4">등록된 지오펜싱 영역이 없습니다.</Text>
                )}
              </CardContent>
            </Card>
            
            {/* 계정 설정 */}
            <Card className="mb-4">
              <CardHeader>
                <View className="flex-row items-center">
                  <Settings size={20} color="#6B7280" />
                  <Text className="ml-2 text-lg font-semibold text-gray-900">계정 설정</Text>
                </View>
              </CardHeader>
              <CardContent>
                <View className="space-y-3">
                  <TouchableOpacity
                    onPress={() => setIsPasswordModalOpen(true)}
                    className="flex-row items-center justify-between py-2"
                  >
                    <View className="flex-row items-center">
                      <Shield size={18} color="#4B5563" />
                      <Text className="ml-3 font-medium text-gray-800">비밀번호 변경</Text>
                    </View>
                    <ChevronRight size={18} color="#9CA3AF" />
                  </TouchableOpacity>

                  <TouchableOpacity className="flex-row items-center justify-between py-2">
                    <View className="flex-row items-center">
                      <User size={18} color="#4B5563" />
                      <Text className="ml-3 font-medium text-gray-800">개인정보 처리방침</Text>
                    </View>
                    <ChevronRight size={18} color="#9CA3AF" />
                  </TouchableOpacity>

                  <View className="h-px bg-gray-200 my-2" />

                  <TouchableOpacity
                    onPress={handleLogout}
                    className="flex-row items-center py-2"
                  >
                    <LogOut size={18} color="#DC2626" />
                    <Text className="ml-3 font-medium text-red-600">로그아웃</Text>
                  </TouchableOpacity>
                </View>
              </CardContent>
            </Card>

            {/* 앱 정보 */}
            <Card>
              <CardContent>
                <View className="items-center py-2">
                  <Text className="text-sm text-gray-500">페이패스 v1.0.0</Text>
                </View>
              </CardContent>
            </Card>
          </View>
        </ScrollView>

        <BottomNavigation currentScreen="MyPage" />

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
      </SafeAreaView>
    );
  };
//
export default MyPage;