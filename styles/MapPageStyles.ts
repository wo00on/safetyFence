// constants/customMapStyle.ts
export const customMapStyle = [
  // 1. 기본 랜드 색상: 연한 회색 (배경)
  {
    featureType: 'all',
    elementType: 'geometry',
    stylers: [{ color: '#f5f5f5' }],
  },
  // 2. 기본 라벨 색상: 어두운 회색
  {
    featureType: 'all',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#ffffffff' }],
  },
  {
    featureType: 'all',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#f5f5f5' }], // 랜드 색상과 동일하게
  },
  {
    featureType: 'administrative.land_parcel',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#bdbdbd' }],
  },
  // 3. POI (관심 장소) 색상
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#eeeeee' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#ffffffff' }],
  },
  // 4. 공원(Park) 색상
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#dceddc' }], // 연한 녹색 배경
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#2e7d32' }], // 진한 녹색 텍스트
  },
  // 5. 도로 색상
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }], // 모든 도로 기본 흰색
  },
  {
    featureType: 'road.arterial',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }], // 고속도로도 흰색
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#616161' }],
  },
  {
    featureType: 'road.local',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#ffffffff' }],
  },
  // 6. 대중교통 라인
  {
    featureType: 'transit.line',
    elementType: 'geometry',
    stylers: [{ color: '#e5e5e5' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'geometry',
    stylers: [{ color: '#eeeeee' }],
  },
  // 7. 물(Water) 색상
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#c4f6e9ff' }], // 연한 민트색 배경
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#2e7d32' }], // 진한 녹색 텍스트
  },
];