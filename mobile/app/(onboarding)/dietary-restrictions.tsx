import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { Header } from '@/components/common/Header';
import { Button } from '@/components/common/Button';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { t } from '@/i18n';
import {
  MASTER_DIETARY_PREFERENCES,
  MASTER_ALLERGENS,
  DietaryPreferenceCode,
  AllergenRestrictionCode,
} from '@health-scanner/shared';

export default function DietaryRestrictionsScreen() {
  const router = useRouter();
  const { profile, updateHealthProfile, isLoading, language } = useAuthStore();

  const [selectedPref, setSelectedPref] = useState<DietaryPreferenceCode>(
    profile?.dietaryPreferences?.[0] || 'none'
  );
  const [selectedAllergens, setSelectedAllergens] = useState<AllergenRestrictionCode[]>(
    profile?.allergenRestrictions || []
  );
  const [customInput, setCustomInput] = useState('');
  const [customList, setCustomList] = useState<string[]>(profile?.customRestrictions || []);

  const toggleAllergen = (code: AllergenRestrictionCode) => {
    if (selectedAllergens.includes(code)) {
      setSelectedAllergens(selectedAllergens.filter((a) => a !== code));
    } else {
      setSelectedAllergens([...selectedAllergens, code]);
    }
  };

  const addCustomRestriction = () => {
    const trimmed = customInput.trim();
    if (trimmed && !customList.includes(trimmed)) {
      setCustomList([...customList, trimmed]);
      setCustomInput('');
    }
  };

  const removeCustom = (item: string) => {
    setCustomList(customList.filter((c) => c !== item));
  };

  const handleNext = async () => {
    await updateHealthProfile({
      conditions: profile?.conditions || ['none'],
      dietaryPreferences: [selectedPref],
      allergenRestrictions: selectedAllergens,
      customRestrictions: customList,
      medications: profile?.medications || [],
    });
    router.push('/(onboarding)/medications');
  };

  return (
    <View style={styles.container}>
      <Header title={t('onboarding_step_4_title')} subtitle="Step 4 of 6" showBack={true} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>{t('onboarding_step_4_subtitle')}</Text>

        {/* Dietary Preferences */}
        <Text style={styles.groupHeader}>Dietary Preference</Text>
        <View style={styles.chipRow}>
          {MASTER_DIETARY_PREFERENCES.map((p) => {
            const isSelected = selectedPref === p.code;
            const name = language === 'ml' ? p.nameMl : p.nameEn;
            return (
              <TouchableOpacity
                key={p.code}
                onPress={() => setSelectedPref(p.code as DietaryPreferenceCode)}
                style={[styles.prefChip, isSelected && styles.prefChipSelected]}
              >
                <Text style={[styles.prefChipText, isSelected && styles.prefChipTextSelected]}>
                  {name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Common Allergens */}
        <Text style={styles.groupHeader}>Common Allergens to Flag</Text>
        <View style={styles.allergenGrid}>
          {MASTER_ALLERGENS.map((a) => {
            const isSelected = selectedAllergens.includes(a.code as AllergenRestrictionCode);
            const name = language === 'ml' ? a.nameMl : a.nameEn;
            return (
              <TouchableOpacity
                key={a.code}
                onPress={() => toggleAllergen(a.code as AllergenRestrictionCode)}
                style={[styles.allergenCard, isSelected && styles.allergenCardSelected]}
              >
                <Text style={[styles.allergenTitle, isSelected && styles.allergenTitleSelected]}>
                  {isSelected ? '⚠️ ' : ''}{name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Custom Restriction */}
        <Text style={styles.groupHeader}>Add Custom Ingredient Restriction</Text>
        <View style={styles.customInputRow}>
          <TextInput
            style={styles.customInput}
            value={customInput}
            onChangeText={setCustomInput}
            placeholder="e.g. MSG, Palm Oil, Gelatin"
          />
          <Button title="Add" size="sm" onPress={addCustomRestriction} style={styles.addBtn} />
        </View>

        {customList.length > 0 && (
          <View style={styles.customTagsRow}>
            {customList.map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => removeCustom(item)}
                style={styles.customTag}
              >
                <Text style={styles.customTagText}>{item} ✕</Text>
              </TouchableOpacity>
            ))}
          </View>
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
    marginBottom: spacing.md,
  },
  groupHeader: {
    ...typography.h3,
    fontSize: 15,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  prefChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  prefChipSelected: {
    backgroundColor: colors.goodBg,
    borderColor: colors.primary,
  },
  prefChipText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  prefChipTextSelected: {
    color: colors.goodText,
    fontWeight: '700',
  },
  allergenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  allergenCard: {
    width: '48%',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    justifyContent: 'center',
  },
  allergenCardSelected: {
    backgroundColor: colors.notGoodBg,
    borderColor: colors.notGood,
  },
  allergenTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  allergenTitleSelected: {
    color: colors.notGoodText,
    fontWeight: '700',
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  customInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 14,
  },
  addBtn: {
    height: 44,
  },
  customTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
    marginTop: spacing.sm,
  },
  customTag: {
    backgroundColor: colors.surfaceMuted,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  customTagText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  nextBtn: {
    marginTop: spacing.xl,
  },
});
