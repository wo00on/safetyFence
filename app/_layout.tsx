import { Stack } from "expo-router";
import "../global.css";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} /> {/* Login Page */}
      <Stack.Screen name="SelectRole" options={{ headerShown: false }} />
      <Stack.Screen name="MapPage" options={{ headerShown: false }} />
      <Stack.Screen name="CalendarPage" options={{ headerShown: false }} />
      <Stack.Screen name="MyPage" options={{ headerShown: false }} />
      <Stack.Screen name="LinkPage" options={{ headerShown: false }} />
    </Stack>
  );
}

// HEADER, FOOTER  기본 설정을 하는 곳이라고 생각

