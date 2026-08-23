import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { colors, spacing, typography } from '@/theme';

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, profile, checkSession } = useAuthStore();

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      await checkSession();
      setTimeout(() => {
        if (!isMounted) return;
        const currentProfile = useAuthStore.getState().profile;
        const isAuth = useAuthStore.getState().isAuthenticated;

        if (!isAuth) {
          router.replace('/(onboarding)/welcome');
        } else if (!currentProfile?.disclaimerAcknowledged) {
          router.replace('/(onboarding)/disclaimer');
        } else {
          router.replace('/(tabs)/home');
        }
      }, 500);
    };

    init();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoIcon}>🥗</Text>
        <Text style={styles.title}>AI Food Scanner</Text>
        <Text style={styles.subtitle}>Eat Smarter. Scan Before You Buy.</Text>
      </View>
      <ActivityIndicator size="large" color={colors.primaryLight} style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodyLarge,
    color: colors.primaryLight,
    textAlign: 'center',
  },
  loader: {
    marginTop: spacing.xl,
  },
});
