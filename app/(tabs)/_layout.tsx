import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '../../constants/theme';

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Väder', tabBarIcon: () => <TabIcon emoji="🌤️" /> }}
      />
      <Tabs.Screen
        name="radar"
        options={{ title: 'Radar', tabBarIcon: () => <TabIcon emoji="📡" /> }}
      />
      <Tabs.Screen
        name="areas"
        options={{ title: 'Områden', tabBarIcon: () => <TabIcon emoji="📍" /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Inställningar', tabBarIcon: () => <TabIcon emoji="⚙️" /> }}
      />
    </Tabs>
  );
}
