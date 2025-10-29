import Global from '@/constants/Global';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

const LoginPage: React.FC = () => {
  const navigation = useNavigation();
  const [number, setNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!number.trim() || !password.trim()) {
      Alert.alert('입력 오류', '전화번호와 비밀번호를 입력해주세요.');
      return;
    }
    setIsLoading(true);
    try {
      Global.NUMBER = number;
      console.log('로그인 성공:', { number, password });
      navigation.navigate('SelectRole' as never);
    } catch (error: any) {
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

  const baseInputWrapperStyle = 'flex-row items-center border-2 rounded-xl px-4 py-3';
  const focusedInputWrapperStyle = 'border-teal-500 bg-teal-50';
  const blurredInputWrapperStyle = 'border-gray-100 bg-gray-50';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
      style={{ flex: 1 }}
      className="bg-green-50 pt-safe"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="w-full max-w-sm mx-auto">
            {/* 로고 및 헤더 섹션 */}
            <View className="items-center mb-12">
              <View className="mb-5 overflow-hidden">
                <Image
                  source={require('../assets/images/logo.png')}
                  className="w-20 h-20 rounded-full" // 여기에 rounded-full을 직접 적용하여 이미지를 완전한 원으로 만듭니다.
                  resizeMode="cover"
                />
              </View>
              <Text style={{ fontFamily: 'System' }} className="text-3xl font-bold text-teal-800 mb-2 tracking-tight">
                안녕하세요!
              </Text>
              <Text style={{ fontFamily: 'System' }} className="text-base text-black-500 font-normal">
                안전하고 편리한 케어 서비스
              </Text>
            </View>

            {/* 로그인 폼 */}
            <View className="bg-white rounded-2xl shadow-xl p-6">
              <View className="mb-4"> 
                <Text style={{ fontFamily: 'System' }} className="text-sm font-semibold text-gray-700 mb-3 tracking-wide">
                  전화번호
                </Text>
                <View
                  className={`${baseInputWrapperStyle} ${
                    focusedField === 'number'
                      ? focusedInputWrapperStyle
                      : blurredInputWrapperStyle
                  }`}
                >
                  <TextInput
                    style={{ fontFamily: 'System' }}
                    className="flex-1 text-gray-900 text-base"
                    placeholder="01012345678"
                    placeholderTextColor="#9ca3af"
                    value={number}
                    onChangeText={setNumber}
                    onFocus={() => setFocusedField('number')}
                    onBlur={() => setFocusedField(null)}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View className="mb-4">
                <Text style={{ fontFamily: 'System' }} className="text-sm font-semibold text-gray-700 mb-3 tracking-wide">
                  비밀번호
                </Text>
                <View
                  className={`${baseInputWrapperStyle} ${
                    focusedField === 'password'
                      ? focusedInputWrapperStyle
                      : blurredInputWrapperStyle
                  }`}
                >
                  <TextInput
                    style={{ fontFamily: 'System' }}
                    className="flex-1 text-gray-900 text-base"
                    placeholder="비밀번호를 입력하세요"
                    placeholderTextColor="#9ca3af"
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    secureTextEntry
                  />
                </View>
              </View>

              <View className="flex-row justify-end mb-4">
                <TouchableOpacity onPress={handleForgotPassword} className="py-1">
                  <Text style={{ fontFamily: 'System' }} className="text-sm text-teal-600 font-medium">
                    비밀번호를 잊으셨나요?
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                className={`w-full py-4 rounded-xl items-center justify-center shadow-lg ${
                  isLoading ? 'bg-teal-400' : 'bg-teal-600'
                }`}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="white" />
                    <Text style={{ fontFamily: 'System' }} className="text-white font-semibold text-base ml-2 tracking-wide">
                      로그인 중...
                    </Text>
                  </View>
                ) : (
                  <Text style={{ fontFamily: 'System' }} className="text-white font-semibold text-base tracking-wide">
                    로그인
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* 회원가입 섹션 */}
            <View className="mt-8 flex-row justify-center items-center">
              <Text style={{ fontFamily: 'System' }} className="text-base text-gray-600 font-normal">
                계정이 없으신가요?
              </Text>
              <TouchableOpacity onPress={handleSignup} className="ml-2 py-1">
                <Text style={{ fontFamily: 'System' }} className="text-base text-teal-600 font-bold">
                  회원가입
                </Text>
              </TouchableOpacity>
            </View>

            {/* 추가 정보 */}
            <View className="mt-12 items-center">
              <Text style={{ fontFamily: 'System' }} className="text-xs text-gray-400 font-light">
                로그인함으로써 서비스 이용약관에 동의합니다
              </Text>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default LoginPage;