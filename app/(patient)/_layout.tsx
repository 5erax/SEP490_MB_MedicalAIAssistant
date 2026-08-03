// Bottom-tab shell for the patient area. Tabs are added as their modules
// land instead of building a full tab bar ahead of the screens that would
// populate it — Profile (Module 12) is the latest addition.
//
// Expo Router's Tabs auto-adds every route file under this group to the tab
// bar unless it's explicitly hidden (options.href = null) — so secondary
// screens reached via navigation from elsewhere (not primary destinations)
// must be listed here too, just without a visible tab.
import { Tabs } from "expo-router";
import { LayoutGrid, MapPin, MessageCircle, Settings, UserRound } from "lucide-react-native";

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
        name="map"
        options={{
          title: "Bản đồ",
          tabBarIcon: ({ color, size }) => <MapPin color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat AI",
          tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Hồ sơ",
          tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Cài đặt",
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="medication" options={{ href: null }} />
      <Tabs.Screen name="my-medications" options={{ href: null }} />
      <Tabs.Screen name="payment-history" options={{ href: null }} />
      <Tabs.Screen name="recovery-plan" options={{ href: null }} />
    </Tabs>
  );
}
