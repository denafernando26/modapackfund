import { Tabs } from 'expo-router/js-tabs';
import { Text } from 'react-native';

import { colors } from '../../components/theme';

function TabIcon({ glyph, color }: { glyph: string; color: string }) {
  return <Text style={{ fontSize: 20, color }}>{glyph}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Proyek',
          headerTitle: 'Modapack Fund',
          tabBarIcon: ({ color }) => <TabIcon glyph="▦" color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{
          title: 'Portofolio',
          tabBarIcon: ({ color }) => <TabIcon glyph="◑" color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <TabIcon glyph="◉" color={String(color)} />,
        }}
      />
    </Tabs>
  );
}
