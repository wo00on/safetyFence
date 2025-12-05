import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
interface Location {
  latitude: number;
  longitude: number;
}

interface Geofence {
  id: number;
  latitude: number;
  longitude: number;
  radius?: number;
  name: string;
  type: number; // 0: permanent, 1: temporary
}

interface KakaoMapProps {
  currentLocation: Location | null;
  targetLocation: Location | null;
  geofences: Geofence[];
  userRole: 'user' | 'supporter' | null;
  onGeofenceDelete?: (id: number, name: string) => void;
}

export interface KakaoMapHandle {
  moveToLocation: (lat: number, lng: number) => void;
}

const KAKAO_API_KEY = '3c1e1117852ac5d779b9ece25129a51b'; // JavaScript Key

const HTML_CONTENT = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="referrer" content="no-referrer">
  <meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline';">
  <script>
    window.onerror = function(message, source, lineno, colno, error) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', payload: message + ' at ' + source + ':' + lineno }));
    };
  </script>
  <style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; background-color: #f0fdf4; }
    #map { width: 100%; height: 100%; background-color: #e5e7eb; } 
    .my-marker {
      width: 30px;
      height: 30px;
      background-color: #5af63bff;
      border: 3px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 2px 2px 5px rgba(0,0,0,0.3);
      position: relative;
    }
    .my-marker::after {
      content: '';
      width: 10px;
      height: 10px;
      background-color: white;
      border-radius: 50%;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
    .target-marker {
      width: 24px;
      height: 24px;
      background-color: #ef4444;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 5px rgba(0,0,0,0.3);
    }
    .customoverlay { position:relative;bottom:45px;border-radius:6px;border: 1px solid #ccc;border-bottom:2px solid #ddd;float:left; }
    .customoverlay:nth-of-type(n) { border:0; box-shadow:0px 1px 2px #888; }
    .customoverlay .title { display:block;text-align:center;background:#fff;padding:5px 10px;font-size:12px;font-weight:bold; }
    .customoverlay:after { content:'';position:absolute;margin-left:-12px;left:50%;bottom:-12px;width:22px;height:12px;background:url('https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/vertex_white.png') }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    let map;
    let myLocationMarker = null;
    let targetLocationMarker = null;
    let geofenceCircles = [];
    let geofenceMarkers = [];
    let hasCentered = false;

    function initMap() {
      try {
        const container = document.getElementById('map');
        const options = {
          center: new kakao.maps.LatLng(37.5665, 126.9780),
          level: 3
        };
        map = new kakao.maps.Map(container, options);
        
        kakao.maps.event.addListener(map, 'tilesloaded', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOG', payload: 'Map tiles loaded' }));
        });

        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_LOADED' }));
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOG', payload: 'Map initialized successfully' }));
      } catch (e) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', payload: 'Init Error: ' + e.toString() }));
      }
    }

    function loadKakaoMap() {
      const script = document.createElement('script');
      script.src = 'https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_API_KEY}&libraries=services,clusterer,drawing&autoload=false';
      script.async = true;
      
      script.onload = function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOG', payload: 'Kakao script loaded via dynamic injection' }));
        kakao.maps.load(initMap);
      };
      
      script.onerror = function(e) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', payload: 'Failed to load Kakao Maps SDK: ' + JSON.stringify(e) }));
      };
      
      document.head.appendChild(script);
    }

    // Start loading
    if (document.readyState === 'complete') {
      loadKakaoMap();
    } else {
      window.addEventListener('load', loadKakaoMap);
    }

    function clearGeofences() {
      geofenceCircles.forEach(circle => circle.setMap(null));
      geofenceMarkers.forEach(marker => marker.setMap(null));
      geofenceCircles = [];
      geofenceMarkers = [];
    }

    // 마지막 업데이트 상태를 저장해 동일 데이터로 불필요 재그리기 방지
    let lastPayloadJSON = '';

    function updateData(payload) {
      if (!map) return;
      const payloadJSON = JSON.stringify(payload);
      if (payloadJSON === lastPayloadJSON) return;
      lastPayloadJSON = payloadJSON;

      const { currentLocation, targetLocation, geofences, userRole } = payload;

      // Handle My Location (Blue)
      if (currentLocation) {
        const locPosition = new kakao.maps.LatLng(currentLocation.latitude, currentLocation.longitude);
        
        if (!myLocationMarker) {
          const content = '<div class="my-marker"></div>';
          myLocationMarker = new kakao.maps.CustomOverlay({
            position: locPosition,
            content: content,
            yAnchor: 0.5
          });
          myLocationMarker.setMap(map);
        } else {
          myLocationMarker.setPosition(locPosition);
        }
      }

      // Handle Target Location (Red)
      if (targetLocation) {
        const targetPosition = new kakao.maps.LatLng(targetLocation.latitude, targetLocation.longitude);
        
        if (!targetLocationMarker) {
          const content = '<div class="target-marker"></div>';
          targetLocationMarker = new kakao.maps.CustomOverlay({
            position: targetPosition,
            content: content,
            yAnchor: 0.5
          });
          targetLocationMarker.setMap(map);
        } else {
          targetLocationMarker.setPosition(targetPosition);
        }
      }

      // Handle Geofences
      clearGeofences();
      if (geofences && geofences.length > 0) {
        geofences.forEach(gf => {
          const gfPosition = new kakao.maps.LatLng(gf.latitude, gf.longitude);
          
          // Circle (radius 기본값 100m)
          const circle = new kakao.maps.Circle({
            center: gfPosition,
            radius: gf.radius || 100,
            strokeWeight: 1,
            strokeColor: '#00a0e9',
            strokeOpacity: 0.1,
            strokeStyle: 'solid',
            fillColor: '#00a0e9',
            fillOpacity: 0.2
          });
          circle.setMap(map);
          geofenceCircles.push(circle);

          // Marker (Custom Overlay for click)
          const content = '<div class="customoverlay">' +
            '  <span class="title">' + gf.name + '</span>' +
            '</div>';
            
          const overlay = new kakao.maps.CustomOverlay({
            position: gfPosition,
            content: content,
            yAnchor: 1
          });
          overlay.setMap(map);
          geofenceMarkers.push(overlay);
          
          const marker = new kakao.maps.Marker({
            position: gfPosition,
            opacity: 0 // Invisible marker for click detection
          });
          marker.setMap(map);
          geofenceMarkers.push(marker);

          kakao.maps.event.addListener(marker, 'click', function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'GEOFENCE_CLICK',
              payload: { id: gf.id, name: gf.name }
            }));
          });
        });
      }

      // 초기 센터링: 보호자는 target, 이용자는 current 기준 1회만
      if (!hasCentered) {
        const centerSource = userRole === 'supporter'
          ? targetLocation || currentLocation
          : currentLocation || targetLocation;

        if (centerSource) {
          const centerPos = new kakao.maps.LatLng(centerSource.latitude, centerSource.longitude);
          map.setCenter(centerPos);
          hasCentered = true;
        }
      }
    }

    document.addEventListener('message', function(event) {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'UPDATE_DATA') {
          updateData(data.payload);
        } else if (data.type === 'MOVE_TO') {
          if (map) {
            const moveLatLon = new kakao.maps.LatLng(data.payload.lat, data.payload.lng);
            map.panTo(moveLatLon);
          }
        }
      } catch (e) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', payload: 'Message Error: ' + e.toString() }));
      }
    });
    
    // For iOS
    window.addEventListener('message', function(event) {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'UPDATE_DATA') {
          updateData(data.payload);
        } else if (data.type === 'MOVE_TO') {
          if (map) {
            const moveLatLon = new kakao.maps.LatLng(data.payload.lat, data.payload.lng);
            map.panTo(moveLatLon);
          }
        }
      } catch (e) {
         window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', payload: 'Message Error: ' + e.toString() }));
      }
    });
  </script>
