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
  PrecautionaryTraceBanner,
} from '@/components/common/DisclaimerBanner';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { t } from '@/i18n';
import { ScanRecord, NutritionValues, BetterAlternativesResult } from '@health-scanner/shared';

export default function ResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { language } = useAuthStore();

  const [scan, setScan] = useState<ScanRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [showDetailedNutrition, setShowDetailedNutrition] = useState(false);
  const [alternativesRes, setAlternativesRes] = useState<BetterAlternativesResult | null>(null);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);

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

  useEffect(() => {
    async function fetchAlternatives() {
      if (!scan) return;
      try {
        setLoadingAlternatives(true);
        const res = await api.getBetterAlternatives({
          productId: scan.productId,
          nutrition: scan.nutritionSnapshot || {},
          currentEvaluation: {
            ruleSetVersion: '1.0.0',
            status: scan.assessmentStatus,
            score: scan.score,
            personalizedGuidanceScore: scan.personalizedGuidanceScore || scan.score || 50,
            reasons: scan.reasons || [],
            allergenWarnings: scan.allergenWarnings || [],
            precautionaryTraces: scan.precautionaryTraces || [],
            hasAllergenHazard: (scan.allergenWarnings || []).length > 0,
            overallSummaryEn: '',
            overallSummaryMl: '',
            isMissingNutritionData: false,
            missingFields: [],
          },
        });
        setAlternativesRes(res);
      } catch (e) {
        console.warn('Error fetching alternatives', e);
      } finally {
        setLoadingAlternatives(false);
      }
    }
    fetchAlternatives();
  }, [scan]);

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

        {/* Biological Allergen Hazard Banner (Definite Hazard) */}
        {scan.allergenWarnings.map((a, idx) => (
          <AllergenWarningBanner
            key={idx}
            message={language === 'ml' ? a.messageMl : a.messageEn}
            submessage={`Ingredient: ${a.matchedIngredient}`}
          />
        ))}

        {/* Precautionary Allergen Traces Banner ("May Contain") */}
        {scan.precautionaryTraces && scan.precautionaryTraces.map((pt, idx) => (
          <PrecautionaryTraceBanner
            key={idx}
            message={language === 'ml' ? pt.messageMl : pt.messageEn}
            submessage={`Matched: ${pt.matchedIngredient}`}
          />
        ))}

        {/* "Why?" Reasons Section */}
        {scan.reasons.length > 0 && (
          <Card variant="default" style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t('why_title')}</Text>
            {scan.reasons.map((reason, idx) => {
              const msg = language === 'ml' ? reason.messageMl : reason.messageEn;
              const advice = language === 'ml' ? reason.betterChoiceAdviceMl : reason.betterChoiceAdviceEn;
              const sourceText = reason.classification === 'HEURISTIC'
                ? 'App-generated guidance heuristic'
                : reason.source;

              return (
                <View key={idx} style={styles.reasonItem}>
                  <Text style={styles.reasonBullet}>
                    {reason.severity === 'critical' || reason.severity === 'high' ? '⚠️' : '•'}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reasonMessage}>{msg}</Text>
                    {sourceText && (
                      <Text style={styles.sourceTag}>
                        Ref: {sourceText}
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
            <View>
              <Text style={styles.sectionTitle}>{t('nutrition_breakdown_title')}</Text>
              {scan.rawServingInfo?.servingSizeText && (
                <Text style={styles.sourceTag}>
                  Serving Size: {scan.rawServingInfo.servingSizeText} (Normalized to per 100g)
                </Text>
              )}
            </View>
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
            <NutritionRow label="Trans Fat" value={nutrition.transFatG != null ? `${nutrition.transFatG} g` : 'UNKNOWN'} highlight={Boolean((nutrition.transFatG ?? 0) > 0.2)} />
            <NutritionRow label="Dietary Fibre" value={nutrition.fibreG != null ? `${nutrition.fibreG} g` : 'UNKNOWN'} />
            <NutritionRow label="Sodium" value={nutrition.sodiumMg != null ? `${nutrition.sodiumMg} mg` : 'UNKNOWN'} highlight={Boolean((nutrition.sodiumMg ?? 0) >= 600)} />
          </View>
        </Card>

        {/* Better Alternatives Section */}
        <Card variant="default" style={styles.alternativesCard}>
          <View style={styles.alternativesHeader}>
            <Text style={styles.alternativesTitle}>
              💡 {language === 'ml' ? 'നിങ്ങളുടെ പ്രൊഫൈലിന് അനുയോജ്യമായ മറ്റ് ഉൽപ്പന്നങ്ങൾ' : 'Better Alternatives for Your Profile'}
            </Text>
            <Text style={styles.alternativesSubtitle}>
              {language === 'ml'
                ? 'നിങ്ങളുടെ ആരോഗ്യ മുൻഗണനകൾക്കനുസൃതമായി ശുപാർശ ചെയ്തവ'
                : 'Ranked specifically based on your dietary and health profile'}
            </Text>
          </View>

          {loadingAlternatives ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.md }} />
          ) : alternativesRes && alternativesRes.hasAlternatives ? (
            alternativesRes.alternatives.map((item, idx) => (
              <TouchableOpacity
                key={item.product.id || idx}
                style={styles.altItemCard}
                activeOpacity={0.85}
                onPress={() => {
                  if (scan.productId && item.product.id) {
                    router.push(`/compare?ids=${scan.productId},${item.product.id}` as any);
                  }
                }}
              >
                <View style={styles.altItemHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.altProductName}>{item.product.name}</Text>
                    <Text style={styles.altBrandName}>{item.product.brand || item.product.category}</Text>
                  </View>
                  <View style={styles.altBadge}>
                    <Text style={styles.altBadgeText}>
                      {language === 'ml' ? item.guidanceBadgeMl : item.guidanceBadgeEn}
                    </Text>
                  </View>
                </View>

                <View style={styles.altScoreRow}>
                  <Text style={styles.altScoreText}>
                    {language === 'ml' ? 'സ്കോർ' : 'Profile Score'}:{' '}
                    <Text style={styles.altScoreVal}>{item.evaluation.personalizedGuidanceScore}/100</Text>
                  </Text>
                  <Text style={styles.tapToCompareHint}>
                    {language === 'ml' ? 'താരതമ്യം ചെയ്യാൻ ടാപ്പ് ചെയ്യുക ➔' : 'Tap to compare ➔'}
                  </Text>
                </View>

                {/* Concrete Comparison Reasons */}
                <View style={styles.reasonsList}>
                  {(language === 'ml' ? item.comparisonReasonsMl : item.comparisonReasonsEn).map((reason, rIdx) => (
                    <View key={rIdx} style={styles.reasonRow}>
                      <Text style={styles.altReasonBullet}>✓</Text>
                      <Text style={styles.altReasonText}>{reason}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyAltContainer}>
              <Text style={styles.emptyAltText}>
                {language === 'ml'
                  ? (alternativesRes?.emptyMessageMl || 'അനുയോജ്യമായ മറ്റ് ഉൽപ്പന്നങ്ങൾ ഇപ്പോൾ ലഭ്യമല്ല.')
                  : (alternativesRes?.emptyMessageEn || 'No suitable alternatives found yet.')}
              </Text>
            </View>
          )}
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
              title="⇄ Compare with Another Product"
              variant="secondary"
              onPress={() => router.push(`/compare?ids=${scan.productId}` as any)}
            />
          )}

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
  sourceTag: {
    ...typography.bodySmall,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    fontStyle: 'italic',
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
  alternativesCard: {
    marginBottom: spacing.md,
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  alternativesHeader: {
    marginBottom: spacing.md,
  },
  alternativesTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#166534',
  },
  alternativesSubtitle: {
    fontSize: 12,
    color: '#15803d',
    marginTop: 2,
  },
  altItemCard: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#dcfce7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  altItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  altProductName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  altBrandName: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  altBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: '#86efac',
    marginLeft: spacing.xs,
  },
  altBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803d',
  },
  altScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  altScoreText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  altScoreVal: {
    fontWeight: '800',
    color: colors.primary,
  },
  tapToCompareHint: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },
  reasonsList: {
    marginTop: 4,
    gap: 3,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  altReasonBullet: {
    color: '#16a34a',
    fontWeight: '800',
    fontSize: 12,
    marginRight: 6,
    marginTop: 1,
  },
  altReasonText: {
    fontSize: 12,
    color: '#334155',
    flex: 1,
    lineHeight: 16,
  },
  emptyAltContainer: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  emptyAltText: {
    fontSize: 13,
    color: '#64748b',
    fontStyle: 'italic',
  },
});
