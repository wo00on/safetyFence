import Global from '@/constants/Global';
import { Image } from "react-native";

import { useNavigation } from '@react-navigation/native';
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  LogOut,
  MapPin,
  Settings,
  Shield,
  Trash2,
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
import { geofenceService } from '../services/geofenceService';
import { userService } from '../services/userService';
import { storage } from '../utils/storage';
import type { MyPageData, MyPageGeofence } from '../types/api';

// 타입 정의
interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const MyPage: React.FC = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState<MyPageData | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [isGeofenceListExpanded, setIsGeofenceListExpanded] = useState<boolean>(false);
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

    try {
      // API 호출: GET /get/myPageData
      const data = await userService.getMyPageData();
      setUserData(data);
      console.log('마이페이지 데이터 로드 성공:', data);
    } catch (err: any) {
      console.error('사용자 정보 불러오기 실패:', err);
      const msg = err?.message || '사용자 정보 로드 실패';
      setError(msg);
      Alert.alert('오류', '사용자 정보를 불러오는 데 실패했습니다.');
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

    if (!passwordData.currentPassword || !passwordData.newPassword) {
      Alert.alert('오류', '모든 필드를 입력해주세요.');
      return;
    }

    try {
      // API 호출: PATCH /mypage/password
      await userService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setIsPasswordModalOpen(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      Alert.alert('성공', '비밀번호가 변경되었습니다.');
    } catch (error: any) {
      console.error('비밀번호 변경 실패:', error);
      const message = error.response?.data?.message || '비밀번호 변경에 실패했습니다.';
      Alert.alert('오류', message);
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
              // AsyncStorage 클리어
              await storage.clearAll();

              // Global 상태 초기화
              Global.NUMBER = "";
              Global.TARGET_NUMBER = "";
              Global.USER_ROLE = "";

              navigation.navigate('index' as never);
              console.log('로그아웃 성공');
            } catch (error) {
              console.error('로그아웃 실패:', error);
              Alert.alert('오류', '로그아웃 처리 중 문제가 발생했습니다.');
            }
          },
        },
      ]
    );
  };

  const handleGeofenceDelete = (geofenceId: number, geofenceName: string) => {
    Alert.alert(
      '영역 삭제',
      `'${geofenceName}' 영역을 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await geofenceService.delete({ id: geofenceId });
              Alert.alert('성공', '선택한 영역이 삭제되었습니다.');
              fetchUserData(); // 데이터 새로고침
            } catch (error) {
              console.error('영역 삭제 실패:', error);
              Alert.alert('오류', '영역 삭제에 실패했습니다.');
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
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="w-full max-w-2xl mx-auto space-y-8">
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
                <ProfileItem label="생년월일" value={userData.birth} icon={<Text className="text-lg">🎂</Text>} />
                <ProfileItem label="우편번호" value={userData.homeAddress} icon={<MapPin size={18} color="#6B7280" />} />

                {Global.USER_ROLE === 'user' && (
                  <>
                    <ProfileItem label="센터 우편번호" value={userData.centerAddress} icon={<Text className="text-lg">🏥</Text>} />
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
              {userData.geofences && userData.geofences.length > 0 ? (
                <>
                  <View>
                    {(isGeofenceListExpanded
                      ? userData.geofences
                      : userData.geofences.slice(0, 2)
                    ).map((geofence, idx, arr) => (
                      <View
                        key={geofence.id}
                        className={`bg-gray-50 p-3 rounded-lg border border-gray-100 relative 
              ${idx !== arr.length - 1 ? "mb-3" : ""}`}
                      >
                        <View style={{ paddingRight: 30 }}>
                          <Text className="font-medium text-gray-900">{geofence.name}</Text>
                          <Text className="text-sm text-gray-600">{geofence.address}</Text>

                          {geofence.type === 1 && geofence.startTime && geofence.endTime && (
                            <Text className="text-xs text-gray-500 mt-1">
                              시간: {geofence.startTime} - {geofence.endTime}
                            </Text>
                          )}
                        </View>

                        {/* 영역 유형 표시 */}
                        <View
                          className={`self-start mt-2 px-2 py-1 rounded-full ${geofence.type === 0 ? "bg-green-100" : "bg-yellow-100"
                            }`}
                        >
                          <Text
                            className={`text-xs font-semibold ${geofence.type === 0 ? "text-green-700" : "text-yellow-700"
                              }`}
                          >
                            {geofence.type === 0 ? "영구 영역" : "일시적 영역"}
                          </Text>
                        </View>

                        {/* 삭제 버튼 */}
                        <TouchableOpacity
                          onPress={() => handleGeofenceDelete(geofence.id, geofence.name)}
                          className="absolute right-2 p-2"
                          style={{
                            top: '50%',
                            transform: [{ translateY: -5 }], // 아이콘의 절반 정도 위로
                          }}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Trash2 size={18} color="#ffa7a7ff" />
                        </TouchableOpacity>

                      </View>
                    ))}
                  </View>

                  {userData.geofences.length > 2 && (
                    <TouchableOpacity
                      onPress={() => setIsGeofenceListExpanded(!isGeofenceListExpanded)}
                      className="flex-row items-center justify-center pt-4 mt-2 border-t border-gray-100"
                    >
                      <Text className="text-sm font-medium text-blue-600">
                        {isGeofenceListExpanded ? "리스트 접기" : "리스트 펼치기"}
                      </Text>

                      {isGeofenceListExpanded ? (
                        <ChevronUp size={18} color="#2563EB" className="ml-1" />
                      ) : (
                        <ChevronDown size={18} color="#2563EB" className="ml-1" />
                      )}
                    </TouchableOpacity>
                  )}
                </>
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

                <TouchableOpacity
                  onPress={() => navigation.navigate('PrivacyPolicyPage' as never)}
                  className="flex-row items-center justify-between py-2"
                >
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
                <Text className="text-sm text-gray-500">SafetyFence v1.0.0</Text>
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