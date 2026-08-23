import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/common/Button';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { t, setLanguage, getLanguage } from '@/i18n';
import { useAuthStore } from '@/store/auth.store';

export default function WelcomeScreen() {
  const router = useRouter();
  const { language, setAppLanguage } = useAuthStore();

  const toggleLanguage = () => {
    const next = language === 'en' ? 'ml' : 'en';
    setAppLanguage(next);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.langContainer}>
          <Button
            title={language === 'en' ? 'മലയാളം' : 'English'}
            variant="outline"
            size="sm"
            onPress={toggleLanguage}
          />
        </View>

        <View style={styles.heroSection}>
          <View style={styles.iconCircle}>
            <Text style={styles.heroIcon}>🔍🥗</Text>
          </View>
          <Text style={styles.headline}>{t('tagline')}</Text>
          <Text style={styles.description}>{t('welcome_desc')}</Text>
        </View>

        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📸</Text>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Scan Barcode or Label</Text>
              <Text style={styles.featureDesc}>
                Instant product lookup or OCR camera extraction in seconds.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🎯</Text>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Personalized to Your Profile</Text>
              <Text style={styles.featureDesc}>
                Evaluated against your diabetes, blood pressure, or allergy goals.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🚦</Text>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Clear 5-Second Decisions</Text>
              <Text style={styles.featureDesc}>
                Good Choice, Use Caution, or Not A Good Choice with plain explanations.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footerSection}>
          <Button
            title={t('get_started')}
            size="lg"
            onPress={() => router.push('/(auth)/register')}
            style={styles.ctaButton}
          />
          <Button
            title={t('login')}
            variant="ghost"
            onPress={() => router.push('/(auth)/login')}
            style={styles.loginButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  langContainer: {
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: borderRadius.full,
    backgroundColor: colors.goodBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.goodBorder,
  },
  heroIcon: {
    fontSize: 40,
  },
  headline: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.sm,
  },
  featureList: {
    marginVertical: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  featureIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    ...typography.h3,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  featureDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  footerSection: {
    marginTop: spacing.lg,
  },
  ctaButton: {
    marginBottom: spacing.sm,
  },
  loginButton: {},
});
