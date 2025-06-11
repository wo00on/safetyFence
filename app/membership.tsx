import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Calendar, Search, MapPin, X, Check } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

// 모의 요양원/보호센터 데이터
const CARE_CENTERS = [
  { id: 1, name: "행복한 요양원", address: "서울특별시 강남구 테헤란로 123", type: "요양원" },
  { id: 2, name: "건강한 노인복지센터", address: "서울특별시 서초구 서초대로 456", type: "복지센터" },
  { id: 3, name: "편안한 주야간보호센터", address: "서울특별시 송파구 올림픽로 789", type: "주야간보호센터" },
  { id: 4, name: "사랑의 요양원", address: "서울특별시 강동구 천호대로 101", type: "요양원" },
  { id: 5, name: "희망 노인복지센터", address: "서울특별시 마포구 양화로 202", type: "복지센터" },
  { id: 6, name: "미소 주야간보호센터", address: "서울특별시 영등포구 여의대로 303", type: "주야간보호센터" },
  { id: 7, name: "햇살 요양원", address: "서울특별시 용산구 이태원로 404", type: "요양원" },
  { id: 8, name: "푸른 노인복지센터", address: "서울특별시 종로구 종로 505", type: "복지센터" },
];

interface CareCenter {
  id: number;
  name: string;
  address: string;
  type: string;
}

interface FormData {
  name: string;
  birthDate: Date | null;
  phone: string;
  password: string;
  confirmPassword: string;
  zipCode: string;
  address: string;
  detailAddress: string;
  isElderly: boolean;
  careCenter: CareCenter | null;
  selectedService: "PAYPASS_SERVICE" | "CARE_SERVICE" | "ALL_SERVICE" | "NONE" | "";
}

// Navigation 타입 정의
type RootStackParamList = {
  Signup: undefined;
  SelectRole: undefined;
};

type SignupScreenNavigationProp = NavigationProp<RootStackParamList, 'Signup'>;

