import React from 'react';
import { View, Text } from 'react-native';
import { User } from 'lucide-react-native';
import Global from '@/constants/Global';

interface UserInfoBannerProps {
  relation?: string;
}

/**
 * 선택된 이용자 정보를 표시하는 배너 컴포넌트
 * 보호자 모드에서만 표시됨
 */
const UserInfoBanner: React.FC<UserInfoBannerProps> = ({ relation }) => {
  // 보호자 모드이고 이용자가 선택된 경우에만 표시
  if (Global.USER_ROLE !== 'supporter' || !Global.TARGET_NUMBER) {
    return null;
  }

  return (
    <View className="bg-blue-50 px-5 py-3 flex-row items-center border-b border-blue-100">
      <User size={16} color="#2563eb" />
      <Text className="text-blue-700 text-sm ml-2 font-medium">
        {relation
          ? `${relation} (${Global.TARGET_NUMBER})의 정보`
          : `${Global.TARGET_NUMBER}의 정보`
        }
      </Text>
    </View>
  );
};

export default UserInfoBanner;
