import React from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import * as Device from 'expo-device';

interface BatteryGuideModalProps {
  visible: boolean;
  onClose: () => void;
}

const BatteryGuideModal: React.FC<BatteryGuideModalProps> = ({ visible, onClose }) => {
  const manufacturer = Device.manufacturer || '알 수 없는 제조사';

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <ScrollView style={styles.scrollView}>
            <Text style={styles.modalTitle}>
              어르신 폰({manufacturer})에서 꼭 이 설정을 해주세요!
            </Text>
            <Text style={styles.modalText}>
              앱이 백그라운드에서 원활하게 작동하려면 다음 설정을 완료해야 합니다.
            </Text>

            <Text style={styles.instructionTitle}>1. 최근 앱 버튼 누르기</Text>
            <Text style={styles.instructionText}>
              화면 하단의 '최근 앱' 버튼 (보통 네모 모양)을 눌러 현재 실행 중인 앱 목록을 엽니다.
            </Text>

            <Text style={styles.instructionTitle}>2. '안전 울타리' 앱 아이콘 길게 누르기</Text>
            <Text style={styles.instructionText}>
              앱 목록에서 '안전 울타리' 앱을 찾아 아이콘을 길게 누릅니다.
            </Text>

            <Text style={styles.instructionTitle}>3. '이 앱 잠금' (자물쇠 모양) 누르기</Text>
            <Text style={styles.instructionText}>
              나타나는 옵션 중에서 '이 앱 잠금' 또는 '잠금' (자물쇠 모양 아이콘)을 선택하여 앱이 강제로 종료되지 않도록 합니다.
            </Text>

            {manufacturer.includes('Samsung') && (
              <>
                <Text style={styles.instructionTitle}>삼성폰 추가 설정 (배터리 최적화 해제)</Text>
                <Text style={styles.instructionText}>
                  설정 &gt; 앱 &gt; 안전 울타리 &gt; 배터리 &gt; 최적화되지 않은 앱 &gt; 모든 앱 &gt; 안전 울타리 선택 해제
                </Text>
              </>
            )}
            {manufacturer.includes('Xiaomi') && (
              <>
                <Text style={styles.instructionTitle}>샤오미폰 추가 설정 (자동 시작 허용)</Text>
                <Text style={styles.instructionText}>
                  설정 &gt; 앱 &gt; 권한 &gt; 자동 시작 &gt; 안전 울타리 활성화
                </Text>
              </>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>확인</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: '80%',
    width: '90%',
  },
  scrollView: {
    width: '100%',
    marginBottom: 15,
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalText: {
    marginBottom: 10,
    textAlign: 'center',
    fontSize: 16,
    color: '#555',
  },
  instructionTitle: {
    marginTop: 15,
    marginBottom: 5,
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  instructionText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#2196F3',
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    width: '80%',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default BatteryGuideModal;
