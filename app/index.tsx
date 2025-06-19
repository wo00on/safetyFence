import Global from '@/constants/Global';
import { useNavigation } from '@react-navigation/native'; // 페이지간 이동 담당
import axios from 'axios';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
 
interface LoginPageProps {}

const LoginPage: React.FC<LoginPageProps> = () => {
  const navigation = useNavigation();
  const [number, setNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
  setIsLoading(true);
  try {
    const httpResponse = await axios.post(`${Global.URL}/login/signIn`, {
      number,
      password,
    });

    // response.data 안에 실제 서버 응답 데이터가 들어있음
    Global.NUMBER = number;
    // 로그인 성공 처리 (토큰 저장 등)
    navigation.navigate('SelectRole' as never);

  } catch (error: any) {
    // axios 에러는 error.response.data.message 형태로 서버 메시지를 가짐
    const message = error.response?.data?.message || '로그인 실패, react-native 오류.';
    Alert.alert('로그인 실패', message);
    console.error('로그인 실패 : ', error);
  } finally {
    setIsLoading(false);
  }
};

  const handleForgotPassword = () => {
    Alert.alert('비밀번호 찾기', '추후 추가될 서비스 입니다.');
  };  

  const handleSignup = () => {
    navigation.navigate('Signup' as never);
  };

  return (
    <KeyboardAvoidingView // 키보드가 화면을 가릴 때 자동으로 화면 조정
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-teal-50"
    >
      <ScrollView // 스크롤 기능
        contentContainerStyle={{ flexGrow: 1 }}
        className="flex-1"
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center items-center px-4 py-8"> {/* 중앙 정렬 컨테이너 */}
          {/* 카드 컨테이너 */}
          <View className="w-full max-w-sm bg-white rounded-lg shadow-lg p-6"> {/* 로그인 폼 */}
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
              {/* 전화번호 입력 */}
              <View className="space-y-2">
                <Text className="text-sm font-medium text-gray-700">전화번호</Text>
                <TextInput
                  className="w-full px-3 py-3 border border-gray-300 rounded-md bg-white text-gray-900"
                  placeholder="ex) 01012345678"
                  value={number}
                  onChangeText={setNumber}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* 비밀번호 입력 */}
              <View className="space-y-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-medium text-gray-700">비밀번호</Text>
                </View>
                <TextInput
                  className="w-full px-3 py-3 border border-gray-300 rounded-md bg-white text-gray-900"
                  placeholder="••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

                {/* 비밀번호 찾기 버튼 - 로그인 버튼 아래 오른쪽 정렬 */}
              <View className="flex-row justify-end mt-2 mb-4">
                <TouchableOpacity onPress={handleForgotPassword}>
                  <Text className="text-xs text-teal-600">비밀번호 찾기</Text>
                </TouchableOpacity>
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
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginPage;