import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Calendar, CheckSquare, Clock, MapPin, Plus } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import BottomNavigation from '../components/BottomNavigation';
import TodoModal from '../components/TodoModal';

// --- 타입 정의 ---
type RootStackParamList = {
  MapPage: undefined;
  LinkPage: undefined;
  LogPage: undefined;
  CalendarPage: undefined;
};
type NavigationProp = StackNavigationProp<RootStackParamList, 'CalendarPage'>;

interface Schedule {
  id: string;
  name: string;
  address: string;
  startTime: string;
  endTime: string;
  date: string;
  type: 'permanent' | 'temporary';
}

interface Todo {
  id: string;
  title: string;
  time: Date;
  description?: string;
  date: string;
  type: 'todo';
}

type CalendarItem = (Schedule & { itemType: 'schedule' }) | (Todo & { itemType: 'todo' });

// --- 상수 ---
// 로컬 시간 기준으로 오늘 날짜 생성
const today = new Date();
const todayDateStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

console.log('오늘 날짜:', todayDateStr, '요일:', ['일','월','화','수','목','금','토'][today.getDay()]);

const MOCK_SCHEDULES: Schedule[] = [
  {
    id: '1',
    name: 'OO병원 정기 검진',
    address: '서울특별시 강남구 테헤란로 123',
    startTime: '14:00',
    endTime: '16:00',
    date: '2025-10-27',
    type: 'temporary',
  },
  {
    id: '2',
    name: '우리집',
    address: '서울특별시 서초구 서초대로 456',
    startTime: '00:00',
    endTime: '23:59',
    date: todayDateStr,
    type: 'permanent',
  },
  {
    id: '3',
    name: '경로당',
    address: '서울특별시 송파구 올림픽로 789',
    startTime: '09:00',
    endTime: '18:00',
    date: '2025-10-20',
    type: 'temporary',
  },
];

// --- 캘린더 날짜 유틸리티 ---
const getDaysInMonth = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // 해당 월의 총 일수
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  
  // 1일의 요일을 직접 계산 (더 정확함)
  const firstDayOfMonth = new Date(year, month, 1);
  let startingDayOfWeek = firstDayOfMonth.getDay();
  
  // 디버깅: 실제 요일 확인
  console.log(`${year}년 ${month+1}월 1일: getDay()=${startingDayOfWeek} (${['일','월','화','수','목','금','토'][startingDayOfWeek]}요일)`);
  console.log(`firstDayOfMonth:`, firstDayOfMonth.toString());
  
  const days: (number | null)[] = [];
  
  // 1일 이전 빈 칸 채우기
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  
  // 실제 날짜 채우기
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }
  
  // 마지막 주를 7의 배수로 맞추기
  while (days.length % 7 !== 0) {
    days.push(null);
  }
  
  console.log(`총 ${days.length}칸 (빈칸 ${startingDayOfWeek}개 + 날짜 ${daysInMonth}개)`);
  
  return days;
};

// --- 분리된 일정 카드 컴포넌트 ---
const ScheduleCard: React.FC<{ schedule: Schedule }> = React.memo(({ schedule }) => (
  <View className="bg-white rounded-xl shadow p-4 mb-3 border border-gray-100">
    <View className="flex-row items-start">
      <View className="h-11 w-11 bg-green-50 rounded-lg items-center justify-center mr-3">
        <MapPin size={20} color="#25eb5aff" />
      </View>
      <View className="flex-1">
        <Text className="text-base font-bold text-gray-900 mb-1">{schedule.name}</Text>
        <View className="flex-row items-center mb-2">
          <Clock size={13} color="#6b7280" />
          <Text className="text-sm text-gray-600 ml-1.5">
            {schedule.startTime} - {schedule.endTime}
          </Text>
        </View>
        <Text className="text-sm text-gray-500 mb-3">{schedule.address}</Text>
        <View className={`self-start px-2.5 py-1 rounded-full 
          ${schedule.type === 'permanent' ? 'bg-green-100' : 'bg-yellow-100'}`}>
          <Text className={`text-xs font-semibold 
            ${schedule.type === 'permanent' ? 'text-green-700' : 'text-yellow-700'}`}>
            {schedule.type === 'permanent' ? '영구 영역' : '일시적 일정'}
          </Text>
        </View>
      </View>
    </View>
  </View>
));

