import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';

interface LoginPageProps {}

const LoginPage: React.FC<LoginPageProps> = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('오류', '이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      // 실제 구현에서는 서버 API 호출
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 로그인 성공 시 역할 선택 페이지로 이동
      navigation.navigate('SelectRole' as never);
    } catch (error) {
      console.error('로그인 실패:', error);
      Alert.alert('로그인 실패', '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert('비밀번호 찾기', '비밀번호 찾기 기능을 구현해주세요.');
  };

  const handleSignup = () => {
    navigation.navigate('membership' as never);
  };

  const handleGoBack = () => {
    navigation.navigate('Splash' as never);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-teal-50"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="flex-1"
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center items-center px-4 py-8">
          {/* 카드 컨테이너 */}
          <View className="w-full max-w-sm bg-white rounded-lg shadow-lg p-6">
            {/* 헤더 */}
            <View className="items-center mb-8">
              <View className="mb-4">
                <Image
                  source={require('../assets/images/icon_sample2.png')}
                  className="w-20 h-20"
                  resizeMode="contain"
                />
              </View>
              <Text className="text-2xl font-bold text-teal-800 mb-2">로그인</Text>
              <Text className="text-gray-600 text-center">
                계정 정보를 입력하여 로그인하세요
              </Text>
            </View>

            {/* 폼 */}
            <View className="space-y-4">
              {/* 이메일 입력 */}
              <View className="space-y-2">
                <Text className="text-sm font-medium text-gray-700">이메일</Text>
                <TextInput
                  className="w-full px-3 py-3 border border-gray-300 rounded-md bg-white text-gray-900"
                  placeholder="name@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* 비밀번호 입력 */}
              <View className="space-y-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-medium text-gray-700">비밀번호</Text>
                  <TouchableOpacity onPress={handleForgotPassword}>
                    <Text className="text-xs text-teal-600">비밀번호 찾기</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  className="w-full px-3 py-3 border border-gray-300 rounded-md bg-white text-gray-900"
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              {/* 로그인 버튼 */}
              <TouchableOpacity
                className={`w-full py-3 rounded-md items-center justify-center ${
                  isLoading ? 'bg-teal-400' : 'bg-teal-600'
                }`}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="white" />
                    <Text className="text-white font-medium ml-2">로그인 중...</Text>
                  </View>
                ) : (
                  <Text className="text-white font-medium">로그인</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* 회원가입 링크 */}
            <View className="mt-6 items-center">
              <Text className="text-sm text-gray-600">
                계정이 없으신가요?{' '}
                <Text className="text-teal-600" onPress={handleSignup}>
                  회원가입
                </Text>
              </Text>
            </View>

            {/* 뒤로가기 버튼 */}
            <TouchableOpacity
              className="mt-6 w-full py-3 flex-row items-center justify-center"
              onPress={handleGoBack}
            >
              <ArrowLeft size={16} color="#0f766e" />
              <Text className="text-teal-700 ml-2">처음으로 돌아가기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginPage;