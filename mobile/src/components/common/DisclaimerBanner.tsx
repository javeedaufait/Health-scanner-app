import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, borderRadius, spacing, typography } from '../../theme';
import { t } from '../../i18n';

export const MedicalDisclaimerBanner: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  return (
    <View style={[styles.container, compact && styles.compact]}>
      <Text style={styles.icon}>ℹ️</Text>
      <Text style={styles.text}>{t('disclaimer_text')}</Text>
    </View>
  );
};

export const AllergenWarningBanner: React.FC<{ message: string; submessage?: string }> = ({
  message,
  submessage,
}) => {
  return (
    <View style={styles.allergenContainer}>
      <View style={styles.allergenHeader}>
        <Text style={styles.allergenIcon}>⚠️</Text>
        <Text style={styles.allergenTitle}>{t('allergen_alert_title').toUpperCase()}</Text>
      </View>
      <Text style={styles.allergenText}>{message}</Text>
      {submessage ? <Text style={styles.allergenSubtext}>{submessage}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f1f5f9',
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  compact: {
    padding: spacing.xs + 2,
  },
  icon: {
    fontSize: 14,
    marginRight: spacing.sm,
    marginTop: 1,
  },
  text: {
    flex: 1,
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  allergenContainer: {
    backgroundColor: colors.notGoodBg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginVertical: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.notGoodBorder,
  },
  allergenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  allergenIcon: {
    fontSize: 16,
    marginRight: spacing.xs + 2,
  },
  allergenTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.notGoodText,
    letterSpacing: 0.5,
  },
  allergenText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.notGoodText,
    lineHeight: 20,
  },
  allergenSubtext: {
    fontSize: 12,
    color: colors.notGoodText,
    marginTop: 4,
    opacity: 0.9,
  },
});
