import DateTimePicker from '@react-native-community/datetimepicker';
import { Clock } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface TodoData {
  title: string;
  time: Date;
  description?: string;
}

interface TodoModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: TodoData) => void;
  selectedDate: string;
}

const TodoModal: React.FC<TodoModalProps> = ({
  visible,
  onClose,
  onSave,
  selectedDate,
}) => {
  const [formData, setFormData] = useState<TodoData>({
    title: '',
    time: new Date(),
    description: '',
  });

  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleSave = () => {
    if (!formData.title.trim()) {
      Alert.alert('입력 오류', '할 일 제목을 입력해주세요.');
      return;
    }

    onSave(formData);
    onClose();
    
    // 폼 초기화
    setFormData({
      title: '',
      time: new Date(),
      description: '',
    });
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate) {
      setFormData(prev => ({ ...prev, time: selectedDate }));
    }
  };

  const formatTime = (date: Date) => {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-black/50 justify-center items-center">
        <View className="bg-white rounded-2xl w-11/12 max-w-md">
          {/* 헤더 */}
          <View className="flex-row items-center justify-between p-6 border-b border-gray-200">
            <Text className="text-xl font-bold text-gray-900">할 일 추가</Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Text className="text-2xl text-gray-400">‹</Text>
            </TouchableOpacity>
          </View>

          <View className="p-6">
            {/* 선택된 날짜 표시 */}
            <View className="mb-4 p-3 bg-green-50 rounded-lg">
              <Text className="text-sm text-green-600 font-medium">
                {formatDate(selectedDate)}에 할 일 추가
              </Text>
            </View>

            {/* 할 일 제목 */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">할 일 제목</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                placeholder="예) 혈압약 복용, 운동하기"
                value={formData.title}
                onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* 시간 설정 */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">시간</Text>
              <TouchableOpacity
                className="flex-row items-center border border-gray-300 rounded-lg px-4 py-3"
                onPress={() => setShowTimePicker(true)}
              >
                <Clock size={20} color="#6b7280" />
                <Text className="ml-3 text-gray-900">{formatTime(formData.time)}</Text>
              </TouchableOpacity>
            </View>

            {/* 설명 (선택사항) */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">설명 (선택사항)</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                placeholder="추가 설명을 입력하세요"
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* 추가하기 버튼 */}
            <TouchableOpacity
              className="bg-green-500 py-4 rounded-lg"
              onPress={handleSave}
            >
              <Text className="text-white text-center font-medium text-lg">추가하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* 시간 선택기 */}
      {showTimePicker && (
        <DateTimePicker
          value={formData.time}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </Modal>
  );
};

export default TodoModal;
