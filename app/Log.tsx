import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  StyleSheet,
} from 'react-native';
import { MapPin, User, Clock, BarChart } from 'lucide-react-native';

interface Log {
  id: string;
  type: 'location' | 'activity' | 'health';
  title: string;
  time: string;
  location?: string;
  detail?: string;
  read: boolean;
}

// 모의 로그 데이터
const INITIAL_LOGS: Log[] = [
  {
    id: "1",
    type: "location",
    title: "주야간보호센터에 도착했습니다",
    time: "10분 전",
    location: "편안한 주야간보호센터",
    read: false,
  },
  {
    id: "2",
    type: "location",
    title: "집을 나섰습니다",
    time: "1시간 전",
    location: "자택",
    read: true,
  },
  {
    id: "3",
    type: "activity",
    title: "물리치료에 참여했습니다",
    time: "2시간 전",
    detail: "30분간 진행",
    read: true,
  },
  {
    id: "4",
    type: "health",
    title: "약 복용 시간입니다",
    time: "3시간 전",
    detail: "오전 약 복용",
    read: true,
  },
  {
    id: "5",
    type: "location",
    title: "병원에 방문했습니다",
    time: "어제",
    location: "서울대학병원",
    read: true,
  },
];

type TabType = 'all' | 'location' | 'activity';

interface LogPageProps {
  navigation?: any; // React Navigation의 navigation prop
}

