import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function EnterCodeScreen() {
  const navigation = useNavigation();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCodeSubmit = async () => {
    setIsLoading(true);
    setError('');

    try {
      // 모의 코드 검증 (실제 구현에서는 서버에서 검증)
      if (code.length === 6 && /^\d+$/.test(code)) {
        console.log('입력된 코드:', code);

        // 잠시 로딩 시뮬레이션
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // 연결 성공 후 이용자 목록 페이지로 이동
        navigation.navigate('main' as never);
      } else {
        setError('올바른 6자리 숫자 코드를 입력해주세요.');
      }
    } catch (err) {
      setError('코드 확인 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleCodeRequest = () => {
    Alert.alert(
      '코드 요청',
      '이용자에게 코드 요청 메시지를 보내시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '요청하기', 
          onPress: () => {
            // 실제로는 SMS나 알림 발송 로직
            Alert.alert('알림', '이용자에게 코드 요청을 보냈습니다.');
          }
        }
      ]
    );
  };

  const handleCodeChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setCode(numericValue);
    setError('');
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 justify-center px-4">
        <View className="w-full max-w-md mx-auto">
          {/* 메인 카드 */}
          <View className="bg-white rounded-lg shadow-sm">
            {/* 헤더 */}
            <View className="relative p-6 items-center">
              {/* 뒤로가기 버튼 */}
              <TouchableOpacity
                className="absolute left-4 top-6 p-2"
                onPress={handleBack}
              >
                <Ionicons name="arrow-back" size={20} color="#6B7280" />
              </TouchableOpacity>

              {/* 아이콘 */}
              <View className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Ionicons name="key-outline" size={32} color="#16A34A" />
              </View>

              {/* 제목 */}
              <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
                이용자 코드 입력
              </Text>
              <Text className="text-base text-gray-600 text-center">
                이용자로부터 받은 6자리 코드를 입력하여 연결하세요
              </Text>
            </View>

            {/* 콘텐츠 */}
            <View className="px-6 pb-6">
              {/* 코드 입력 */}
              <View className="mb-6">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  이용자 코드 <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className="w-full p-4 border border-gray-300 rounded-md bg-white text-center text-2xl font-mono tracking-widest"
                  placeholder="123456"
                  value={code}
                  onChangeText={handleCodeChange}
                  keyboardType="numeric"
                  maxLength={6}
                  autoComplete="off"
                  autoCorrect={false}
                />
                <Text className="text-xs text-gray-500 text-center mt-2">
                  이용자가 제공한 6자리 숫자 코드를 입력하세요
                </Text>
              </View>

              {/* 에러 메시지 */}
              {error && (
                <View className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md">
                  <Text className="text-red-800 text-sm">{error}</Text>
                </View>
              )}

              {/* 기능 안내 */}
              <View className="bg-blue-50 p-4 rounded-lg mb-6">
                <View className="flex-row items-start">
                  <Ionicons name="checkmark-circle-outline" size={20} color="#2563EB" />
                  <View className="ml-3 flex-1">
                    <Text className="font-medium text-blue-800 mb-2">
                      코드 입력 후 가능한 기능:
                    </Text>
                    <View className="space-y-1">
                      <Text className="text-xs text-blue-800">• 이용자의 실시간 위치 확인</Text>
                      <Text className="text-xs text-blue-800">• 특정 장소 출입 알림 받기</Text>
                      <Text className="text-xs text-blue-800">• 이용자 안전 상태 모니터링</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* 연결 버튼 */}
              <TouchableOpacity
                className={`w-full py-4 rounded-md flex-row items-center justify-center ${
                  code.length === 6 && !isLoading
                    ? 'bg-blue-600'
                    : 'bg-gray-300'
                }`}
                onPress={handleCodeSubmit}
                disabled={code.length !== 6 || isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <>
                    <ActivityIndicator size="small" color="white" />
                    <Text className="text-white text-lg font-medium ml-2">연결 중...</Text>
                  </>
                ) : (
                  <Text className={`text-lg font-medium ${
                    code.length === 6 ? 'text-white' : 'text-gray-500'
                  }`}>
                    연결하기
                  </Text>
                )}
              </TouchableOpacity>

              {/* 코드 요청 */}
              <View className="mt-6 items-center">
                <Text className="text-sm text-gray-600 mb-2">
                  코드를 받지 못하셨나요?
                </Text>
                <TouchableOpacity onPress={handleCodeRequest}>
                  <Text className="text-blue-600 text-sm font-medium">
                    이용자에게 코드 요청하기
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}