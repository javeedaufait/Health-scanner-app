import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { Header } from '@/components/common/Header';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { t } from '@/i18n';

export default function BasicProfileScreen() {
  const router = useRouter();
  const { profile, updateBasicProfile, isLoading } = useAuthStore();

  const [name, setName] = useState(profile?.name || '');
  const [age, setAge] = useState(profile?.age ? String(profile.age) : '');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | 'prefer_not_to_say'>(
    profile?.gender || 'prefer_not_to_say'
  );
  const [state, setState] = useState(profile?.state || 'Kerala');

  const handleNext = async () => {
    const parsedAge = age ? parseInt(age, 10) : undefined;
    await updateBasicProfile({
      name: name.trim() || profile?.name || 'User',
      age: parsedAge,
      gender,
      state: state.trim() || 'Kerala',
      country: 'India',
    });
    router.push('/(onboarding)/health-conditions');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Header title={t('onboarding_step_2_title')} subtitle="Step 2 of 6" showBack={true} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card variant="elevated" style={styles.card}>
          <Text style={styles.headerTitle}>{t('onboarding_step_2_title')}</Text>
          <Text style={styles.headerSubtitle}>{t('onboarding_step_2_subtitle')}</Text>

          <View style={styles.field}>
            <Text style={styles.label}>{t('name_label')}</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Anjali Menon"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('age_label')}</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              placeholder="e.g. 42"
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('gender_label')}</Text>
            <View style={styles.genderRow}>
              {[
                { id: 'male', label: 'Male' },
                { id: 'female', label: 'Female' },
                { id: 'other', label: 'Other' },
                { id: 'prefer_not_to_say', label: 'Skip' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setGender(item.id as any)}
                  style={[
                    styles.genderChip,
                    gender === item.id && styles.genderChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.genderChipText,
                      gender === item.id && styles.genderChipTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('state_label')}</Text>
            <TextInput
              style={styles.input}
              value={state}
              onChangeText={setState}
              placeholder="Kerala"
            />
          </View>

          <Button
            title={t('next')}
            onPress={handleNext}
            loading={isLoading}
            style={styles.nextBtn}
          />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
  card: {
    padding: spacing.lg,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  field: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  genderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  genderChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  genderChipActive: {
    backgroundColor: colors.goodBg,
    borderColor: colors.primary,
  },
  genderChipText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  genderChipTextActive: {
    color: colors.goodText,
    fontWeight: '700',
  },
  nextBtn: {
    marginTop: spacing.lg,
  },
});