const LogPage: React.FC<LogPageProps> = ({ navigation }) => {
  const [logs, setLogs] = useState<Log[]>(INITIAL_LOGS);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [userRole, setUserRole] = useState<"user" | "caregiver" | null>(null);

  const markAsRead = (logId: string) => {
    setLogs(logs.map((log) => (log.id === logId ? { ...log, read: true } : log)));
  };

  const handleLogClick = (log: Log) => {
    markAsRead(log.id);
    
    // 위치 로그인 경우 지도로 이동
    if (log.type === "location" && navigation) {
      navigation.navigate('main');
    }
  };

  const handleNavigation = (screen: string) => {
    if (navigation) {
      navigation.navigate(screen);
    }
  };

  const unreadCount = logs.filter((log) => !log.read).length;

  const getFilteredLogs = () => {
    switch (activeTab) {
      case 'location':
        return logs.filter((log) => log.type === 'location');
      case 'activity':
        return logs.filter((log) => log.type === 'activity' || log.type === 'health');
      default:
        return logs;
    }
  };

  const getIconComponent = (type: string) => {
    switch (type) {
      case 'location':
        return <MapPin size={20} color="#2563eb" />;
      case 'activity':
        return <BarChart size={20} color="#16a34a" />;
      case 'health':
        return <User size={20} color="#9333ea" />;
      default:
        return <User size={20} color="#6b7280" />;
    }
  };

  const getIconBackgroundColor = (type: string) => {
    switch (type) {
      case 'location':
        return styles.iconBgBlue;
      case 'activity':
        return styles.iconBgGreen;
      case 'health':
        return styles.iconBgPurple;
      default:
        return styles.iconBgGray;
    }
  };

  const LogCard: React.FC<{ log: Log }> = ({ log }) => (
    <TouchableOpacity
      style={[
        styles.logCard,
        !log.read && styles.logCardUnread
      ]}
      onPress={() => handleLogClick(log)}
      activeOpacity={0.7}
    >
      <View style={styles.logCardContent}>
        <View style={styles.logCardMain}>
          <View style={styles.logCardHeader}>
            <View style={[styles.iconContainer, getIconBackgroundColor(log.type)]}>
              {getIconComponent(log.type)}
            </View>
            <View style={styles.logCardInfo}>
              <Text style={styles.logTitle}>
                {log.title}
              </Text>
              <View style={styles.timeContainer}>
                <Clock size={12} color="#6b7280" />
                <Text style={styles.timeText}>
                  {log.time}
                </Text>
              </View>
            </View>
          </View>
          
          {log.location && (
            <View style={styles.locationContainer}>
              <MapPin size={16} color="#6b7280" />
              <Text style={styles.locationText}>
                {log.location}
              </Text>
            </View>
          )}
          
          {log.detail && (
            <Text style={styles.detailText}>
              {log.detail}
            </Text>
          )}
        </View>
        
        {!log.read && (
          <View style={styles.unreadDot} />
        )}
      </View>
    </TouchableOpacity>
  );

  const StatCard: React.FC<{ 
    value: number; 
    label: string; 
    bgColor: any; 
    textColor: any;
  }> = ({ value, label, bgColor, textColor }) => (
    <View style={[styles.statCard, bgColor]}>
      <Text style={[styles.statValue, textColor]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, textColor]}>
        {label}
      </Text>
    </View>
  );

  const TabButton: React.FC<{ tab: TabType; label: string }> = ({ tab, label }) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === tab ? styles.tabButtonActive : styles.tabButtonInactive
      ]}
      onPress={() => setActiveTab(tab)}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.tabButtonText,
          activeTab === tab ? styles.tabButtonTextActive : styles.tabButtonTextInactive
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const NavButton: React.FC<{ 
    icon: React.ReactNode; 
    label: string; 
    isActive?: boolean;
    onPress: () => void;
  }> = ({ icon, label, isActive = false, onPress }) => (
    <TouchableOpacity
      style={styles.navButton}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon}
      <Text style={[styles.navButtonText, isActive && styles.navButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#f9fafb"
        translucent={Platform.OS === 'android'}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              활동 로그
            </Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount}개 읽지 않음
                </Text>
              </View>
            )}
          </View>

          {/* 요약 통계 */}
          <View style={styles.statsContainer}>
            <StatCard
              value={3}
              label="오늘 이동"
              bgColor={styles.statBgBlue}
              textColor={styles.statTextBlue}
            />
            <StatCard
              value={1}
              label="활동 참여"
              bgColor={styles.statBgGreen}
              textColor={styles.statTextGreen}
            />
            <StatCard
              value={5}
              label="총 기록"
              bgColor={styles.statBgPurple}
              textColor={styles.statTextPurple}
            />
          </View>

          {/* 탭 */}
          <View style={styles.tabContainer}>
            <TabButton tab="all" label="전체" />
            <TabButton tab="location" label="위치" />
            <TabButton tab="activity" label="활동" />
          </View>

          {/* 로그 리스트 */}
          <View style={styles.logsList}>
            {getFilteredLogs().map((log) => (
              <LogCard key={log.id} log={log} />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* 하단 네비게이션 */}
      <View style={styles.bottomNav}>
        <View style={styles.bottomNavContent}>
          <NavButton
            icon={<MapPin size={24} color="#6b7280" />}
            label="지도"
            onPress={() => handleNavigation('main')}
          />
          <NavButton
            icon={<BarChart size={24} color="#2563eb" />}
            label="로그"
            isActive={true}
            onPress={() => {}}
          />
          <NavButton
            icon={<User size={24} color="#6b7280" />}
            label="마이페이지"
            onPress={() => handleNavigation('MyPage')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  content: {
    paddingTop: 16,
    paddingBottom: 96,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  badge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  statBgBlue: { backgroundColor: '#dbeafe' },
  statBgGreen: { backgroundColor: '#dcfce7' },
  statBgPurple: { backgroundColor: '#f3e8ff' },
  statTextBlue: { color: '#1d4ed8' },
  statTextGreen: { color: '#166534' },
  statTextPurple: { color: '#7c3aed' },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  tabButtonActive: {
    backgroundColor: '#3b82f6',
  },
  tabButtonInactive: {
    backgroundColor: '#e5e7eb',
  },
  tabButtonText: {
    textAlign: 'center',
    fontWeight: '500',
  },
  tabButtonTextActive: {
    color: '#ffffff',
  },
  tabButtonTextInactive: {
    color: '#374151',
  },
  logsList: {
    marginBottom: 16,
  },
  logCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  logCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  logCardMain: {
    flex: 1,
  },
  logCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconBgBlue: { backgroundColor: '#dbeafe' },
  iconBgGreen: { backgroundColor: '#dcfce7' },
  iconBgPurple: { backgroundColor: '#f3e8ff' },
  iconBgGray: { backgroundColor: '#f3f4f6' },
  logCardInfo: {
    flex: 1,
  },
  logTitle: {
    fontWeight: '500',
    color: '#111827',
    fontSize: 16,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  timeText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#4b5563',
    marginLeft: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#4b5563',
    marginTop: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bottomNavContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    maxWidth: 512,
    alignSelf: 'center',
    width: '100%',
  },
  navButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  navButtonText: {
    fontSize: 12,
    marginTop: 4,
    color: '#6b7280',
  },
  navButtonTextActive: {
    color: '#2563eb',
  },
});

export default Log