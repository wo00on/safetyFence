import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { ArrowRight, User, Users } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type UserRole = 'user' | 'caregiver' | null;

export default function SelectRolePage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);

  const handleRoleSelect = (role: 'user' | 'caregiver') => {
    setSelectedRole(role);
  };

  const handleContinue = async () => {
    if (selectedRole) {
      try {
        console.log('선택한 역할:', selectedRole);

        // AsyncStorage에 역할 저장
        await AsyncStorage.setItem('userRole', selectedRole);

        // 메인 화면으로 이동 (파라미터와 함께)
        router.push(`/main?role=${selectedRole}`);
      } catch (error) {
        console.error('역할 저장 중 오류:', error);
        Alert.alert('오류', '역할 저장 중 문제가 발생했습니다.');
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 justify-center px-4">
        {/* 메인 카드 */}
        <View className="bg-white rounded-lg shadow-sm p-6 mx-4">
          {/* 헤더 */}
          <View className="text-center mb-6">
            <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
              환영합니다!
            </Text>
            <Text className="text-lg text-gray-600 text-center leading-6">
              회원가입이 완료되었습니다. 서비스 이용을 위해 역할을 선택해주세요.
            </Text>
          </View>

          {/* 역할 선택 카드들 */}
          <View className="space-y-4 mb-6">
            {/* 이용자 카드 */}
            <TouchableOpacity
              onPress={() => handleRoleSelect('user')}
              className={`border-2 rounded-lg p-6 ${
                selectedRole === 'user'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center space-x-4">
                <View
                  className={`h-12 w-12 rounded-full items-center justify-center ${
                    selectedRole === 'user' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}
                >
                  <User
                    size={24}
                    color={selectedRole === 'user' ? '#2563eb' : '#6b7280'}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-900">
                    이용자
                  </Text>
                  <Text className="text-sm text-gray-600 mt-1">
                    서비스를 직접 이용하는 노인 이용자
                  </Text>
                  <Text className="text-xs text-blue-600 mt-1">
                    • 내 위치 확인 • 활동 로그 • 마이페이지
                  </Text>
                </View>
                {selectedRole === 'user' && (
                  <ArrowRight size={20} color="#2563eb" />
                )}
              </View>
            </TouchableOpacity>

            {/* 보호자 카드 */}
            <TouchableOpacity
              onPress={() => handleRoleSelect('caregiver')}
              className={`border-2 rounded-lg p-6 ${
                selectedRole === 'caregiver'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white'
              }`}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center space-x-4">
                <View
                  className={`h-12 w-12 rounded-full items-center justify-center ${
                    selectedRole === 'caregiver' ? 'bg-green-100' : 'bg-gray-100'
                  }`}
                >
                  <Users
                    size={24}
                    color={selectedRole === 'caregiver' ? '#16a34a' : '#6b7280'}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-900">
                    보호자
                  </Text>
                  <Text className="text-sm text-gray-600 mt-1">
                    이용자를 돌보는 가족 또는 보호자
                  </Text>
                  <Text className="text-xs text-green-600 mt-1">
                    • 지도 검색 • 이용자 관리 • 알림 • 로그
                  </Text>
                </View>
                {selectedRole === 'caregiver' && (
                  <ArrowRight size={20} color="#16a34a" />
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* 계속하기 버튼 */}
          <TouchableOpacity
            onPress={handleContinue}
            disabled={!selectedRole}
            className={`py-4 rounded-lg ${
              selectedRole
                ? 'bg-blue-600 active:bg-blue-700'
                : 'bg-gray-300'
            }`}
            activeOpacity={selectedRole ? 0.8 : 1}
          >
            <Text
              className={`text-center text-lg font-medium ${
                selectedRole ? 'text-white' : 'text-gray-500'
              }`}
            >
              {selectedRole === 'user'
                ? '이용자로 시작하기'
                : selectedRole === 'caregiver'
                ? '보호자로 시작하기'
                : '시작하기'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}