// Minimal bottom-tab shell for the patient area (Home + Map for now). More
// tabs (Chat, Profile, ...) are added as their modules land — Modules 4 and
// 13 respectively — instead of building a full tab bar ahead of the screens
// that would populate it.
import { Tabs } from "expo-router";
import { LayoutGrid, MapPin } from "lucide-react-native";

import { colors } from "@/src/theme/tokens";

export default function PatientLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.limeDark,
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
    </Tabs>
  );
}