</body>
</html>
`;

const KakaoMap = forwardRef<KakaoMapHandle, KakaoMapProps>(({
  currentLocation,
  targetLocation,
  geofences,
  userRole,
  onGeofenceDelete
}, ref) => {
  const webViewRef = useRef<WebView>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useImperativeHandle(ref, () => ({
    moveToLocation: (lat: number, lng: number) => {
      if (webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({
          type: 'MOVE_TO',
          payload: { lat, lng }
        }));
      }
    }
  }));

  useEffect(() => {
    if (isMapLoaded && webViewRef.current) {
      const data = {
        type: 'UPDATE_DATA',
        payload: {
          currentLocation,
          targetLocation,
          geofences,
          userRole
        }
      };
      webViewRef.current.postMessage(JSON.stringify(data));
    }
  }, [currentLocation, targetLocation, geofences, userRole, isMapLoaded]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'MAP_LOADED') {
        setIsMapLoaded(true);
        console.log('KakaoMap: Map Loaded');
      } else if (data.type === 'GEOFENCE_CLICK') {
        if (onGeofenceDelete) {
          onGeofenceDelete(data.payload.id, data.payload.name);
        }
      } else if (data.type === 'LOG') {
        console.log('KakaoMap WebView Log:', data.payload);
      } else if (data.type === 'ERROR') {
        console.error('KakaoMap WebView Error:', data.payload);
      }
    } catch (e) {
      console.error('KakaoMap: Failed to parse message', event.nativeEvent.data);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: HTML_CONTENT, baseUrl: 'https://dapi.kakao.com' }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error: ', nativeEvent);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView HTTP error: ', nativeEvent);
        }}
      />
      {!isMapLoaded && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
  },
});

export default KakaoMap;
