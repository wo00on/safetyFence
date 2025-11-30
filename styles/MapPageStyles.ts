// constants/customMapStyle.ts
export const customMapStyle = [
  // Base land color (light gray for buildings/background)
  {
    featureType: 'all',
    elementType: 'geometry',
    stylers: [{ color: '#f5f5f5' }],
  },
  // Roads - Very light green
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#e6f9e6' }], // A slightly different light green for better contrast
  },
  // Make highways blend with other roads
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#e6f9e6' }],
  },
  // Water - Soft blue
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#d4eefc' }],
  },
  // Parks - A noticeable but soft green
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#dcf0dc' }],
  },
  // POIs - Muted and subtle
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#eeeeee' }],
  },
  // Transit - Subtle
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
  // --- LABELS ---
  // Universal label color - NOW BLACK
  {
    featureType: 'all',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#000000' }], // ALL TEXT BLACK
  },
  // Universal label stroke - makes text more readable
  {
    featureType: 'all',
    elementType: 'labels.text.stroke',
    stylers: [
      { color: '#f5f5f5' }, // Same as background
      { weight: 2 },
    ],
  },
  // Specific label overrides if needed - keep existing overrides but change to black
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#000000' }], // Parks text black
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#000000' }], // Water text black
  },
];