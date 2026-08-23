import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { AssessmentStatus } from '@health-scanner/shared';
import { colors, borderRadius, typography, spacing } from '../../theme';
import { t } from '../../i18n';

interface BadgeProps {
  status: AssessmentStatus;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export const StatusBadge: React.FC<BadgeProps> = ({
  status,
  size = 'md',
  style,
}) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'GOOD_CHOICE':
        return {
          bg: colors.goodBg,
          border: colors.goodBorder,
          text: colors.goodText,
          icon: '🟢',
          label: t('good_choice'),
        };
      case 'USE_CAUTION':
        return {
          bg: colors.cautionBg,
          border: colors.cautionBorder,
          text: colors.cautionText,
          icon: '🟡',
          label: t('use_caution'),
        };
      case 'NOT_A_GOOD_CHOICE':
      default:
        return {
          bg: colors.notGoodBg,
          border: colors.notGoodBorder,
          text: colors.notGoodText,
          icon: '🔴',
          label: t('not_a_good_choice'),
        };
    }
  };

  const config = getBadgeStyle();

  return (
    <View
      style={[
        styles.base,
        { backgroundColor: config.bg, borderColor: config.border },
        size === 'lg' ? styles.sizeLg : size === 'sm' ? styles.sizeSm : styles.sizeMd,
        style,
      ]}
    >
      <Text style={styles.icon}>{config.icon}</Text>
      <Text
        style={[
          styles.label,
          { color: config.text },
          size === 'lg' ? styles.labelLg : size === 'sm' ? styles.labelSm : styles.labelMd,
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  sizeSm: {
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  sizeMd: {
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  sizeLg: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  icon: {
    marginRight: spacing.xs + 2,
    fontSize: 12,
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  labelSm: {
    fontSize: 11,
  },
  labelMd: {
    fontSize: 13,
  },
  labelLg: {
    fontSize: 16,
  },
});
