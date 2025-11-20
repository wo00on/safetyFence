import React from 'react';
import { SafeAreaView, ScrollView, Text, View, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';

const PrivacyPolicyPage: React.FC = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView className="flex-1 bg-white pt-safe">
      <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <ChevronLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-800">개인정보 처리방침</Text>
        <View className="w-10" />
      </View>
      <ScrollView className="flex-1 p-4">
        <Text className="text-lg font-bold mb-4">개인정보 처리방침</Text>
        <Text className="text-base mb-2">
          'SafetyFence' (이하 '회사')는 개인정보보호법에 따라 이용자의 개인정보 보호 및 권익을 보호하고 개인정보와 관련한 이용자의 고충을 원활하게 처리할 수 있도록 다음과 같은 처리방침을 두고 있습니다.
        </Text>
        <Text className="text-base mb-4">
          회사는 개인정보처리방침을 개정하는 경우 웹사이트 공지사항(또는 개별공지)을 통하여 공지할 것입니다.
        </Text>

        <Text className="text-lg font-bold mb-2">제1조 (개인정보의 처리 목적)</Text>
        <Text className="text-base mb-4">
          회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보 보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
          
1. 홈페이지 회원가입 및 관리
          회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지, 각종 고지·통지, 고충처리 등을 목적으로 개인정보를 처리합니다.
          
2. 재화 또는 서비스 제공
          물품배송, 서비스 제공, 계약서·청구서 발송, 콘텐츠 제공, 맞춤서비스 제공, 본인인증, 연령인증, 요금결제·정산 등을 목적으로 개인정보를 처리합니다.
          
3. 마케팅 및 광고에의 활용
          신규 서비스(제품) 개발 및 맞춤 서비스 제공, 이벤트 및 광고성 정보 제공 및 참여기회 제공, 인구통계학적 특성에 따른 서비스 제공 및 광고 게재, 접속빈도 파악 또는 회원의 서비스 이용에 대한 통계 등을 목적으로 개인정보를 처리합니다.
        </Text>

        <Text className="text-lg font-bold mb-2">제2조 (개인정보의 처리 및 보유 기간)</Text>
        <Text className="text-base mb-4">
          ① 회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의 받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
          
② 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다.
          
1. 홈페이지 회원 가입 및 관리 : 홈페이지 탈퇴 시까지
          
          다만, 다음의 사유에 해당하는 경우에는 해당 사유 종료 시까지
          
1) 관계 법령 위반에 따른 수사·조사 등이 진행 중인 경우에는 해당 수사·조사 종료 시까지
          
2) 홈페이지 이용에 따른 채권·채무관계 잔존 시에는 해당 채권·채무관계 정산 시까지
        </Text>

        <Text className="text-lg font-bold mb-2">제3조 (정보주체의 권리·의무 및 행사방법)</Text>
        <Text className="text-base mb-4">
          이용자는 개인정보주체로서 다음과 같은 권리를 행사할 수 있습니다.
          
1. 개인정보 열람요구
          
2. 오류 등이 있을 경우 정정 요구
          
3. 삭제요구
          
4. 처리정지 요구
        </Text>
        
        <Text className="text-sm text-gray-500 mt-8">
          본 방침은 2025년 11월 20일부터 시행됩니다.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PrivacyPolicyPage;
