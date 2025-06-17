// SignupPage.tsx
import DateTimePicker from '@react-native-community/datetimepicker';
import type { NavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { Calendar, Check, MapPin, Search, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// 다음 우편번호 컴포넌트 import
import DaumPostcode, { DaumPostcodeData } from './DaumPostcode';

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

// 인터페이스 정의
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
  // 🔧 다음 우편번호 검색 모달 상태
  const [isPostcodeMode, setIsPostcodeMode] = useState<boolean>(false);
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

  const handleInputChange = <K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ): void => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // 🔧 다음 우편번호 검색 시작
  const searchZipCode = (): void => {
    setIsPostcodeMode(true);
  };

  // 🔧 다음 우편번호 API에서 주소 선택 처리
  const handleDaumPostcode = (data: DaumPostcodeData): void => {
    console.log('다음 우편번호 API 데이터:', data);
    
    // 주소 조합 로직 (문서의 예시를 참고)
    let fullAddress = data.address;
    let extraAddress = '';

    // 도로명 주소인 경우 추가 정보 처리
    if (data.addressType === 'R') {
      if (data.bname !== '') {
        extraAddress += data.bname;
      }
      if (data.buildingName !== '') {
        extraAddress +=
          extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName;
      }
      fullAddress += extraAddress !== '' ? ` (${extraAddress})` : '';
    }

    // 폼 데이터 업데이트
    setFormData(prev => ({
      ...prev,
      address: fullAddress,
      zipCode: String(data.zonecode),
    }));
    
    // 모달 닫기
    setIsPostcodeMode(false);
    
    // 성공 알림
    Alert.alert(
      "✅ 주소 선택 완료", 
      `우편번호: ${data.zonecode}\n주소: ${fullAddress}\n\n상세주소를 입력해주세요.`,
      [{ text: "확인" }]
    );
  };

  // 다음 우편번호 검색 모달 닫기
  const closeDaumPostcode = (): void => {
    setIsPostcodeMode(false);
  };

  const selectCareCenter = (center: CareCenter): void => {
    handleInputChange("careCenter", center);
    setIsCareCenterModalOpen(false);
  };

  const removeCareCenter = (): void => {
    handleInputChange("careCenter", null);
  };

  const onDateChange = (event: any, selectedDate?: Date): void => {
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

  const handleSubmit = async (): Promise<void> => {
    if (!isFormValid()) {
      Alert.alert("⚠️ 입력 오류", "모든 필수 항목을 올바르게 입력해주세요.");
      return;
    }
    
    const signupData = prepareSignupData();

    try {
      const response = await axios.post(`http://192.168.0.100:8080/login/saveNewUser`, signupData);
      console.log('서버 응답:', response.data);

      Alert.alert(
        "🎉 회원가입 완료",
        "회원가입이 성공적으로 완료되었습니다!",
        [
          {
            text: "확인",
            onPress: () => navigation.navigate('SelectRole')
          }
        ]
      );
    } catch (error) {
      console.error('회원가입 오류:', error);
      Alert.alert("⚠️ 서버 오류", "회원가입에 실패했습니다. 다시 시도해주세요.");
    }
  };

  // 체크박스 컴포넌트
  const CheckboxItem: React.FC<{
    id: string;
    checked: boolean;
    onPress: () => void;
    label: string;
  }> = ({ checked, onPress, label }) => (
    <TouchableOpacity 
      style={styles.checkboxContainer}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Check size={12} color="white" />}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  );

  // 서비스 선택 체크박스
  const ServiceCheckboxItem: React.FC<{
    service: string;
    label: string;
  }> = ({ service, label }) => (
    <CheckboxItem
      id={service}
      checked={formData.selectedService === service}
      onPress={() => handleInputChange("selectedService", service as FormData['selectedService'])}
      label={label}
    />
  );

  // 🔧 다음 우편번호 검색 모드인 경우
  if (isPostcodeMode) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.postcodeHeader}>
          <Text style={styles.postcodeTitle}>주소 검색</Text>
          <TouchableOpacity onPress={closeDaumPostcode} style={styles.closeButton}>
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
        <DaumPostcode 
          onSubmit={handleDaumPostcode}
          onClose={closeDaumPostcode}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>회원가입</Text>
            <Text style={styles.headerSubtitle}>
              서비스 이용을 위해 정보를 입력해주세요
            </Text>
          </View>

          <View style={styles.formContainer}>
            {/* 이름 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                이름 <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="이름을 입력하세요"
                value={formData.name}
                onChangeText={(text) => handleInputChange("name", text)}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* 생년월일 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                생년월일 <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Calendar size={16} color="#6B7280" style={styles.dateIcon} />
                <Text style={[styles.dateText, formData.birthDate && styles.dateTextSelected]}>
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
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                전화번호 <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="01000000000 숫자만 작성"
                value={formData.phone}
                onChangeText={(text) => {
                  const numericText = text.replace(/[^0-9]/g, '');
                  handleInputChange("phone", numericText);
                }}
                keyboardType="number-pad"
                placeholderTextColor="#9CA3AF"
                maxLength={11}
              />
            </View>

            {/* 비밀번호 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                비밀번호 <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="비밀번호를 입력하세요"
                value={formData.password}
                onChangeText={(text) => handleInputChange("password", text)}
                secureTextEntry
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* 비밀번호 확인 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                비밀번호 확인 <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="비밀번호를 다시 입력하세요"
                value={formData.confirmPassword}
                onChangeText={(text) => handleInputChange("confirmPassword", text)}
                secureTextEntry
                placeholderTextColor="#9CA3AF"
              />
              {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <Text style={styles.errorText}>비밀번호가 일치하지 않습니다</Text>
              )}
              {formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && (
                <Text style={styles.successText}>비밀번호가 일치합니다</Text>
              )}
            </View>

            {/* 주소 - 다음 우편번호 API 사용 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                주소 <Text style={styles.required}>*</Text>
              </Text>
              
              {/* 우편번호 */}
              <View style={styles.zipCodeRow}>
                <TextInput
                  style={[styles.textInput, styles.zipCodeInput]}
                  placeholder="우편번호"
                  value={formData.zipCode}
                  editable={false}
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity
                  style={styles.searchButton}
                  onPress={searchZipCode}
                  activeOpacity={0.7}
                >
                  <Search size={16} color="white" style={styles.searchIcon} />
                  <Text style={styles.searchButtonText}>검색</Text>
                </TouchableOpacity>
              </View>

              {/* 기본주소 */}
              <TextInput
                style={[styles.textInput, { marginBottom: 12 }]}
                placeholder="기본주소"
                value={formData.address}
                editable={false}
                placeholderTextColor="#9CA3AF"
              />

              {/* 상세주소 */}
              <TextInput
                style={styles.textInput}
                placeholder="상세주소를 입력하세요"
                value={formData.detailAddress}
                onChangeText={(text) => handleInputChange("detailAddress", text)}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* 이용자 구분 */}
            <View style={styles.inputGroup}>
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
                <View style={styles.elderlySection}>
                  <Text style={styles.label}>
                    요양원/보호센터 <Text style={styles.required}>*</Text>
                  </Text>

                  {formData.careCenter ? (
                    <View style={styles.careCenterCard}>
                      <View style={styles.careCenterHeader}>
                        <Text style={styles.careCenterName}>
                          {formData.careCenter.name}
                        </Text>
                        <View style={styles.careCenterTypeTag}>
                          <Text style={styles.careCenterTypeText}>
                            {formData.careCenter.type}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.careCenterAddressRow}>
                        <MapPin size={12} color="#6B7280" style={styles.mapIcon} />
                        <Text style={styles.careCenterAddress}>
                          {formData.careCenter.address}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={removeCareCenter}
                        activeOpacity={0.7}
                      >
                        <X size={16} color="#6B7280" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.careCenterSearchButton}
                      onPress={() => setIsCareCenterModalOpen(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.careCenterSearchText}>요양원/보호센터를 검색하세요</Text>
                      <Search size={16} color="#6B7280" />
                    </TouchableOpacity>
                  )}

                  {formData.isElderly && !formData.careCenter && (
                    <Text style={styles.warningText}>
                      노인 이용자는 요양원/보호센터 선택이 필요합니다
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* 서비스 선택 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                이용 서비스 선택 <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.serviceOptions}>
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
              style={[styles.submitButton, isFormValid() && styles.submitButtonActive]}
              onPress={handleSubmit}
              disabled={!isFormValid()}
              activeOpacity={0.8}
            >
              <Text style={[styles.submitButtonText, isFormValid() && styles.submitButtonTextActive]}>
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
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>
                요양원/보호센터 검색
              </Text>
              
              <TextInput
                style={styles.modalSearchInput}
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
                    style={styles.careCenterItem}
                    onPress={() => selectCareCenter(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.careCenterItemHeader}>
                      <Text style={styles.careCenterItemName}>
                        {item.name}
                      </Text>
                      <View style={styles.careCenterItemTypeTag}>
                        <Text style={styles.careCenterItemTypeText}>{item.type}</Text>
                      </View>
                    </View>
                    <View style={styles.careCenterItemAddressRow}>
                      <MapPin size={12} color="#6B7280" style={styles.mapIcon} />
                      <Text style={styles.careCenterItemAddress}>
                        {item.address}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>
                    검색 결과가 없습니다
                  </Text>
                }
              />

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setIsCareCenterModalOpen(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCloseButtonText}>닫기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// 🎨 스타일 정의
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  dateButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    marginRight: 8,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: '#6B7280',
  },
  dateTextSelected: {
    color: '#111827',
  },
  zipCodeRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  zipCodeInput: {
    flex: 1,
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: '#2563EB',
    borderWidth: 1,
    borderColor: '#2563EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    marginRight: 4,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
  },
  successText: {
    fontSize: 12,
    color: '#059669',
    marginTop: 4,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  elderlySection: {
    marginLeft: 32,
    marginTop: 16,
    paddingLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: '#DBEAFE',
    backgroundColor: '#EFF6FF',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    padding: 16,
  },
  careCenterCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    position: 'relative',
  },
  careCenterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  careCenterName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
  },
  careCenterTypeTag: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  careCenterTypeText: {
    fontSize: 12,
    color: '#1E40AF',
  },
  careCenterAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  mapIcon: {
    marginRight: 4,
  },
  careCenterAddress: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  careCenterSearchButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  careCenterSearchText: {
    fontSize: 14,
    color: '#6B7280',
  },
  warningText: {
    fontSize: 12,
    color: '#D97706',
    marginTop: 4,
  },
  serviceOptions: {
    gap: 8,
  },
  submitButton: {
    backgroundColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  submitButtonActive: {
    backgroundColor: '#2563EB',
  },
  submitButtonText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '500',
    color: '#6B7280',
  },
  submitButtonTextActive: {
    color: '#FFFFFF',
  },
  // 다음 우편번호 검색 관련 스타일
  postcodeHeader: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  postcodeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeButton: {
    backgroundColor: '#1D4ED8',
    borderRadius: 20,
    padding: 8,
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 모달 관련 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    padding: 24,
    maxHeight: 400,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  modalSearchInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  careCenterItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  careCenterItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  careCenterItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
  },
  careCenterItemTypeTag: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  careCenterItemTypeText: {
    fontSize: 12,
    color: '#1E40AF',
  },
  careCenterItemAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  careCenterItemAddress: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    paddingVertical: 16,
  },
  modalCloseButton: {
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 16,
  },
  modalCloseButtonText: {
    textAlign: 'center',
    color: '#374151',
    fontWeight: '500',
  },
});

export default SignupPage;