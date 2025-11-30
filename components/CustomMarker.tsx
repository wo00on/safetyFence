import { MapPin } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Callout, Marker } from 'react-native-maps';

interface CustomMarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  name: string;
  status: 'tracking' | 'idle' | string;
}

const CustomMarker: React.FC<CustomMarkerProps> = ({ coordinate, name, status }) => {
  const statusDescription = status === 'tracking' ? '실시간 추적 중' : '현재 위치';
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1300,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1300,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const animatedStyle = {
    transform: [
      {
        translateY: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -2], // 8픽셀만큼 위로 부드럽게 움직입니다.
        }),
      },
    ],
  };

  return (
    <Marker coordinate={coordinate} anchor={{ x: 0.5, y: 1 }} tracksViewChanges={true}>
      {/* collapsable={false} to prevent render bugs on some devices */}
      <View collapsable={false}>
        <Animated.View style={animatedStyle}>
          <MapPin size={37} color="#16a34a" fill="#6ee7b7" />
        </Animated.View>
      </View>

      <Callout tooltip>
        <View style={styles.calloutContainer}>
          <Text style={styles.calloutTitle}>{name}</Text>
          <Text style={styles.calloutDescription}>{statusDescription}</Text>
        </View>
      </Callout>
    </Marker>
  );
};

const styles = StyleSheet.create({
  calloutContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    width: 140,
    borderColor: '#16a34a',
    borderWidth: 1,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 4,
    color: '#333',
  },
  calloutDescription: {
    fontSize: 14,
    textAlign: 'center',
    color: '#555',
  },
});

export default CustomMarker;
