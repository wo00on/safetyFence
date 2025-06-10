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
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredCenters, setFilteredCenters] = useState<CareCenter[]>(CARE_CENTERS);

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

  const searchZipCode = () => {
    Alert.alert("우편번호 검색", "우편번호 검색 기능 (실제 구현 시 다음 우편번호 API 등을 사용)");
    // 모의 데이터로 채우기
    handleInputChange("zipCode", "06234");
    handleInputChange("address", "서울특별시 강남구 테헤란로 123");
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

  const handleSubmit = () => {
    if (isFormValid()) {
      console.log("회원가입 데이터:", formData);
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
                placeholder="010-0000-0000"
                value={formData.phone}
                onChangeText={(text) => handleInputChange("phone", text)}
                keyboardType="phone-pad"
                placeholderTextColor="#9CA3AF"
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
                  onChangeText={(text) => handleInputChange("zipCode", text)}
                  editable={false}
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity
                  className="bg-gray-200 border border-gray-300 rounded-lg px-4 py-3 flex-row items-center"
                  onPress={searchZipCode}
                >
                  <Search size={16} color="#374151" className="mr-1" />
                  <Text className="text-gray-700 font-medium">검색</Text>
                </TouchableOpacity>
              </View>

              {/* 기본주소 */}
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 mb-3"
                placeholder="기본주소"
                value={formData.address}
                onChangeText={(text) => handleInputChange("address", text)}
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