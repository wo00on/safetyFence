import Global from '@/constants/Global';
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
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import styles from '../styles/signupStyles';
import DaumPostcode, { DaumPostcodeData } from '../utils/DaumPostcode';

// 요양원/보호센터 모의 데이터
const CARE_CENTERS = Global.CARE_CENTERS;

// 인터페이스 정의
interface CareCenter {
  id: number;
  name: string;
  centerStreetAddress: string;
  type: string;
  centerAddress: string;
}

interface FormData {
  name: string;
  password: string;
  confirmPassword: string;
  birth: Date | null;
  number: string;
  homeAddress: string;
  serviceCode: "PAYPASS_SERVICE" | "CARE_SERVICE" | "ALL_SERVICE" | "NONE" | "";
  homeStreetAddress: string;
  homeStreetAddressDetail: string;
  careCenter: CareCenter | null;
  isElderly: boolean;
}

type RootStackParamList = {
  Signup: undefined;
  SelectRole: undefined;
};

type SignupScreenNavigationProp = NavigationProp<RootStackParamList, 'Signup'>;

const SignupPage: React.FC = () => {
  
  const navigation = useNavigation<SignupScreenNavigationProp>();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    password: '',
    confirmPassword: '',
    birth: null,
    number: '',
    homeAddress: '',
    serviceCode: '',
    homeStreetAddress: '',
    homeStreetAddressDetail: '',
    careCenter: null,
    isElderly: false
  });

  const [showDatePicker, setShowDatePicker] = useState<boolean>(false); // 생년월일 검색 관련
  const [isPostcodeMode, setIsPostcodeMode] = useState<boolean>(false); // 다음 우편번호 검색 모달 상태
  const [isCareCenterModalOpen, setIsCareCenterModalOpen] = useState<boolean>(false); // 케어센터 데이터 관련
  const [searchTerm, setSearchTerm] = useState<string>(""); // 센터 검색 관련 
  const [filteredCenters, setFilteredCenters] = useState<CareCenter[]>(CARE_CENTERS); // 센터 검색 관련 

  // 검색어에 따라 요양원/보호센터 필터링
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredCenters(CARE_CENTERS);
    } else {
      const filtered = CARE_CENTERS.filter(
        (center) =>

          center.name.includes(searchTerm) || 
          center.centerStreetAddress.includes(searchTerm) || 
          center.type.includes(searchTerm) ||
          center.centerAddress.includes(searchTerm)
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

  // 다음 우편번호 검색 시작
  const searchZipCode = (): void => {
    setIsPostcodeMode(true);
  };

  // 다음 우편번호 API에서 주소 선택 처리
  const handleDaumPostcode = (data: DaumPostcodeData): void => {
    // 주소 조합 로직
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
      homeStreetAddress: fullAddress,
      homeAddress: String(data.zonecode),
    }));
    
    // 모달 닫기
    setIsPostcodeMode(false);
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
      handleInputChange("birth", selectedDate);
    }
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return "생년월일을 선택하세요";
    return `${date.getFullYear()}년 ${(date.getMonth() + 1).toString().padStart(2, '0')}월 ${date.getDate().toString().padStart(2, '0')}일`;
  };

  const prepareSignupData = () => {
    const signupData = {
      name: formData.name,
      password: formData.password,
      birth: formData.birth ? formData.birth.toISOString().slice(0, 10) : null,
      number: formData.number,
      homeAddress: formData.homeAddress,
      centerAddress: formData.careCenter?.centerAddress,
      serviceCode: formData.serviceCode,
      homeStreetAddress: formData.homeStreetAddress,
      homeStreetAddressDetail: formData.homeStreetAddressDetail,
      centerStreetAddress: formData.careCenter?.centerStreetAddress
    };
    return signupData;
  };

  const handleSubmit = async (): Promise<void> => {
  const signupData = prepareSignupData();
    try {
      console.log('유저 가입 전송 데이터: ', signupData)

      const response = await axios.post(`${Global.URL}/login/newUser`, signupData);
      console.log('서버 응답:', response.data);
      Global.NUMBER = signupData.number;

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
    } catch (error: any) {
    const message = error?.response?.data?.message || "회원가입에 실패했습니다. 다시 시도해주세요.";
    Alert.alert("회원 가입 실패", message);
    console.error('로그인 실패 : ', error);
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
      checked={formData.serviceCode === service}
      onPress={() => handleInputChange("serviceCode", service as FormData['serviceCode'])}
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
                <Text style={[styles.dateText, formData.birth && styles.dateTextSelected]}>
                  {formatDate(formData.birth)}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={formData.birth || new Date()}
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
                placeholder="ex) 01012345678"
                value={formData.number}
                onChangeText={(text) => {
                  const numericText = text.replace(/[^0-9]/g, '');
                  handleInputChange("number", numericText);
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
                  value={formData.homeAddress}
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
                value={formData.homeStreetAddress}
                editable={false}
                placeholderTextColor="#9CA3AF"
              />

              {/* 상세주소 */}
              <TextInput
                style={styles.textInput}
                placeholder="상세주소를 입력하세요"
                value={formData.homeStreetAddressDetail}
                onChangeText={(text) => handleInputChange("homeStreetAddressDetail", text)}
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
                          {formData.careCenter.centerStreetAddress}
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
              style={[styles.submitButton, styles.submitButtonActive]}
              onPress={handleSubmit}
              activeOpacity={0.8}
            >
              <Text style={[styles.submitButtonText, styles.submitButtonTextActive]}>
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
                        {item.centerStreetAddress}
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

export default SignupPage;