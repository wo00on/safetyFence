import Global from '@/constants/Global';
import { authService } from '../services/authService';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
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

// 인터페이스 정의
interface FormData {
  name: string;
  password: string;
  confirmPassword: string;
  birth: Date | null;
  number: string;
  homeAddress: string;
  homeStreetAddress: string;
  homeStreetAddressDetail: string;
  centerAddress: string;
  centerStreetAddress: string;
  isElderly: boolean;
}

type RootStackParamList = {
  Signup: undefined;
  SelectRole: undefined;
};

const SignupPage: React.FC = () => {
  
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    password: '',
    confirmPassword: '',
    birth: null,
    number: '',
    homeAddress: '',
    homeStreetAddress: '',
    homeStreetAddressDetail: '',
    centerAddress: '',
    centerStreetAddress: '',
    isElderly: false
  });

  const [showDatePicker, setShowDatePicker] = useState<boolean>(false); // 생년월일 검색 관련
  const [isPostcodeMode, setIsPostcodeMode] = useState<boolean>(false); // 집 주소 검색 모달 상태
  const [isCenterPostcodeMode, setIsCenterPostcodeMode] = useState<boolean>(false); // 센터 주소 검색 모달 상태

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

  // 센터 주소 검색 시작
  const searchCenterZipCode = (): void => {
    setIsCenterPostcodeMode(true);
  };

  // 센터 주소 선택 처리
  const handleCenterDaumPostcode = (data: DaumPostcodeData): void => {
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

    // 센터 주소 업데이터
    setFormData(prev => ({
      ...prev,
      centerStreetAddress: fullAddress,
      centerAddress: String(data.zonecode),
    }));

    // 모달 닫기
    setIsCenterPostcodeMode(false);
  };

  // 센터 주소 검색 모달 닫기
  const closeCenterDaumPostcode = (): void => {
    setIsCenterPostcodeMode(false);
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
      centerAddress: formData.centerAddress,
      homeStreetAddress: formData.homeStreetAddress,
      homeStreetAddressDetail: formData.homeStreetAddressDetail,
      centerStreetAddress: formData.centerStreetAddress
    };
    return signupData;
  };

  const handleSubmit = async (): Promise<void> => {
    const signupData = prepareSignupData();

    // 유효성 검증
    if (!signupData.name || !signupData.password || !signupData.number || !signupData.birth) {
      Alert.alert('입력 오류', '필수 항목을 모두 입력해주세요.');
      return;
    }

    console.log('회원가입 전송 데이터:', signupData);

    try {
      // API 호출: POST /user/signup
      const response = await authService.signup({
        number: signupData.number,
        name: signupData.name,
        password: signupData.password,
        birth: signupData.birth,
        homeAddress: signupData.homeAddress,
        centerAddress: signupData.centerAddress,
        homeStreetAddress: signupData.homeStreetAddress,
        homeStreetAddressDetail: signupData.homeStreetAddressDetail,
        centerStreetAddress: signupData.centerStreetAddress,
      });

      console.log('회원가입 성공:', response);

      // Global 상태 업데이트
      Global.NUMBER = response.number;

      // 성공 알림 및 로그인 페이지로 이동
      Alert.alert(
        "🎉 회원가입 완료",
        `${response.name}님, 회원가입이 성공적으로 완료되었습니다!\n로그인 페이지로 이동하여 로그인해주세요.`,
        [
          {
            text: "확인",
            onPress: () => {
              console.log('로그인 페이지로 이동');
              try {
                router.replace('/');
              } catch (navError) {
                console.error('네비게이션 오류:', navError);
                router.push('/');
              }
            }
          }
        ]
      );
    } catch (error: any) {
      const message = error?.response?.data?.message || "회원가입에 실패했습니다. 다시 시도해주세요.";
      Alert.alert("회원가입 실패", message);
      console.error('회원가입 실패:', error);
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
                    setFormData(prev => ({
                      ...prev,
                      centerAddress: '',
                      centerStreetAddress: ''
                    }));
                  }
                }}
                label="노인 이용자입니다"
              />

              {/* 센터 주소 */}
              {formData.isElderly && (
                <View style={styles.elderlySection}>
                  <Text style={styles.label}>
                    센터 주소 <Text style={styles.required}>*</Text>
                  </Text>

                  <View style={styles.zipCodeRow}>
                    <TextInput
                      style={[styles.textInput, styles.zipCodeInput]}
                      placeholder="우편번호"
                      value={formData.centerAddress}
                      editable={false}
                      placeholderTextColor="#9CA3AF"
                    />
                    <TouchableOpacity
                      style={styles.searchButton}
                      onPress={searchCenterZipCode}
                      activeOpacity={0.7}
                    >
                      <Search size={16} color="white" style={styles.searchIcon} />
                      <Text style={styles.searchButtonText}>검색</Text>
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={[styles.textInput, { marginBottom: 0 }]}
                    placeholder="기본주소"
                    value={formData.centerStreetAddress}
                    editable={false}
                    placeholderTextColor="#9CA3AF"
                  />

                  {formData.isElderly && !formData.centerAddress && (
                    <Text style={styles.warningText}>
                      노인 이용자는 센터 주소 입력이 필요합니다
                    </Text>
                  )}
                </View>
              )}
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

        {/* 센터 주소 검색 모달 */}
        {isCenterPostcodeMode && (
          <Modal visible={true} animationType="slide">
            <SafeAreaView style={styles.container}>
              <View style={styles.postcodeHeader}>
                <Text style={styles.postcodeTitle}>센터 주소 검색</Text>
                <TouchableOpacity onPress={closeCenterDaumPostcode} style={styles.closeButton}>
                  <X size={24} color="#ffffff" />
                </TouchableOpacity>
              </View>
              <DaumPostcode
                onSubmit={handleCenterDaumPostcode}
                onClose={closeCenterDaumPostcode}
              />
            </SafeAreaView>
          </Modal>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignupPage;