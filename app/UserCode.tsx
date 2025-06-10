import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Clipboard,
  Share,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { User, Copy, RefreshCw, Share2 } from 'lucide-react-native';

interface UserCodePageProps {}

const UserCodePage: React.FC<UserCodePageProps> = () => {
  const navigation = useNavigation();
  const [userCode, setUserCode] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // 사용자 코드 생성
  useEffect(() => {
    const generateCode = (): string => {
      return Math.floor(100000 + Math.random() * 900000).toString();
    };
    setUserCode(generateCode());
  }, []);

  const handleCopyCode = async (): Promise<void> => {
    try {
      await Clipboard.setString(userCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      Alert.alert('복사 완료', '코드가 클립보드에 복사되었습니다.');
    } catch (err) {
      console.error('복사 실패:', err);
      Alert.alert('오류', '코드 복사에 실패했습니다.');
    }
  };

  const handleRefreshCode = (): void => {
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setUserCode(newCode);
  };

  const handleShareCode = async (): Promise<void> => {
    try {
      await Share.share({
        message: `나의 이용자 코드: ${userCode}`,
        title: '이용자 코드 공유',
      });
    } catch (err) {
      console.error('공유 실패:', err);
    }
  };

  const handleContinue = (): void => {
    navigation.navigate('main' as never);
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="flex-1 justify-center items-center p-4 min-h-screen">
        {/* Card Container */}
        <View className="w-full max-w-sm bg-white rounded-lg shadow-lg">
          {/* Header */}
          <View className="pt-6 pb-4 px-6 items-center">
            <View className="h-16 w-16 bg-blue-100 rounded-full items-center justify-center mb-4">
              <User size={32} color="#2563eb" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
              나의 이용자 코드
            </Text>
            <Text className="text-base text-gray-600 text-center">
              보호자에게 이 코드를 알려주어 연결하세요
            </Text>
          </View>

          {/* Content */}
          <View className="px-6 pb-6 space-y-6">
            {/* 코드 표시 */}
            <View className="items-center">
              <View className="bg-gray-100 rounded-lg p-6 mb-4 w-full">
                <Text className="text-4xl font-mono font-bold text-gray-900 text-center tracking-widest mb-2">
                  {userCode}
                </Text>
                <View className="items-center">
                  <View className="bg-green-50 px-3 py-1 rounded-full border border-green-200">
                    <Text className="text-green-700 text-sm font-medium">
                      활성 상태
                    </Text>
                  </View>
                </View>
              </View>

              {/* 버튼들 */}
              <View className="flex-row space-x-2 w-full">
                <TouchableOpacity
                  className={`flex-1 flex-row items-center justify-center py-3 px-4 rounded-md border ${
                    copied ? 'bg-gray-100' : 'bg-white'
                  } border-gray-300`}
                  onPress={handleCopyCode}
                  disabled={copied}
                >
                  <Copy size={16} color="#374151" />
                  <Text className="ml-2 text-gray-700 font-medium">
                    {copied ? '복사됨!' : '복사'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-white border border-gray-300 rounded-md p-3"
                  onPress={handleRefreshCode}
                >
                  <RefreshCw size={16} color="#374151" />
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-white border border-gray-300 rounded-md p-3"
                  onPress={handleShareCode}
                >
                  <Share2 size={16} color="#374151" />
                </TouchableOpacity>
              </View>
            </View>

            {/* 안내 정보 */}
            <View className="bg-blue-50 p-4 rounded-lg">
              <Text className="font-medium text-blue-900 mb-2">
                코드 사용 방법
              </Text>
              <View className="space-y-1">
                <Text className="text-sm text-blue-800">
                  1. 위 6자리 코드를 보호자에게 알려주세요
                </Text>
                <Text className="text-sm text-blue-800">
                  2. 보호자가 앱에서 코드를 입력합니다
                </Text>
                <Text className="text-sm text-blue-800">
                  3. 연결 완료 후 위치 공유가 시작됩니다
                </Text>
              </View>
            </View>

            {/* 주의사항 */}
            <View className="bg-amber-50 p-4 rounded-lg">
              <Text className="font-medium text-amber-900 mb-2">
                ⚠️ 주의사항
              </Text>
              <View className="space-y-1">
                <Text className="text-sm text-amber-800">
                  • 코드는 신뢰할 수 있는 보호자에게만 알려주세요
                </Text>
                <Text className="text-sm text-amber-800">
                  • 필요시 언제든 새 코드로 변경할 수 있습니다
                </Text>
                <Text className="text-sm text-amber-800">
                  • 코드 연결 후 위치 정보가 공유됩니다
                </Text>
              </View>
            </View>

            {/* 계속하기 버튼 */}
            <TouchableOpacity
              className="w-full bg-blue-600 py-3 rounded-md"
              onPress={handleContinue}
            >
              <Text className="text-white text-lg font-medium text-center">
                계속하기
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default UserCodePage;