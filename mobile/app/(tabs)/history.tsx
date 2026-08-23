import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { t } from '@/i18n';
import { api } from '@/services/api';
import { ScanRecord } from '@health-scanner/shared';

export default function HistoryScreen() {
  const router = useRouter();
  const { language } = useAuthStore();
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const fetchHistory = async () => {
    try {
      const scans = await api.getScanHistory(50);
      setHistory(scans);
    } catch (err) {
      console.warn('Failed to load history', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

  const handleClearHistory = () => {
    if (history.length === 0) return;

    Alert.alert(
      'Clear Scan History?',
      'Are you sure you want to delete all past scan results? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsClearing(true);
              await api.clearScanHistory();
              setHistory([]);
              Alert.alert('History Cleared', 'All scan records have been removed.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to clear history.');
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: ScanRecord }) => {
    const dateFormatted = new Date(item.createdAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <Card
        variant="elevated"
        style={styles.card}
        onPress={() => router.push(`/result/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.productName} numberOfLines={1}>
              {item.productName}
            </Text>
            <Text style={styles.metaText}>
              {item.brand ? `${item.brand} • ` : ''}
              {dateFormatted}
            </Text>
          </View>
          <StatusBadge status={item.assessmentStatus} size="sm" />
        </View>

        {item.allergenWarnings.length > 0 && (
          <View style={styles.allergenAlertRow}>
            <Text style={styles.allergenAlertText}>
              ⚠️ {language === 'ml' ? item.allergenWarnings[0].messageMl : item.allergenWarnings[0].messageEn}
            </Text>
          </View>
        )}

        {item.reasons.length > 0 && (
          <Text style={styles.reasonText} numberOfLines={2}>
            • {language === 'ml' ? item.reasons[0].messageMl : item.reasons[0].messageEn}
          </Text>
        )}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Header title={t('nav_history')} showBack={false} />

      {/* Action Sub-header */}
      {history.length > 0 && (
        <View style={styles.subHeaderRow}>
          <Text style={styles.countText}>{history.length} Scanned Products</Text>
          <TouchableOpacity
            onPress={handleClearHistory}
            style={styles.clearBtn}
            disabled={isClearing}
          >
            <Text style={styles.clearBtnText}>🗑️ Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Card variant="default" style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No Scan History Yet</Text>
            <Text style={styles.emptySubtitle}>
              Your supermarket scan results will be saved here for easy reference.
            </Text>
            <Button
              title={t('nav_scan')}
              onPress={() => router.push('/(tabs)/scan')}
              style={styles.scanBtn}
            />
          </Card>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  subHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  countText: {
    ...typography.bodySmall,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  clearBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceMuted,
  },
  clearBtnText: {
    ...typography.bodySmall,
    fontSize: 12,
    fontWeight: '700',
    color: colors.error,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    marginBottom: spacing.sm + 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  productName: {
    ...typography.h3,
    fontSize: 15,
    color: colors.textPrimary,
  },
  metaText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 1,
  },
  allergenAlertRow: {
    backgroundColor: colors.notGoodBg,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: borderRadius.sm,
    marginVertical: 4,
  },
  allergenAlertText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.notGoodText,
  },
  reasonText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.xl,
    marginTop: spacing.xl,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  scanBtn: {
    minWidth: 160,
  },
});
