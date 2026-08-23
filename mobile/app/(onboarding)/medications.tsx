import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { Header } from '@/components/common/Header';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { t } from '@/i18n';
import { UserMedication } from '@health-scanner/shared';

export default function MedicationsScreen() {
  const router = useRouter();
  const { profile, updateHealthProfile, isLoading } = useAuthStore();

  const [hasMeds, setHasMeds] = useState<'no' | 'yes'>(
    profile?.medications && profile.medications.length > 0 ? 'yes' : 'no'
  );
  const [medList, setMedList] = useState<UserMedication[]>(profile?.medications || []);
  const [medName, setMedName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');

  const addMedication = () => {
    if (!medName.trim()) return;
    setMedList([
      ...medList,
      {
        medicineName: medName.trim(),
        dosage: dosage.trim() || undefined,
        frequency: frequency.trim() || undefined,
      },
    ]);
    setMedName('');
    setDosage('');
    setFrequency('');
  };

  const removeMedication = (index: number) => {
    setMedList(medList.filter((_, idx) => idx !== index));
  };

  const handleNext = async () => {
    await updateHealthProfile({
      conditions: profile?.conditions || ['none'],
      dietaryPreferences: profile?.dietaryPreferences || ['none'],
      allergenRestrictions: profile?.allergenRestrictions || [],
      customRestrictions: profile?.customRestrictions || [],
      medications: hasMeds === 'yes' ? medList : [],
    });
    router.push('/(onboarding)/disclaimer');
  };

  return (
    <View style={styles.container}>
      <Header title={t('onboarding_step_5_title')} subtitle="Step 5 of 6" showBack={true} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>{t('onboarding_step_5_subtitle')}</Text>

        {/* Prominent Medical Notice */}
        <Card variant="glass" style={styles.noticeCard}>
          <Text style={styles.noticeIcon}>🛡️</Text>
          <Text style={styles.noticeText}>{t('onboarding_step_5_notice')}</Text>
        </Card>

        <View style={styles.toggleRow}>
          <TouchableOpacity
            onPress={() => setHasMeds('no')}
            style={[styles.toggleBtn, hasMeds === 'no' && styles.toggleBtnActive]}
          >
            <Text style={[styles.toggleText, hasMeds === 'no' && styles.toggleTextActive]}>
              No Medicines
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setHasMeds('yes')}
            style={[styles.toggleBtn, hasMeds === 'yes' && styles.toggleBtnActive]}
          >
            <Text style={[styles.toggleText, hasMeds === 'yes' && styles.toggleTextActive]}>
              Yes, I take medicines
            </Text>
          </TouchableOpacity>
        </View>

        {hasMeds === 'yes' && (
          <Card variant="default" style={styles.inputCard}>
            <Text style={styles.cardHeader}>Add Medicine</Text>
            <TextInput
              style={styles.input}
              value={medName}
              onChangeText={setMedName}
              placeholder="Medicine Name (e.g. Metformin, Telmisartan)"
            />
            <View style={styles.rowInputs}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                value={dosage}
                onChangeText={setDosage}
                placeholder="Dosage (e.g. 500mg)"
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                value={frequency}
                onChangeText={setFrequency}
                placeholder="Freq (e.g. Once daily)"
              />
            </View>
            <Button
              title="+ Add Medicine"
              variant="outline"
              size="sm"
              onPress={addMedication}
              style={styles.addMedBtn}
            />

            {medList.length > 0 && (
              <View style={styles.medListContainer}>
                <Text style={styles.medListHeader}>Saved Medicines:</Text>
                {medList.map((m, idx) => (
                  <View key={idx} style={styles.medItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.medItemName}>{m.medicineName}</Text>
                      {(m.dosage || m.frequency) && (
                        <Text style={styles.medItemDetails}>
                          {[m.dosage, m.frequency].filter(Boolean).join(' • ')}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity onPress={() => removeMedication(idx)}>
                      <Text style={styles.removeText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </Card>
        )}

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
    marginBottom: spacing.sm,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  noticeIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  noticeText: {
    ...typography.bodySmall,
    flex: 1,
    color: '#1e40af',
    lineHeight: 18,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: colors.goodBg,
    borderColor: colors.primary,
  },
  toggleText: {
    fontWeight: '600',
    color: colors.textSecondary,
    fontSize: 14,
  },
  toggleTextActive: {
    color: colors.goodText,
    fontWeight: '700',
  },
  inputCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeader: {
    ...typography.h3,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: borderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  halfInput: {
    flex: 1,
  },
  addMedBtn: {
    marginTop: 4,
  },
  medListContainer: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.sm,
  },
  medListHeader: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  medItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceMuted,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  medItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  medItemDetails: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  removeText: {
    fontSize: 16,
    color: colors.error,
    fontWeight: '700',
    paddingHorizontal: spacing.sm,
  },
  nextBtn: {
    marginTop: spacing.lg,
  },
});
