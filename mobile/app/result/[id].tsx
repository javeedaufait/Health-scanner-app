import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/services/api';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/Badge';
import {
  MedicalDisclaimerBanner,
  AllergenWarningBanner,
} from '@/components/common/DisclaimerBanner';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { t } from '@/i18n';
import { ScanRecord, NutritionValues } from '@health-scanner/shared';

export default function ResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { language } = useAuthStore();

  const [scan, setScan] = useState<ScanRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [showDetailedNutrition, setShowDetailedNutrition] = useState(false);

  useEffect(() => {
    async function fetchScan() {
      if (!id) return;
      try {
        const data = await api.getScanById(id);
        setScan(data);
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Could not load scan details');
      } finally {
        setLoading(false);
      }
    }
    fetchScan();
  }, [id]);

  const handleToggleSave = async () => {
    if (!scan?.productId) return;
    try {
      const res = await api.toggleSavedProduct(scan.productId);
      setIsSaved(res.isSaved);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading personalized result...</Text>
      </View>
    );
  }

  if (!scan) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Scan result not found.</Text>
        <Button title="Go Back" onPress={() => router.back()} />
      </View>
    );
  }

  const nutrition: NutritionValues = scan.nutritionSnapshot || {};

  return (
    <View style={styles.container}>
      <Header title="Scan Assessment" showBack={true} />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Product Identity Header */}
        <View style={styles.productHeader}>
          <Text style={styles.productName}>{scan.productName}</Text>
          {scan.brand && <Text style={styles.brandName}>{scan.brand}</Text>}
        </View>

        {/* Primary 5-Second Status Card */}
        <Card variant="elevated" style={styles.statusCard}>
          <StatusBadge status={scan.assessmentStatus} size="lg" style={styles.badgeCenter} />

          {/* Friendly AI / Heuristic Summary */}
          <Text style={styles.summaryText}>
            {language === 'ml'
              ? scan.aiExplanationMl || scan.reasons[0]?.messageMl
              : scan.aiExplanationEn || scan.reasons[0]?.messageEn}
          </Text>
        </Card>

        {/* Allergen Warning Banner (If Present) */}
        {scan.allergenWarnings.map((a, idx) => (
          <AllergenWarningBanner
            key={idx}
            message={language === 'ml' ? a.messageMl : a.messageEn}
            submessage={`Ingredient: ${a.matchedIngredient}`}
          />
        ))}

        {/* "Why?" Reasons Section */}
        {scan.reasons.length > 0 && (
          <Card variant="default" style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t('why_title')}</Text>
            {scan.reasons.map((reason, idx) => {
              const msg = language === 'ml' ? reason.messageMl : reason.messageEn;
              const advice = language === 'ml' ? reason.betterChoiceAdviceMl : reason.betterChoiceAdviceEn;

              return (
                <View key={idx} style={styles.reasonItem}>
                  <Text style={styles.reasonBullet}>
                    {reason.severity === 'critical' || reason.severity === 'high' ? '⚠️' : '•'}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reasonMessage}>{msg}</Text>
                    {advice && <Text style={styles.reasonAdvice}>💡 {advice}</Text>}
                  </View>
                </View>
              );
            })}
          </Card>
        )}

        {/* Nutrition Information Table */}
        <Card variant="default" style={styles.sectionCard}>
          <View style={styles.nutritionHeaderRow}>
            <Text style={styles.sectionTitle}>{t('nutrition_breakdown_title')}</Text>
            <Text style={styles.per100gText}>{t('per_100g')}</Text>
          </View>

          <View style={styles.table}>
            <NutritionRow label="Energy / Calories" value={`${nutrition.energyKcal ?? '--'} kcal`} />
            <NutritionRow label="Total Carbohydrates" value={`${nutrition.carbohydratesG ?? '--'} g`} />
            <NutritionRow label="Total Sugars" value={`${nutrition.sugarsG ?? '--'} g`} highlight={Boolean((nutrition.sugarsG ?? 0) > 15)} />
            <NutritionRow label="Added Sugars" value={`${nutrition.addedSugarsG ?? '--'} g`} highlight={Boolean((nutrition.addedSugarsG ?? 0) >= 10)} />
            <NutritionRow label="Protein" value={`${nutrition.proteinG ?? '--'} g`} />
            <NutritionRow label="Total Fat" value={`${nutrition.fatG ?? '--'} g`} />
            <NutritionRow label="Saturated Fat" value={`${nutrition.saturatedFatG ?? '--'} g`} highlight={Boolean((nutrition.saturatedFatG ?? 0) >= 5)} />
            <NutritionRow label="Trans Fat" value={`${nutrition.transFatG ?? '0'} g`} highlight={Boolean((nutrition.transFatG ?? 0) > 0.1)} />
            <NutritionRow label="Dietary Fibre" value={`${nutrition.fibreG ?? '--'} g`} />
            <NutritionRow label="Sodium" value={`${nutrition.sodiumMg ?? '--'} mg`} highlight={Boolean((nutrition.sodiumMg ?? 0) >= 500)} />
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <Button
            title={t('scan_another')}
            size="lg"
            onPress={() => router.push('/(tabs)/scan')}
            style={styles.primaryActionBtn}
          />

          {scan.productId && (
            <Button
              title={isSaved ? `✓ ${t('saved_to_favorites')}` : `⭐ ${t('save_to_favorites')}`}
              variant="outline"
              onPress={handleToggleSave}
            />
          )}
        </View>

        <MedicalDisclaimerBanner />
      </ScrollView>
    </View>
  );
}

function NutritionRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={[styles.nutritionRow, highlight && styles.nutritionRowHighlight]}>
      <Text style={[styles.nutrientLabel, highlight && styles.nutrientHighlightText]}>
        {label}
      </Text>
      <Text style={[styles.nutrientValue, highlight && styles.nutrientHighlightText]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  errorText: {
    ...typography.bodyLarge,
    color: colors.error,
    marginBottom: spacing.md,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  productHeader: {
    marginBottom: spacing.sm,
  },
  productName: {
    ...typography.h1,
    fontSize: 22,
    color: colors.textPrimary,
  },
  brandName: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusCard: {
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  badgeCenter: {
    marginBottom: spacing.md,
  },
  summaryText: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  sectionCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  reasonBullet: {
    fontSize: 14,
    marginRight: spacing.sm,
    marginTop: 2,
  },
  reasonMessage: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    lineHeight: 20,
  },
  reasonAdvice: {
    ...typography.bodySmall,
    color: colors.goodText,
    marginTop: 3,
    lineHeight: 18,
  },
  nutritionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  per100gText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  table: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  nutritionRowHighlight: {
    backgroundColor: colors.cautionBg,
    paddingHorizontal: 6,
    borderRadius: borderRadius.sm,
  },
  nutrientLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  nutrientValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  nutrientHighlightText: {
    color: colors.cautionText,
    fontWeight: '700',
  },
  actionButtonsContainer: {
    marginVertical: spacing.md,
    gap: spacing.sm,
  },
  primaryActionBtn: {
    marginBottom: spacing.xs,
  },
});
