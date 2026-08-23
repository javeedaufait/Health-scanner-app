import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/services/api';
import { Header } from '@/components/common/Header';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/Badge';
import { MedicalDisclaimerBanner } from '@/components/common/DisclaimerBanner';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { t } from '@/i18n';
import { ScanRecord, MASTER_HEALTH_CONDITIONS } from '@health-scanner/shared';

export default function HomeScreen() {
  const router = useRouter();
  const { profile, fetchProfile, language } = useAuthStore();
  const [recentScans, setRecentScans] = useState<ScanRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      await fetchProfile();
      const scans = await api.getScanHistory(5);
      setRecentScans(scans);
    } catch (err) {
      console.warn('Error loading home data', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Conditions display
  const conditionLabels = (profile?.conditions || ['none'])
    .map((c) => {
      const match = MASTER_HEALTH_CONDITIONS.find((m) => m.code === c);
      return match ? (language === 'ml' ? match.nameMl : match.nameEn) : c;
    })
    .join(', ');

  return (
    <View style={styles.container}>
      <Header
        title={t('app_name')}
        subtitle={`Welcome, ${profile?.name || 'Shopper'}`}
        showBack={false}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Primary Hero Scan CTA */}
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/scan')}
          activeOpacity={0.9}
          style={styles.heroScanCard}
        >
          <View style={styles.heroScanContent}>
            <View style={styles.scanIconCircle}>
              <Text style={styles.scanIconText}>📸</Text>
            </View>
            <View style={styles.heroTextContainer}>
              <Text style={styles.heroTitle}>{t('nav_scan').toUpperCase()}</Text>
              <Text style={styles.heroSubtitle}>
                Scan barcode or snap label in the aisle
              </Text>
            </View>
            <Text style={styles.heroArrow}>→</Text>
          </View>
        </TouchableOpacity>

        {/* My Health Profile Summary Card */}
        <Card variant="elevated" style={styles.profileSummaryCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>{t('my_health_profile')}</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
              <Text style={styles.editLink}>{t('edit_profile')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.profileDetailRow}>
            <Text style={styles.profileLabel}>Health Focus:</Text>
            <Text style={styles.profileValue} numberOfLines={2}>
              {conditionLabels || 'General Healthy'}
            </Text>
          </View>

          {profile?.allergenRestrictions && profile.allergenRestrictions.length > 0 && (
            <View style={styles.profileDetailRow}>
              <Text style={styles.profileLabel}>Allergens:</Text>
              <Text style={[styles.profileValue, { color: colors.notGoodText }]}>
                {profile.allergenRestrictions.join(', ')}
              </Text>
            </View>
          )}

          {profile?.dietaryPreferences && profile.dietaryPreferences[0] !== 'none' && (
            <View style={styles.profileDetailRow}>
              <Text style={styles.profileLabel}>Preference:</Text>
              <Text style={styles.profileValue}>
                {profile.dietaryPreferences.join(', ')}
              </Text>
            </View>
          )}
        </Card>

        {/* Recent Scans Section */}
        <View style={styles.recentSection}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionHeading}>{t('recent_scans')}</Text>
            {recentScans.length > 0 && (
              <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
                <Text style={styles.viewAllLink}>{t('view_all')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {recentScans.length === 0 ? (
            <Card variant="default" style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>{t('no_scans_yet')}</Text>
              <Button
                title={t('nav_scan')}
                size="sm"
                onPress={() => router.push('/(tabs)/scan')}
                style={styles.emptyScanBtn}
              />
            </Card>
          ) : (
            recentScans.map((scan) => (
              <Card
                key={scan.id}
                variant="elevated"
                style={styles.scanItemCard}
                onPress={() => router.push(`/result/${scan.id}`)}
              >
                <View style={styles.scanItemHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName} numberOfLines={1}>
                      {scan.productName}
                    </Text>
                    {scan.brand && <Text style={styles.brandName}>{scan.brand}</Text>}
                  </View>
                  <StatusBadge status={scan.assessmentStatus} size="sm" />
                </View>

                {scan.reasons.length > 0 && (
                  <Text style={styles.reasonSnippet} numberOfLines={1}>
                    • {language === 'ml' ? scan.reasons[0].messageMl : scan.reasons[0].messageEn}
                  </Text>
                )}
              </Card>
            ))
          )}
        </View>

        {/* Persistent Medical Disclaimer */}
        <MedicalDisclaimerBanner compact={true} />
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
  },
  heroScanCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.md + 4,
    marginBottom: spacing.md,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  heroScanContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanIconCircle: {
    width: 54,
    height: 54,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  scanIconText: {
    fontSize: 26,
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    ...typography.h2,
    color: colors.textLight,
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    ...typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  heroArrow: {
    fontSize: 24,
    color: colors.textLight,
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
  profileSummaryCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    ...typography.h3,
    fontSize: 15,
    color: colors.textPrimary,
  },
  editLink: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  profileDetailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  profileLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    width: 100,
  },
  profileValue: {
    fontSize: 13,
    color: colors.textPrimary,
    flex: 1,
  },
  recentSection: {
    marginVertical: spacing.sm,
  },
  sectionHeading: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  viewAllLink: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xl,
    marginVertical: spacing.xs,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  emptyScanBtn: {
    marginTop: spacing.xs,
  },
  scanItemCard: {
    marginBottom: spacing.sm,
  },
  scanItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productName: {
    ...typography.h3,
    fontSize: 15,
    color: colors.textPrimary,
  },
  brandName: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 1,
  },
  reasonSnippet: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs + 2,
  },
});
