import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { Header } from '@/components/common/Header';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { t } from '@/i18n';
import { MANDATORY_MEDICAL_DISCLAIMER_EN, MANDATORY_MEDICAL_DISCLAIMER_ML } from '@health-scanner/shared';

export default function DisclaimerScreen() {
  const router = useRouter();
  const { acknowledgeDisclaimer, language } = useAuthStore();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    if (!agreed) return;
    setLoading(true);
    try {
      await acknowledgeDisclaimer();
      router.replace('/(tabs)/home');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title={t('onboarding_step_6_title')} subtitle="Step 6 of 6" showBack={true} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconCircle}>
          <Text style={styles.shieldIcon}>⚖️</Text>
        </View>

        <Text style={styles.title}>Important Medical & Health Notice</Text>

        <Card variant="elevated" style={styles.card}>
          <Text style={styles.disclaimerHeading}>English:</Text>
          <Text style={styles.disclaimerText}>{MANDATORY_MEDICAL_DISCLAIMER_EN}</Text>

          <View style={styles.divider} />

          <Text style={styles.disclaimerHeading}>മലയാളം:</Text>
          <Text style={styles.disclaimerText}>{MANDATORY_MEDICAL_DISCLAIMER_ML}</Text>

          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• The app does not diagnose diseases or prescribe medications.</Text>
            <Text style={styles.bulletItem}>• Food suitability is based on general nutrition heuristics.</Text>
            <Text style={styles.bulletItem}>• Always verify physical package labels for serious allergies.</Text>
          </View>
        </Card>

        <TouchableOpacity
          onPress={() => setAgreed(!agreed)}
          style={[styles.consentRow, agreed && styles.consentRowActive]}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, agreed && styles.checkboxActive]}>
            <Text style={styles.checkMark}>{agreed ? '✓' : ''}</Text>
          </View>
          <Text style={styles.consentText}>{t('onboarding_step_6_agree')}</Text>
        </TouchableOpacity>

        <Button
          title={t('next')}
          onPress={handleFinish}
          disabled={!agreed}
          loading={loading}
          size="lg"
          style={styles.finishBtn}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.full,
    backgroundColor: colors.goodBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
    borderWidth: 2,
    borderColor: colors.goodBorder,
  },
  shieldIcon: {
    fontSize: 32,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  card: {
    padding: spacing.lg,
    width: '100%',
    marginBottom: spacing.lg,
  },
  disclaimerHeading: {
    ...typography.label,
    color: colors.primaryDark,
    marginBottom: 4,
  },
  disclaimerText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
  },
  bulletList: {
    marginTop: spacing.md,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.sm + 4,
    borderRadius: borderRadius.md,
  },
  bulletItem: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: 4,
    lineHeight: 18,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    width: '100%',
    marginBottom: spacing.lg,
  },
  consentRowActive: {
    backgroundColor: colors.goodBg,
    borderColor: colors.primary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  checkboxActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  checkMark: {
    color: colors.textLight,
    fontWeight: '800',
    fontSize: 14,
  },
  consentText: {
    ...typography.bodyLarge,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  finishBtn: {
    width: '100%',
  },
});
