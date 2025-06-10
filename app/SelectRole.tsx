import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

type UserRole = 'user' | 'caregiver' | null;

export default function SelectRoleScreen() {
  const navigation = useNavigation();
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);

  const handleRoleSelect = (role: 'user' | 'caregiver') => {
    setSelectedRole(role);
  };

  const handleContinue = async () => {
    if (selectedRole) {
      try {
        console.log("선택한 역할:", selectedRole);

        // 역할을 AsyncStorage에 저장
        await AsyncStorage.setItem("userRole", selectedRole);

        if (selectedRole === "user") {
          // 이용자 선택 시 이용자 코드 생성 페이지로 이동
          navigation.navigate('UserCode' as never);
        } else {
          // 보호자 선택 시 코드 입력 페이지로 이동
          navigation.navigate('EnterCode' as never);
        }
      } catch (error) {
        console.error('역할 저장 중 오류:', error);
        Alert.alert('오류', '역할 선택 중 문제가 발생했습니다. 다시 시도해주세요.');
      }
    }
  };

  const RoleCard = ({ 
    role, 
    title, 
    description, 
    icon, 
    selectedColor, 
    bgColor 
  }: {
    role: 'user' | 'caregiver';
    title: string;
    description: string;
    icon: string;
    selectedColor: string;
    bgColor: string;
  }) => {
    const isSelected = selectedRole === role;
    
    return (
      <TouchableOpacity
        className={`border-2 rounded-lg transition-all ${
          isSelected
            ? `${selectedColor} ${bgColor}`
            : 'border-gray-200 bg-white'
        }`}
        onPress={() => handleRoleSelect(role)}
        activeOpacity={0.7}
      >
        <View className="p-6">
          <View className="flex-row items-center">
            <View className={`h-12 w-12 rounded-full flex items-center justify-center ${
              isSelected 
                ? role === 'user' ? 'bg-blue-100' : 'bg-green-100'
                : 'bg-gray-100'
            }`}>
              <Ionicons 
                name={icon as any} 
                size={24} 
                color={
                  isSelected 
                    ? role === 'user' ? '#2563EB' : '#16A34A'
                    : '#6B7280'
                } 
              />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-lg font-semibold text-gray-900">{title}</Text>
              <Text className="text-sm text-gray-600 mt-1">{description}</Text>
            </View>
            {isSelected && (
              <View className={role === 'user' ? 'text-blue-600' : 'text-green-600'}>
                <Ionicons 
                  name="arrow-forward" 
                  size={20} 
                  color={role === 'user' ? '#2563EB' : '#16A34A'} 
                />
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 justify-center px-4">
        <View className="w-full max-w-lg mx-auto">
          {/* 헤더 카드 */}
          <View className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
              환영합니다!
            </Text>
            <Text className="text-lg text-gray-600 text-center">
              회원가입이 완료되었습니다. 서비스 이용을 위해 역할을 선택해주세요.
            </Text>
          </View>

          {/* 메인 컨텐츠 카드 */}
          <View className="bg-white rounded-lg shadow-sm p-6">
            <View className="space-y-4 mb-6">
              {/* 이용자 카드 */}
              <RoleCard
                role="user"
                title="이용자"
                description="서비스를 직접 이용하는 노인 이용자"
                icon="person-outline"
                selectedColor="border-blue-500"
                bgColor="bg-blue-50"
              />

              {/* 보호자 카드 */}
              <View className="mt-4">
                <RoleCard
                  role="caregiver"
                  title="보호자"
                  description="이용자를 돌보는 가족 또는 보호자"
                  icon="people-outline"
                  selectedColor="border-green-500"
                  bgColor="bg-green-50"
                />
              </View>
            </View>

            {/* 선택 완료 버튼 */}
            <TouchableOpacity
              className={`w-full py-4 rounded-md ${
                selectedRole 
                  ? 'bg-blue-600' 
                  : 'bg-gray-300'
              }`}
              onPress={handleContinue}
              disabled={!selectedRole}
              activeOpacity={selectedRole ? 0.8 : 1}
            >
              <Text className={`text-center text-lg font-medium ${
                selectedRole ? 'text-white' : 'text-gray-500'
              }`}>
                선택 완료
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}