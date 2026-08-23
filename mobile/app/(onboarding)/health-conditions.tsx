import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { Header } from '@/components/common/Header';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { t, getLanguage } from '@/i18n';
import { MASTER_HEALTH_CONDITIONS, HealthConditionCode } from '@health-scanner/shared';

export default function HealthConditionsScreen() {
  const router = useRouter();
  const { profile, updateHealthProfile, isLoading, language } = useAuthStore();

  const [selectedConditions, setSelectedConditions] = useState<HealthConditionCode[]>(
    profile?.conditions && profile.conditions.length > 0 ? profile.conditions : ['none']
  );

  const toggleCondition = (code: HealthConditionCode) => {
    if (code === 'none') {
      setSelectedConditions(['none']);
      return;
    }

    let updated: HealthConditionCode[] = selectedConditions.filter((c) => c !== 'none');
    if (updated.includes(code)) {
      updated = updated.filter((c) => c !== code);
      if (updated.length === 0) {
        updated = ['none'];
      }
    } else {
      updated.push(code);
    }
    setSelectedConditions(updated);
  };

  const handleNext = async () => {
    await updateHealthProfile({
      conditions: selectedConditions,
      dietaryPreferences: profile?.dietaryPreferences || ['none'],
      allergenRestrictions: profile?.allergenRestrictions || [],
      customRestrictions: profile?.customRestrictions || [],
      medications: profile?.medications || [],
    });
    router.push('/(onboarding)/dietary-restrictions');
  };

  return (
    <View style={styles.container}>
      <Header title={t('onboarding_step_3_title')} subtitle="Step 3 of 6" showBack={true} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>{t('onboarding_step_3_subtitle')}</Text>
        <Text style={styles.noticeText}>{t('onboarding_step_3_notice')}</Text>

        <View style={styles.list}>
          {MASTER_HEALTH_CONDITIONS.map((cond) => {
            const isSelected = selectedConditions.includes(cond.code);
            const name = language === 'ml' ? cond.nameMl : cond.nameEn;
            const desc = language === 'ml' ? cond.descriptionMl : cond.descriptionEn;

            return (
              <TouchableOpacity
                key={cond.code}
                onPress={() => toggleCondition(cond.code)}
                activeOpacity={0.8}
                style={[styles.itemCard, isSelected && styles.itemCardSelected]}
              >
                <View style={styles.checkbox}>
                  <Text style={[styles.checkText, isSelected && styles.checkTextActive]}>
                    {isSelected ? '✓' : ''}
                  </Text>
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.itemTitle, isSelected && styles.itemTitleSelected]}>
                    {name}
                  </Text>
                  <Text style={styles.itemDesc}>{desc}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Button
          title={t('next')}
          onPress={handleNext}
          loading={isLoading}
          style={styles.nextBtn}
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
    paddingBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  noticeText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  list: {
    gap: spacing.sm,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  itemCardSelected: {
    backgroundColor: colors.goodBg,
    borderColor: colors.primary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    marginTop: 2,
    backgroundColor: colors.surface,
  },
  checkText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  checkTextActive: {
    color: colors.primary,
  },
  textContainer: {
    flex: 1,
  },
  itemTitle: {
    ...typography.h3,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  itemTitleSelected: {
    color: colors.goodText,
  },
  itemDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  nextBtn: {
    marginTop: spacing.lg,
  },
});
