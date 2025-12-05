import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Plus, Trash2 } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import BottomNavigation from '../components/BottomNavigation';
import { GalleryPhoto, galleryService } from '../services/galleryService';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const ITEM_SIZE = width / COLUMN_COUNT;

const GalleryPage: React.FC = () => {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadPhotos = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await galleryService.getPhotos();
      setPhotos(data);
    } catch (error) {
      console.error('사진 불러오기 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPhotos();
    }, [loadPhotos])
  );

  const handleAddPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진을 선택하려면 갤러리 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      try {
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

        await galleryService.addPhoto({
          uri: result.assets[0].uri,
          date: dateStr,
          title: '갤러리 추가',
        });
        loadPhotos();
        Alert.alert('성공', '사진이 추가되었습니다.');
      } catch (error) {
        Alert.alert('오류', '사진 저장 중 문제가 발생했습니다.');
      }
    }
  };

  const handleDeletePhoto = (id: string) => {
    Alert.alert('사진 삭제', '정말로 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await galleryService.deletePhoto(id);
            setPhotos(prev => prev.filter(p => p.id !== id));
          } catch (error) {
            Alert.alert('오류', '삭제 실패');
          }
        }
      }
    ]);
  };

  const renderItem = ({ item }: { item: GalleryPhoto }) => (
    <View style={{ width: ITEM_SIZE, height: ITEM_SIZE, padding: 1 }}>
      <Image source={{ uri: item.uri }} className="w-full h-full" resizeMode="cover" />
      <TouchableOpacity
        className="absolute top-1 right-1 bg-black/50 p-1 rounded-full"
        onPress={() => handleDeletePhoto(item.id)}
      >
        <Trash2 size={12} color="white" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white pt-safe">
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">갤러리</Text>
        <TouchableOpacity
          className="bg-green-500 p-2 rounded-full"
          onPress={handleAddPhoto}
        >
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={photos}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={COLUMN_COUNT}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-gray-400">저장된 사진이 없습니다.</Text>
          </View>
        }
      />

      <BottomNavigation currentScreen="GalleryPage" />
    </SafeAreaView>
  );
};

export default GalleryPage;
