import React from 'react';
import { Tabs } from 'expo-router';
import { Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '@/theme';
import { t } from '@/i18n';
import { useAuthStore } from '@/store/auth.store';

export default function TabLayout() {
  const { language } = useAuthStore();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('nav_home'),
          tabBarIcon: ({ color }: { color: string }) => <Text style={{ fontSize: 20 }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: t('nav_scan'),
          tabBarIcon: ({ color }: { color: string }) => <Text style={{ fontSize: 22 }}>🔍</Text>,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t('nav_history'),
          tabBarIcon: ({ color }: { color: string }) => <Text style={{ fontSize: 20 }}>📋</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('nav_profile'),
          tabBarIcon: ({ color }: { color: string }) => <Text style={{ fontSize: 20 }}>👤</Text>,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    height: 64,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
