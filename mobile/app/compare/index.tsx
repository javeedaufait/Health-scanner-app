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
import { MedicalDisclaimerBanner } from '@/components/common/DisclaimerBanner';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { t } from '@/i18n';
import { Product, ScanRecord, UserProfile } from '@health-scanner/shared';
import { compareProductsForUser, ProductComparisonResult } from '@/shared/comparator';

export default function CompareScreen() {
  const router = useRouter();
  const { ids } = useLocalSearchParams<{ ids?: string }>();
  const { language } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [recentScans, setRecentScans] = useState<ScanRecord[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const userProf = await api.getProfile();
        setProfile(userProf);

        const scans = await api.getScanHistory();
        setRecentScans(scans);

        let selectedProducts: Product[] = [];

        if (ids) {
          const idList = ids.split(',').filter(Boolean);
          for (const id of idList) {
            try {
              const p = await api.getProductById(id);
              if (p) selectedProducts.push(p);
            } catch {}
          }
        }

        // If less than 2 products passed in query, auto-fill from recent scans for demo
        if (selectedProducts.length < 2 && scans.length >= 2) {
          const autoList: Product[] = [];
          for (const scan of scans.slice(0, 3)) {
            try {
              const p = await api.getProductById(scan.productId);
              if (p && !autoList.some((item) => item.id === p.id)) {
                autoList.push(p);
              }
            } catch {}
          }
          if (autoList.length >= 2) {
            selectedProducts = autoList;
          }
        }

        setProducts(selectedProducts);
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Could not load products for comparison.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [ids]);

  const handleRemoveProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const handleAddProduct = (scan: ScanRecord) => {
    if (products.length >= 3) {
      Alert.alert('Limit Reached', 'You can compare up to 3 products at a time.');
      return;
    }
    api.getProductById(scan.productId).then((p) => {
      if (p && !products.some((item) => item.id === p.id)) {
        setProducts((prev) => [...prev, p]);
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Comparing products for your health profile...</Text>
      </View>
    );
  }

  const comparison: ProductComparisonResult = compareProductsForUser(
    products,
    profile || {}
  );

  return (
    <View style={styles.container}>
      <Header title={t('compare_title')} showBack={true} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subTitle}>{t('compare_hint')}</Text>

        {/* Highlights / Recommendation Banner */}
        {comparison.comparisonHighlightsEn.length > 0 && (
          <Card variant="elevated" style={styles.winnerCard}>
            <Text style={styles.winnerCardTitle}>⭐ {t('best_pick')}</Text>
            {language === 'ml'
              ? comparison.comparisonHighlightsMl.map((h, i) => (
                  <Text key={i} style={styles.winnerHighlightText}>
                    {h}
                  </Text>
                ))
              : comparison.comparisonHighlightsEn.map((h, i) => (
                  <Text key={i} style={styles.winnerHighlightText}>
                    {h}
                  </Text>
                ))}
          </Card>
        )}

        {/* Side-by-Side Cards Carousel / Columns */}
        {products.length === 0 ? (
          <Card variant="default" style={styles.emptyCard}>
            <Text style={styles.emptyText}>No products selected for comparison yet.</Text>
            <Button
              title="Scan a Product"
              onPress={() => router.push('/(tabs)/scan')}
              style={{ marginTop: spacing.md }}
            />
          </Card>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.columnsScroll}>
            {comparison.items.map((item) => {
              const { product, evaluation, isWinner } = item;
              const score = evaluation.personalizedGuidanceScore;

              return (
                <View key={product.id} style={[styles.columnCard, isWinner && styles.winnerColumnCard]}>
                  {isWinner && (
                    <View style={styles.winnerBadgeContainer}>
                      <Text style={styles.winnerBadgeText}>🏆 {t('best_pick')}</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    onPress={() => handleRemoveProduct(product.id)}
                    style={styles.removeBtn}
                  >
                    <Text style={styles.removeBtnText}>✕</Text>
                  </TouchableOpacity>

                  <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  {product.brand && <Text style={styles.brandName}>{product.brand}</Text>}

                  <View style={styles.scoreRow}>
                    <Text style={styles.scoreNum}>{score}</Text>
                    <Text style={styles.scoreSub}>/ 100</Text>
                  </View>

                  <StatusBadge status={evaluation.status} size="sm" />

                  {evaluation.hasAllergenHazard && (
                    <View style={styles.allergenAlertBox}>
                      <Text style={styles.allergenAlertText}>⚠️ Allergen Hazard</Text>
                    </View>
                  )}

                  <View style={styles.divider} />

                  {/* Per 100g Nutrient Table */}
                  <View style={styles.table}>
                    <NutrientItem label="Energy" value={`${product.nutritionPer100g.energyKcal ?? '--'} kcal`} />
                    <NutrientItem
                      label="Added Sugar"
                      value={`${product.nutritionPer100g.addedSugarsG ?? '--'} g`}
                      highlight={(product.nutritionPer100g.addedSugarsG ?? 0) >= 5}
                    />
                    <NutrientItem
                      label="Sodium"
                      value={`${product.nutritionPer100g.sodiumMg ?? '--'} mg`}
                      highlight={(product.nutritionPer100g.sodiumMg ?? 0) >= 600}
                    />
                    <NutrientItem
                      label="Sat Fat"
                      value={`${product.nutritionPer100g.saturatedFatG ?? '--'} g`}
                      highlight={(product.nutritionPer100g.saturatedFatG ?? 0) >= 5}
                    />
                    <NutrientItem label="Fibre" value={`${product.nutritionPer100g.fibreG ?? '--'} g`} />
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* Add Product from Recent Scans Selector */}
        {products.length < 3 && recentScans.length > 0 && (
          <Card variant="default" style={styles.selectorCard}>
            <Text style={styles.selectorTitle}>➕ Add Product from Recent Scans</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.sm }}>
              {recentScans
                .filter((s) => !products.some((p) => p.id === s.productId))
                .map((scan) => (
                  <TouchableOpacity
                    key={scan.id}
                    style={styles.scanChip}
                    onPress={() => handleAddProduct(scan)}
                  >
                    <Text style={styles.scanChipText} numberOfLines={1}>
                      + {scan.productName}
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </Card>
        )}

        <MedicalDisclaimerBanner />
      </ScrollView>
    </View>
  );
}

function NutrientItem({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.nutrientRow}>
      <Text style={styles.nutrientLabel}>{label}:</Text>
      <Text style={[styles.nutrientVal, highlight && styles.nutrientHighlight]}>{value}</Text>
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
  content: {
    padding: spacing.md,
  },
  subTitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  winnerCard: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  winnerCardTitle: {
    ...typography.label,
    color: colors.primaryDark,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  winnerHighlightText: {
    ...typography.body,
    color: colors.textPrimary,
    marginVertical: 2,
    lineHeight: 20,
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  columnsScroll: {
    marginBottom: spacing.md,
  },
  columnCard: {
    width: 210,
    backgroundColor: colors.surfaceCard,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  winnerColumnCard: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: '#F0FDF4',
  },
  winnerBadgeContainer: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  winnerBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  removeBtnText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  productName: {
    ...typography.label,
    fontWeight: 'bold',
    color: colors.textPrimary,
    height: 38,
  },
  brandName: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: spacing.xs,
  },
  scoreNum: {
    ...typography.h2,
    fontSize: 28,
    color: colors.primary,
    fontWeight: 'bold',
  },
  scoreSub: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginLeft: 2,
  },
  allergenAlertBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    padding: 4,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  allergenAlertText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.error,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  table: {
    gap: 4,
  },
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  nutrientLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  nutrientVal: {
    ...typography.bodySmall,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  nutrientHighlight: {
    color: colors.error,
  },
  selectorCard: {
    marginBottom: spacing.md,
  },
  selectorTitle: {
    ...typography.label,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  scanChip: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    marginRight: spacing.sm,
    maxWidth: 160,
  },
  scanChipText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
});
