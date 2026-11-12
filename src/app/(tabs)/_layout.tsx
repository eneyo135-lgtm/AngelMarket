import { Tabs } from "expo-router";
import { Text } from "react-native";
import { colors } from "@/constants/market";

const icons: Record<string, string> = {
  explore: "⌕",
  map: "◎",
  add: "+",
  profile: "○",
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          marginBottom: 4,
        },
        tabBarStyle: {
          height: 68,
          paddingTop: 8,
          borderTopColor: colors.line,
          backgroundColor: colors.white,
        },
        tabBarIcon: ({ color }) => (
          <Text style={{ color, fontSize: 23, fontWeight: "700", lineHeight: 25 }}>
            {icons[route.name]}
          </Text>
        ),
      })}
    >
      <Tabs.Screen name="explore" options={{ title: "Explorar" }} />
      <Tabs.Screen name="map" options={{ title: "Mapa" }} />
      <Tabs.Screen name="add" options={{ title: "Publicar" }} />
      <Tabs.Screen name="profile" options={{ title: "Perfil" }} />
    </Tabs>
  );
}
