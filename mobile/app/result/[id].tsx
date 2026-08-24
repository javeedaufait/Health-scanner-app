import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
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
  const score = scan.personalizedGuidanceScore ?? scan.score ?? 100;

  return (
    <View style={styles.container}>
      <Header title="Scan Assessment" showBack={true} />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Product Identity Header */}
        <View style={styles.productHeader}>
          <Text style={styles.productName}>{scan.productName}</Text>
          {scan.brand && <Text style={styles.brandName}>{scan.brand}</Text>}
        </View>

        {/* Primary Status Card with Personalized Guidance Score */}
        <Card variant="elevated" style={styles.statusCard}>
          <StatusBadge status={scan.assessmentStatus} size="lg" style={styles.badgeCenter} />

          <View style={styles.scoreContainer}>
            <Text style={styles.scoreValue}>{score}</Text>
            <Text style={styles.scoreMax}>/ 100</Text>
          </View>
          <Text style={styles.scoreLabel}>{t('guidance_score_label')}</Text>
          <Text style={styles.scoreSub}>{t('guidance_score_sub')}</Text>

          {/* Heuristic Summary */}
          <Text style={styles.summaryText}>
            {language === 'ml'
              ? scan.aiExplanationMl || scan.reasons[0]?.messageMl
              : scan.aiExplanationEn || scan.reasons[0]?.messageEn}
          </Text>
        </Card>

        {/* Biological Allergen Hazard Banner (If Present) */}
        {scan.allergenWarnings.map((a, idx) => (
          <AllergenWarningBanner
            key={idx}
            message={language === 'ml' ? a.messageMl : a.messageEn}
            submessage={`Ingredient: ${a.matchedIngredient}`}
          />
        ))}

        {/* Missing Nutrition Data Warning (If Present) */}
        {scan.reasons.length === 0 && (!nutrition.sodiumMg || !nutrition.addedSugarsG) && (
          <Card variant="outlined" style={styles.missingDataCard}>
            <Text style={styles.missingDataText}>
              ℹ️ {t('missing_data_notice')}
            </Text>
          </Card>
        )}

        {/* "Why?" Reasons Section with Source Metadata */}
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
                    {reason.source && (
                      <Text style={styles.sourceTag}>
                        Ref: {reason.source} ({reason.classification || 'Heuristic'})
                      </Text>
                    )}
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
            <NutritionRow label="Energy / Calories" value={nutrition.energyKcal != null ? `${nutrition.energyKcal} kcal` : 'UNKNOWN'} />
            <NutritionRow label="Total Carbohydrates" value={nutrition.carbohydratesG != null ? `${nutrition.carbohydratesG} g` : 'UNKNOWN'} />
            <NutritionRow label="Total Sugars" value={nutrition.sugarsG != null ? `${nutrition.sugarsG} g` : 'UNKNOWN'} highlight={Boolean((nutrition.sugarsG ?? 0) >= 15)} />
            <NutritionRow label="Added Sugars" value={nutrition.addedSugarsG != null ? `${nutrition.addedSugarsG} g` : 'UNKNOWN'} highlight={Boolean((nutrition.addedSugarsG ?? 0) >= 10)} />
            <NutritionRow label="Protein" value={nutrition.proteinG != null ? `${nutrition.proteinG} g` : 'UNKNOWN'} />
            <NutritionRow label="Total Fat" value={nutrition.fatG != null ? `${nutrition.fatG} g` : 'UNKNOWN'} />
            <NutritionRow label="Saturated Fat" value={nutrition.saturatedFatG != null ? `${nutrition.saturatedFatG} g` : 'UNKNOWN'} highlight={Boolean((nutrition.saturatedFatG ?? 0) >= 5)} />
            <NutritionRow label="Trans Fat" value={nutrition.transFatG != null ? `${nutrition.transFatG} g` : 'UNKNOWN'} highlight={Boolean((nutrition.transFatG ?? 0) > 0.1)} />
            <NutritionRow label="Dietary Fibre" value={nutrition.fibreG != null ? `${nutrition.fibreG} g` : 'UNKNOWN'} />
            <NutritionRow label="Sodium" value={nutrition.sodiumMg != null ? `${nutrition.sodiumMg} mg` : 'UNKNOWN'} highlight={Boolean((nutrition.sodiumMg ?? 0) >= 600)} />
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
    marginTop: spacing.md,
    ...typography.body,
    color: colors.textSecondary,
  },
  errorText: {
    ...typography.h3,
    color: colors.error,
    marginBottom: spacing.md,
  },
  content: {
    padding: spacing.md,
  },
  productHeader: {
    marginBottom: spacing.md,
  },
  productName: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  brandName: {
    ...typography.body,
    color: colors.textSecondary,
  },
  statusCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
  },
  badgeCenter: {
    marginBottom: spacing.sm,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: spacing.xs,
  },
  scoreValue: {
    ...typography.h1,
    fontSize: 42,
    color: colors.primary,
    fontWeight: 'bold',
  },
  scoreMax: {
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  scoreLabel: {
    ...typography.bodySmall,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreSub: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
    paddingHorizontal: spacing.md,
  },
  summaryText: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  missingDataCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  missingDataText: {
    ...typography.bodySmall,
    color: '#1E40AF',
    lineHeight: 18,
  },
  sectionCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  reasonItem: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  reasonBullet: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  reasonMessage: {
    ...typography.body,
    color: colors.textPrimary,
  },
  sourceTag: {
    ...typography.bodySmall,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    fontStyle: 'italic',
  },
  sourceAdvice: {
    ...typography.bodySmall,
    color: colors.primary,
    marginTop: 4,
  },
  reasonAdvice: {
    ...typography.bodySmall,
    color: colors.primary,
    marginTop: 4,
  },
  nutritionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  per100gText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  table: {
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  nutritionRowHighlight: {
    backgroundColor: '#FEF2F2',
  },
  nutrientLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  nutrientValue: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  nutrientHighlightText: {
    color: colors.error,
  },
  actionButtonsContainer: {
    marginVertical: spacing.md,
    gap: spacing.sm,
  },
  primaryActionBtn: {
    marginBottom: spacing.xs,
  },
});
