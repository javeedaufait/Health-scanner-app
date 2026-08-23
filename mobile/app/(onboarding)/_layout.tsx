import React from 'react';
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#f8fafc' },
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="basic-profile" />
      <Stack.Screen name="health-conditions" />
      <Stack.Screen name="dietary-restrictions" />
      <Stack.Screen name="medications" />
      <Stack.Screen name="disclaimer" />
    </Stack>
  );
}