const SignupPage: React.FC = () => {
  const navigation = useNavigation<SignupScreenNavigationProp>();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    birthDate: null,
    phone: "",
    password: "",
    confirmPassword: "",
    zipCode: "",
    address: "",
    detailAddress: "",
    isElderly: false,
    careCenter: null,
    selectedService: "",
  });

  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [isCareCenterModalOpen, setIsCareCenterModalOpen] = useState<boolean>(false);
  const [isPostcodeModalOpen, setIsPostcodeModalOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredCenters, setFilteredCenters] = useState<CareCenter[]>(CARE_CENTERS);

  // 다음 우편번호 API HTML (수정된 버전)
  const postcodeHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>우편번호 검색</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: white;
          }
          #layer {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: white;
          }
          .close-btn {
            position: absolute;
            top: 10px;
            right: 10px;
            z-index: 1000;
            background: #f0f0f0;
            border: none;
            border-radius: 20px;
            width: 40px;
            height: 40px;
            font-size: 18px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            color: #666;
          }
          #postcode {
            width: 100%;
            height: 100%;
          }
        </style>
      </head>
      <body>
        <div id="layer">
          <button class="close-btn" onclick="closeDaumPostcode()">×</button>
          <div class="loading" id="loading">주소 검색을 로딩 중...</div>
          <div id="postcode"></div>
        </div>
        
        <script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script>
        <script>
          function initDaumPostcode() {
            // 로딩 메시지 숨기기
            const loadingEl = document.getElementById('loading');
            if (loadingEl) {
              loadingEl.style.display = 'none';
            }
            
            try {
              new daum.Postcode({
                oncomplete: function(data) {
                  var addr = '';
                  var extraAddr = '';

                  // 사용자가 선택한 주소 타입에 따라 처리
                  if (data.userSelectedType === 'R') { // 도로명 주소
                    addr = data.roadAddress;
                  } else { // 지번 주소
                    addr = data.jibunAddress;
                  }

                  // 도로명 주소인 경우 추가 정보 처리
                  if (data.userSelectedType === 'R') {
                    if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
                      extraAddr += data.bname;
                    }
                    if (data.buildingName !== '' && data.apartment === 'Y') {
                      extraAddr += (extraAddr !== '' ? ', ' + data.buildingName : data.buildingName);
                    }
                    if (extraAddr !== '') {
                      extraAddr = ' (' + extraAddr + ')';
                    }
                    addr += extraAddr;
                  }

                  // React Native로 데이터 전달
                  try {
                    const messageData = {
                      type: 'complete',
                      zipCode: data.zonecode,
                      address: addr
                    };
                    
                    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                      window.ReactNativeWebView.postMessage(JSON.stringify(messageData));
                    }
                  } catch (error) {
                    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'error',
                        message: '주소 전송 중 오류가 발생했습니다'
                      }));
                    }
                  }
                },
                onerror: function(error) {
                  if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'error',
                      message: '주소 검색 중 오류가 발생했습니다: ' + error
                    }));
                  }
                },
                onclose: function(state) {
                  // 완료 후 닫힘이 아닌 경우에만 close 메시지 전송
                  if (state !== 'COMPLETE_CLOSE') {
                    try {
                      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                          type: 'close'
                        }));
                      }
                    } catch (error) {
                      // 에러 무시
                    }
                  }
                },
                width: '100%',
                height: '100%',
                maxSuggestItems: 5,
                autoMapping: true,
                shorthand: false
              }).embed('postcode');
            } catch (error) {
              const loadingEl = document.getElementById('loading');
              if (loadingEl) {
                loadingEl.innerHTML = '주소 검색 서비스를 불러올 수 없습니다: ' + error.message;
              }
            }
          }

          function closeDaumPostcode() {
            try {
              if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'close'
                }));
              }
            } catch (error) {
              // 에러 무시
            }
          }

          // 스크립트 로딩 및 초기화
          function checkAndInit() {
            if (typeof daum !== 'undefined' && daum.Postcode) {
              initDaumPostcode();
            } else {
              setTimeout(checkAndInit, 100);
            }
          }

          // DOMContentLoaded 이벤트 리스너
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
              checkAndInit();
            });
          } else {
            checkAndInit();
          }

          // 추가 안전장치
          window.addEventListener('load', function() {
            setTimeout(function() {
              if (typeof daum !== 'undefined' && daum.Postcode) {
                initDaumPostcode();
              }
            }, 500);
          });
        </script>
      </body>
    </html>
  `;

  // 검색어에 따라 요양원/보호센터 필터링
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredCenters(CARE_CENTERS);
    } else {
      const filtered = CARE_CENTERS.filter(
        (center) =>
          center.name.includes(searchTerm) || 
          center.address.includes(searchTerm) || 
          center.type.includes(searchTerm)
      );
      setFilteredCenters(filtered);
    }
  }, [searchTerm]);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // 우편번호 검색 버튼 클릭
  const searchZipCode = () => {
    setIsPostcodeModalOpen(true);
  };

  // 웹뷰에서 메시지 수신 (수정됨)
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'complete') {
        // 주소 정보 설정
        setFormData(prev => ({
          ...prev,
          zipCode: data.zipCode,
          address: data.address
        }));
        
        // 모달 닫기
        setIsPostcodeModalOpen(false);
        
        // 성공 알림
        Alert.alert("성공", "주소가 선택되었습니다.");
      } else if (data.type === 'close') {
        setIsPostcodeModalOpen(false);
      } else if (data.type === 'error') {
        Alert.alert("오류", data.message);
        setIsPostcodeModalOpen(false);
      }
    } catch (error) {
      Alert.alert("오류", "주소 검색 중 오류가 발생했습니다.");
    }
  };

  // WebView 오류 처리
  const handleWebViewError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    Alert.alert("오류", "주소 검색 서비스를 불러올 수 없습니다. 네트워크 연결을 확인해주세요.");
  };

  const selectCareCenter = (center: CareCenter) => {
    handleInputChange("careCenter", center);
    setIsCareCenterModalOpen(false);
  };

  const removeCareCenter = () => {
    handleInputChange("careCenter", null);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      handleInputChange("birthDate", selectedDate);
    }
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return "생년월일을 선택하세요";
    return `${date.getFullYear()}년 ${(date.getMonth() + 1).toString().padStart(2, '0')}월 ${date.getDate().toString().padStart(2, '0')}일`;
  };

  const isFormValid = (): boolean => {
    const requiredFields = [
      formData.name,
      formData.birthDate,
      formData.phone,
      formData.password,
      formData.confirmPassword,
      formData.zipCode,
      formData.address,
      formData.detailAddress,
      formData.selectedService,
    ];

    const basicFieldsValid = requiredFields.every((field) => 
      field && field.toString().trim() !== ""
    );

    const passwordsMatch = formData.password === formData.confirmPassword;

    if (formData.isElderly) {
      return basicFieldsValid && passwordsMatch && formData.careCenter !== null;
    }

    return basicFieldsValid && passwordsMatch;
  };

  // 회원가입 데이터 준비 함수
  const prepareSignupData = () => {
    const signupData = {
      name: formData.name,
      birthDate: formData.birthDate,
      phone: formData.phone,
      password: formData.password,
      zipCode: formData.zipCode,
      address: formData.address,
      detailAddress: formData.detailAddress,
      isElderly: formData.isElderly,
      careCenter: formData.careCenter,
      selectedService: formData.selectedService,
    };
    return signupData;
  };

  const handleSubmit = () => {
    if (isFormValid()) {
      const signupData = prepareSignupData();
      Alert.alert(
        "회원가입 완료", 
        "회원가입이 성공적으로 완료되었습니다!",
        [
          {
            text: "확인",
            onPress: () => navigation.navigate('SelectRole')
          }
        ]
      );
    } else {
      Alert.alert("오류", "모든 필수 항목을 입력해주세요.");
    }
  };

  const CheckboxItem: React.FC<{
    id: string;
    checked: boolean;
    onPress: () => void;
    label: string;
  }> = ({ checked, onPress, label }) => (
    <TouchableOpacity 
      className="flex-row items-center py-2" 
      onPress={onPress}
    >
      <View className={`w-5 h-5 border-2 rounded mr-3 items-center justify-center ${
        checked ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
      }`}>
        {checked && <Check size={12} color="white" />}
      </View>
      <Text className="text-sm font-medium text-gray-700 flex-1">{label}</Text>
    </TouchableOpacity>
  );

  const ServiceCheckboxItem: React.FC<{
    service: string;
    label: string;
  }> = ({ service, label }) => (
    <CheckboxItem
      id={service}
      checked={formData.selectedService === service}
      onPress={() => handleInputChange("selectedService", service)}
      label={label}
    />
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-4 py-6">
          {/* 헤더 */}
          <View className="bg-white rounded-xl p-6 mb-6 shadow-sm">
            <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
              회원가입
            </Text>
            <Text className="text-gray-500 text-center">
              서비스 이용을 위해 정보를 입력해주세요
            </Text>
          </View>

          <View className="bg-white rounded-xl p-6 shadow-sm">
            {/* 이름 */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                이름 <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900"
                placeholder="이름을 입력하세요"
                value={formData.name}
                onChangeText={(text) => handleInputChange("name", text)}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* 생년월일 */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                생년월일 <Text className="text-red-500">*</Text>
              </Text>
              <TouchableOpacity
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex-row items-center"
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={16} color="#6B7280" className="mr-2" />
                <Text className={`flex-1 ${formData.birthDate ? 'text-gray-900' : 'text-gray-500'}`}>
                  {formatDate(formData.birthDate)}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={formData.birthDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                />
              )}
            </View>

            {/* 전화번호 */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                전화번호 <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900"
                placeholder="01000000000 숫자만 작성"
                value={formData.phone}
                onChangeText={(text) => {
                  // 숫자만 입력되도록 필터링
                  const numericText = text.replace(/[^0-9]/g, '');
                  handleInputChange("phone", numericText);
                }}
                keyboardType="number-pad"
                placeholderTextColor="#9CA3AF"
                maxLength={11}
              />
            </View>

            {/* 비밀번호 */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                비밀번호 <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900"
                placeholder="비밀번호를 입력하세요"
                value={formData.password}
                onChangeText={(text) => handleInputChange("password", text)}
                secureTextEntry
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* 비밀번호 확인 */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                비밀번호 확인 <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900"
                placeholder="비밀번호를 다시 입력하세요"
                value={formData.confirmPassword}
                onChangeText={(text) => handleInputChange("confirmPassword", text)}
                secureTextEntry
                placeholderTextColor="#9CA3AF"
              />
              {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <Text className="text-xs text-red-600 mt-1">비밀번호가 일치하지 않습니다</Text>
              )}
              {formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && (
                <Text className="text-xs text-green-600 mt-1">비밀번호가 일치합니다</Text>
              )}
            </View>

            {/* 주소 */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                주소 <Text className="text-red-500">*</Text>
              </Text>
              
              {/* 우편번호 */}
              <View className="flex-row mb-3">
                <TextInput
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 mr-2"
                  placeholder="우편번호"
                  value={formData.zipCode}
                  editable={false}
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity
                  className="bg-blue-600 border border-blue-600 rounded-lg px-4 py-3 flex-row items-center"
                  onPress={searchZipCode}
                >
                  <Search size={16} color="white" className="mr-1" />
                  <Text className="text-white font-medium">검색</Text>
                </TouchableOpacity>
              </View>

              {/* 기본주소 */}
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 mb-3"
                placeholder="기본주소"
                value={formData.address}
                editable={false}
                placeholderTextColor="#9CA3AF"
              />

              {/* 상세주소 */}
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900"
                placeholder="상세주소를 입력하세요"
                value={formData.detailAddress}
                onChangeText={(text) => handleInputChange("detailAddress", text)}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* 이용자 구분 */}
            <View className="mb-6">
              <CheckboxItem
                id="elderly"
                checked={formData.isElderly}
                onPress={() => {
                  const newValue = !formData.isElderly;
                  handleInputChange("isElderly", newValue);
                  if (!newValue) {
                    handleInputChange("careCenter", null);
                  }
                }}
                label="노인 이용자입니다"
              />

              {/* 요양원/보호센터 정보 */}
              {formData.isElderly && (
                <View className="ml-8 mt-4 p-4 border-l-2 border-blue-200 bg-blue-50 rounded-r-lg">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    요양원/보호센터 <Text className="text-red-500">*</Text>
                  </Text>

                  {formData.careCenter ? (
                    <View className="bg-white p-4 border border-gray-200 rounded-lg">
                      <View className="flex-row justify-between items-start mb-2">
                        <Text className="font-medium text-gray-900 flex-1">
                          {formData.careCenter.name}
                        </Text>
                        <View className="bg-blue-100 px-2 py-1 rounded">
                          <Text className="text-xs text-blue-800">
                            {formData.careCenter.type}
                          </Text>
                        </View>
                      </View>
                      <View className="flex-row items-center mb-2">
                        <MapPin size={12} color="#6B7280" className="mr-1" />
                        <Text className="text-sm text-gray-500 flex-1">
                          {formData.careCenter.address}
                        </Text>
                      </View>
                      <TouchableOpacity
                        className="absolute top-2 right-2"
                        onPress={removeCareCenter}
                      >
                        <X size={16} color="#6B7280" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex-row items-center justify-between"
                      onPress={() => setIsCareCenterModalOpen(true)}
                    >
                      <Text className="text-gray-500">요양원/보호센터를 검색하세요</Text>
                      <Search size={16} color="#6B7280" />
                    </TouchableOpacity>
                  )}

                  {formData.isElderly && !formData.careCenter && (
                    <Text className="text-xs text-amber-600 mt-1">
                      노인 이용자는 요양원/보호센터 선택이 필요합니다
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* 서비스 선택 */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-4">
                이용 서비스 선택 <Text className="text-red-500">*</Text>
              </Text>
              <View className="space-y-2">
                <ServiceCheckboxItem
                  service="PAYPASS_SERVICE"
                  label="PAYPASS_SERVICE (결제 서비스)"
                />
                <ServiceCheckboxItem
                  service="CARE_SERVICE"
                  label="CARE_SERVICE (돌봄 서비스)"
                />
                <ServiceCheckboxItem
                  service="ALL_SERVICE"
                  label="ALL_SERVICE (전체 서비스)"
                />
                <ServiceCheckboxItem
                  service="NONE"
                  label="NONE (서비스 미선택)"
                />
              </View>
            </View>

            {/* 회원가입 버튼 */}
            <TouchableOpacity
              className={`rounded-lg py-4 px-6 ${
                isFormValid() ? 'bg-blue-600 active:bg-blue-700' : 'bg-gray-300'
              }`}
              onPress={handleSubmit}
              disabled={!isFormValid()}
            >
              <Text className={`text-center text-lg font-medium ${
                isFormValid() ? 'text-white' : 'text-gray-500'
              }`}>
                회원가입 완료
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* 다음 우편번호 검색 모달 */}
        <Modal
          visible={isPostcodeModalOpen}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setIsPostcodeModalOpen(false)}
        >
          <SafeAreaView className="flex-1 bg-white">
            <View className="flex-1">
              <View className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                <View className="flex-row items-center justify-between">
                  <Text className="text-lg font-semibold text-gray-900">주소 검색</Text>
                  <TouchableOpacity
                    onPress={() => setIsPostcodeModalOpen(false)}
                    className="bg-gray-200 rounded-full p-2"
                  >
                    <X size={20} color="#374151" />
                  </TouchableOpacity>
                </View>
              </View>
              <WebView
                source={{ html: postcodeHTML }}
                onMessage={handleWebViewMessage}
                onError={handleWebViewError}
                onHttpError={handleWebViewError}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                scalesPageToFit={true}
                mixedContentMode="compatibility"
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
                originWhitelist={['*']}
                allowsFullscreenVideo={false}
                bounces={false}
                scrollEnabled={true}
                style={{ flex: 1 }}
                renderLoading={() => (
                  <View className="flex-1 justify-center items-center bg-white">
                    <Text className="text-gray-500">주소 검색을 준비 중...</Text>
                  </View>
                )}
              />
            </View>
          </SafeAreaView>
        </Modal>

        {/* 요양원/보호센터 검색 모달 */}
        <Modal
          visible={isCareCenterModalOpen}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsCareCenterModalOpen(false)}
        >
          <View className="flex-1 bg-black/50 justify-center items-center">
            <View className="bg-white rounded-xl m-4 p-6 max-h-96 w-full max-w-md">
              <Text className="text-xl font-bold text-gray-900 mb-4">
                요양원/보호센터 검색
              </Text>
              
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-4"
                placeholder="이름 또는 주소로 검색"
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholderTextColor="#9CA3AF"
              />

              <FlatList
                data={filteredCenters}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className="p-3 border-b border-gray-100"
                    onPress={() => selectCareCenter(item)}
                  >
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="font-medium text-gray-900 flex-1">
                        {item.name}
                      </Text>
                      <View className="bg-blue-100 px-2 py-1 rounded">
                        <Text className="text-xs text-blue-800">{item.type}</Text>
                      </View>
                    </View>
                    <View className="flex-row items-center">
                      <MapPin size={12} color="#6B7280" className="mr-1" />
                      <Text className="text-sm text-gray-500 flex-1">
                        {item.address}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text className="text-center text-gray-500 py-4">
                    검색 결과가 없습니다
                  </Text>
                }
              />

              <TouchableOpacity
                className="bg-gray-200 rounded-lg py-3 mt-4"
                onPress={() => setIsCareCenterModalOpen(false)}
              >
                <Text className="text-center text-gray-700 font-medium">닫기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignupPage;

// 추가로 설치해야 할 패키지:
// npm install react-native-webview
// npx pod-install (iOS만 해당)