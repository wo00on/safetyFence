import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  SafeAreaView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

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
  zipCode: string;
  address: string;
  detailAddress: string;
  isElderly: boolean;
  careCenter: CareCenter | null;
}

export default function SignupScreen() {
  const navigation = useNavigation();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    birthDate: null,
    phone: "",
    zipCode: "",
    address: "",
    detailAddress: "",
    isElderly: false,
    careCenter: null,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCareCenterModal, setShowCareCenterModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCenters, setFilteredCenters] = useState(CARE_CENTERS);

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
    Alert.alert(
      "우편번호 검색",
      "실제 구현 시 다음 우편번호 API 등을 사용합니다",
      [
        {
          text: "확인",
          onPress: () => {
            handleInputChange("zipCode", "06234");
            handleInputChange("address", "서울특별시 강남구 테헤란로 123");
          }
        }
      ]
    );
  };

  const selectCareCenter = (center: CareCenter) => {
    handleInputChange("careCenter", center);
    setShowCareCenterModal(false);
  };

  const removeCareCenter = () => {
    handleInputChange("careCenter", null);
  };

  const formatDate = (date: Date) => {
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      handleInputChange("birthDate", selectedDate);
    }
  };

  const isFormValid = () => {
    const requiredFields = [
      formData.name,
      formData.birthDate,
      formData.phone,
      formData.zipCode,
      formData.address,
      formData.detailAddress,
    ];

    const basicFieldsValid = requiredFields.every((field) => 
      field && field.toString().trim() !== ""
    );

    if (formData.isElderly) {
      return basicFieldsValid && formData.careCenter !== null;
    }

    return basicFieldsValid;
  };

  const handleSubmit = () => {
    if (isFormValid()) {
      console.log("회원가입 데이터:", formData);
      // 회원가입 완료 후 역할 선택 페이지로 이동
      navigation.navigate('SelectRole' as never);
    }
  };

  const renderCareCenterItem = ({ item }: { item: CareCenter }) => (
    <TouchableOpacity
      className="p-4 border-b border-gray-200"
      onPress={() => selectCareCenter(item)}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="text-base font-medium text-gray-900">{item.name}</Text>
            <View className="ml-2 px-2 py-1 bg-blue-100 rounded">
              <Text className="text-xs text-blue-800">{item.type}</Text>
            </View>
          </View>
          <View className="flex-row items-center mt-1">
            <Ionicons name="location-outline" size={12} color="#6B7280" />
            <Text className="text-sm text-gray-500 ml-1">{item.address}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-4 py-6">
        <View className="max-w-2xl mx-auto w-full">
          {/* 헤더 */}
          <View className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
              회원가입
            </Text>
            <Text className="text-gray-600 text-center">
              서비스 이용을 위해 정보를 입력해주세요
            </Text>
          </View>

          {/* 폼 */}
          <View className="bg-white rounded-lg shadow-sm p-6">
            {/* 이름 */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                이름 <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className="w-full p-3 border border-gray-300 rounded-md bg-white"
                placeholder="이름을 입력하세요"
                value={formData.name}
                onChangeText={(text) => handleInputChange("name", text)}
              />
            </View>

            {/* 생년월일 */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                생년월일 <Text className="text-red-500">*</Text>
              </Text>
              <TouchableOpacity
                className="w-full p-3 border border-gray-300 rounded-md bg-white flex-row items-center"
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                <Text className={`ml-2 ${formData.birthDate ? 'text-gray-900' : 'text-gray-500'}`}>
                  {formData.birthDate ? formatDate(formData.birthDate) : '생년월일을 선택하세요'}
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
                className="w-full p-3 border border-gray-300 rounded-md bg-white"
                placeholder="010-0000-0000"
                value={formData.phone}
                onChangeText={(text) => handleInputChange("phone", text)}
                keyboardType="phone-pad"
              />
            </View>

            {/* 주소 */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                주소 <Text className="text-red-500">*</Text>
              </Text>
              
              {/* 우편번호 */}
              <View className="flex-row mb-3">
                <TextInput
                  className="flex-1 p-3 border border-gray-300 rounded-md bg-gray-100 mr-2"
                  placeholder="우편번호"
                  value={formData.zipCode}
                  editable={false}
                />
                <TouchableOpacity
                  className="px-4 py-3 bg-white border border-gray-300 rounded-md flex-row items-center"
                  onPress={searchZipCode}
                >
                  <Ionicons name="search-outline" size={16} color="#6B7280" />
                  <Text className="text-gray-700 ml-1">검색</Text>
                </TouchableOpacity>
              </View>

              {/* 기본주소 */}
              <TextInput
                className="w-full p-3 border border-gray-300 rounded-md bg-gray-100 mb-3"
                placeholder="기본주소"
                value={formData.address}
                editable={false}
              />

              {/* 상세주소 */}
              <TextInput
                className="w-full p-3 border border-gray-300 rounded-md bg-white"
                placeholder="상세주소를 입력하세요"
                value={formData.detailAddress}
                onChangeText={(text) => handleInputChange("detailAddress", text)}
              />
            </View>

            {/* 이용자 구분 */}
            <View className="mb-6">
              <TouchableOpacity
                className="flex-row items-center mb-4"
                onPress={() => {
                  const newValue = !formData.isElderly;
                  handleInputChange("isElderly", newValue);
                  if (!newValue) {
                    handleInputChange("careCenter", null);
                  }
                }}
              >
                <View className={`w-5 h-5 border-2 rounded mr-3 items-center justify-center ${
                  formData.isElderly ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                }`}>
                  {formData.isElderly && (
                    <Ionicons name="checkmark" size={12} color="white" />
                  )}
                </View>
                <Text className="text-sm font-medium text-gray-700">
                  노인 이용자입니다
                </Text>
              </TouchableOpacity>

              {/* 요양원/보호센터 정보 */}
              {formData.isElderly && (
                <View className="pl-6 border-l-2 border-blue-200">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    요양원/보호센터 <Text className="text-red-500">*</Text>
                  </Text>

                  {formData.careCenter ? (
                    <View className="p-3 border border-gray-200 rounded-md bg-gray-50 relative">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                          <View className="flex-row items-center">
                            <Text className="font-medium text-gray-900">{formData.careCenter.name}</Text>
                            <View className="ml-2 px-2 py-1 bg-blue-100 rounded">
                              <Text className="text-xs text-blue-800">{formData.careCenter.type}</Text>
                            </View>
                          </View>
                          <View className="flex-row items-center mt-1">
                            <Ionicons name="location-outline" size={12} color="#6B7280" />
                            <Text className="text-sm text-gray-500 ml-1">{formData.careCenter.address}</Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          className="p-1"
                          onPress={removeCareCenter}
                        >
                          <Ionicons name="close" size={20} color="#6B7280" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      className="w-full p-3 border border-gray-300 rounded-md bg-white flex-row items-center justify-between"
                      onPress={() => setShowCareCenterModal(true)}
                    >
                      <Text className="text-gray-500">요양원/보호센터를 검색하세요</Text>
                      <Ionicons name="search-outline" size={16} color="#6B7280" />
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

            {/* 회원가입 버튼 */}
            <TouchableOpacity
              className={`w-full py-4 rounded-md ${
                isFormValid() 
                  ? 'bg-blue-600' 
                  : 'bg-gray-300'
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
        </View>
      </ScrollView>

      {/* 요양원/보호센터 검색 모달 */}
      <Modal
        visible={showCareCenterModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-1">
            {/* 모달 헤더 */}
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
              <Text className="text-lg font-semibold">요양원/보호센터 검색</Text>
              <TouchableOpacity onPress={() => setShowCareCenterModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* 검색 입력 */}
            <View className="p-4 border-b border-gray-200">
              <View className="flex-row items-center bg-gray-100 rounded-md px-3 py-2">
                <Ionicons name="search-outline" size={16} color="#6B7280" />
                <TextInput
                  className="flex-1 ml-2 text-base"
                  placeholder="이름 또는 주소로 검색"
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                />
              </View>
            </View>

            {/* 검색 결과 */}
            <FlatList
              data={filteredCenters}
              renderItem={renderCareCenterItem}
              keyExtractor={(item) => item.id.toString()}
              ListEmptyComponent={
                <View className="p-8 items-center">
                  <Text className="text-gray-500">검색 결과가 없습니다</Text>
                </View>
              }
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}