import { Tabs } from "expo-router";
import { CalendarClock, ClipboardList, LayoutGrid, MapPin, Route, UserRound } from "lucide-react-native";

import { colors } from "@/src/theme/tokens";

export default function PatientLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.teal,
        tabBarInactiveTintColor: colors.subtle,
        tabBarStyle: { borderTopColor: colors.line },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Tư vấn",
          tabBarIcon: ({ color, size }) => <LayoutGrid color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="pre-consultation"
        options={{
          title: "Trước khám",
          tabBarIcon: ({ color, size }) => <CalendarClock color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Bản đồ",
          tabBarIcon: ({ color, size }) => <MapPin color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: "Xét nghiệm",
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="recovery-plan"
        options={{
          title: "Phục hồi",
          tabBarIcon: ({ color, size }) => <Route color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Hồ sơ",
          tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="chat" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="symptom" options={{ href: null }} />
      <Tabs.Screen name="medication" options={{ href: null }} />
      <Tabs.Screen name="my-medications" options={{ href: null }} />
      <Tabs.Screen name="payment-history" options={{ href: null }} />
    </Tabs>
  );
}