// --- 분리된 할 일 카드 컴포넌트 ---
const TodoCard: React.FC<{ todo: Todo }> = React.memo(({ todo }) => (
  <View className="bg-white rounded-xl shadow p-4 mb-3 border border-gray-100">
    <View className="flex-row items-start">
      <View className="h-11 w-11 bg-purple-50 rounded-lg items-center justify-center mr-3">
        <CheckSquare size={20} color="#ffffffff" />
      </View>
      <View className="flex-1">
        <Text className="text-base font-bold text-gray-900 mb-1">{todo.title}</Text>
        <View className="flex-row items-center mb-2">
          <Clock size={13} color="#6b7280" />
          <Text className="text-sm text-gray-600 ml-1.5">
            {todo.time.getHours().toString().padStart(2, '0')}:{todo.time.getMinutes().toString().padStart(2, '0')}
          </Text>
        </View>
        {todo.description && (
          <Text className="text-sm text-gray-500 mb-3">{todo.description}</Text>
        )}
        <View className="self-start px-2.5 py-1 rounded-full bg-purple-100">
          <Text className="text-xs font-semibold text-purple-700">
            할 일
          </Text>
        </View>
      </View>
    </View>
  </View>
));

// --- 메인 캘린더 페이지 컴포넌트 ---
const CalendarPage: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(todayDateStr);
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [isTodoModalVisible, setIsTodoModalVisible] = useState(false);

  useEffect(() => {
    setSchedules(MOCK_SCHEDULES);
  }, []);

  const itemsByDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    [...schedules, ...todos].forEach(item => {
      const date = item.date;
      const items = map.get(date) || [];
      const typedItem = item.type === 'todo' 
        ? { ...item, itemType: 'todo' as const }
        : { ...item, itemType: 'schedule' as const };
      map.set(date, [...items, typedItem]);
    });
    return map;
  }, [schedules, todos]);

  const sortedSelectedDateItems = useMemo(() => {
    const items = itemsByDate.get(selectedDate) || [];
    return [...items].sort((a, b) => {
      const timeA = a.itemType === 'schedule' ? a.startTime : a.time.getHours().toString().padStart(2, '0') + ':' + a.time.getMinutes().toString().padStart(2, '0');
      const timeB = b.itemType === 'schedule' ? b.startTime : b.time.getHours().toString().padStart(2, '0') + ':' + b.time.getMinutes().toString().padStart(2, '0');
      return timeA.localeCompare(timeB);
    });
  }, [itemsByDate, selectedDate]);

  const hasItemsOnDate = useMemo(() => {
    const datesWithItems = new Set(itemsByDate.keys());
    return (day: number): boolean => {
      const dateStr = `${currentMonth.getFullYear()}-${(currentMonth.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      return datesWithItems.has(dateStr);
    };
  }, [itemsByDate, currentMonth]);

  const daysInMonth = getDaysInMonth(currentMonth);

  const handleTodoSave = (data: { title: string; time: Date; description?: string }) => {
    const newTodo: Todo = {
      ...data,
      id: Date.now().toString(),
      date: selectedDate,
      type: 'todo',
    };
    setTodos(prev => [...prev, newTodo]);
  };

  const renderItem = ({ item }: { item: CalendarItem }) => {
    if (item.itemType === 'schedule') {
      return <ScheduleCard key={item.id} schedule={item} />;
    } else {
      return <TodoCard key={item.id} todo={item} />;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />
      
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        
        {/* 헤더 */}
        <View className="px-5 pt-5 pb-4">
          <Text className="text-3xl font-bold text-gray-900">캘린더</Text>
        </View>

        {/* 캘린더 카드 */}
        <View className="bg-white rounded-xl shadow-md p-4 mx-4 mb-6">
          {/* 월 네비게이션 */}
          <View className="flex-row items-center justify-between mb-4 px-2">
            <TouchableOpacity
              onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-2 rounded-full active:bg-gray-100">
              <Text className="text-xl font-bold text-gray-500">‹</Text>
            </TouchableOpacity>
            
            <Text className="text-lg font-semibold text-gray-900">
              {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
            </Text>
            
            <TouchableOpacity
              onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-2 rounded-full active:bg-gray-100">
              <Text className="text-xl font-bold text-gray-500">›</Text>
            </TouchableOpacity>
          </View>

          {/* 요일 헤더 */}
          <View className="flex-row mb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
              <View key={day} className="flex-1 items-center py-2">
                <Text className="text-sm font-medium text-gray-400">{day}</Text>
              </View>
            ))}
          </View>

          {/* 날짜 그리드 - 고정된 레이아웃 */}
          <View>
            {/* 주 단위로 렌더링 */}
            {Array.from({ length: Math.ceil(daysInMonth.length / 7) }, (_, weekIndex) => {
              const weekStart = weekIndex * 7;
              const weekDays = daysInMonth.slice(weekStart, weekStart + 7);
              
              return (
                <View key={weekIndex} style={{ flexDirection: 'row' }}>
                  {weekDays.map((day, dayIndex) => {
                    const index = weekStart + dayIndex;
                    const dayOfWeekIndex = index % 7;
                    const dayOfWeekName = ['일', '월', '화', '수', '목', '금', '토'][dayOfWeekIndex];
                    
                    const dateStr = day ? `${currentMonth.getFullYear()}-${(currentMonth.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}` : '';
                    const isSelected = dateStr === selectedDate;
                    const isToday = dateStr === todayDateStr;
                    const hasItems = day ? hasItemsOnDate(day) : false;

                    if (day === 1) {
                      console.log(`1일 위치: weekIndex=${weekIndex}, dayIndex=${dayIndex}, 요일=${dayOfWeekName}`);
                    }

                    return (
                      <View
                        key={index}
                        style={{
                          flex: 1,
                          aspectRatio: 1,
                          padding: 4,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {day ? (
                          <TouchableOpacity
                            onPress={() => setSelectedDate(dateStr)}
                            activeOpacity={0.8}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            style={{
                              width: '92%',
                              height: '92%',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 999,
                              backgroundColor: isSelected ? '#25eb67ff' : isToday ? '#DBEAFE' : 'transparent',
                            }}
                          >
                            <Text style={{
                              fontSize: 13,
                              color: isSelected ? '#ffffff' : isToday ? '#2563eb' : hasItems ? '#374151' : '#9CA3AF',
                              fontWeight: isSelected || isToday || hasItems ? '600' as any : '400' as any,
                            }}>
                              {day}
                            </Text>
                            {!isSelected && !isToday && hasItems && (
                              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#2563eb', marginTop: 4 }} />
                            )}
                          </TouchableOpacity>
                        ) : (
                          <View style={{ width: '92%', height: '92%' }} />
                        )}
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          <View className="flex-row items-center justify-between mb-3 px-1">
            <Text className="text-xl font-bold text-gray-900">
              {formatDate(selectedDate)}
            </Text>
            <TouchableOpacity
              className="flex-row items-center bg-green-500 px-3.5 py-2 rounded-lg shadow-sm"
              onPress={() => setIsTodoModalVisible(true)}
            >
              <Plus size={18} color="white" />
              <Text className="text-white text-sm font-semibold ml-1">할 일 추가</Text>
            </TouchableOpacity>
          </View>
          
          {sortedSelectedDateItems.length > 0 ? (
            sortedSelectedDateItems.map(item => renderItem({ item }))
          ) : (
            <View className="items-center justify-center pt-16">
              <Calendar size={48} color="#cbd5e1" />
              <Text className="text-gray-500 text-lg mt-4">등록된 일정이 없습니다</Text>
              <Text className="text-gray-400 text-sm mt-1">버튼을 눌러 새 할 일을 추가해 보세요</Text>
            </View>
          )}
        </View>

      </ScrollView>

      <BottomNavigation currentScreen="CalendarPage" />
      
      <TodoModal
        visible={isTodoModalVisible}
        onClose={() => setIsTodoModalVisible(false)}
        onSave={handleTodoSave}
        selectedDate={selectedDate}
      />
    </SafeAreaView>
  );
};

// --- 헬퍼 함수 ---
const formatDate = (dateStr: string) => {
  if (!dateStr) return "날짜 선택";
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
  return `${month}월 ${day}일 (${dayOfWeek})`;
};

export default CalendarPage;