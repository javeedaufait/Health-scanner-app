import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useAuthStore } from '../../store/auth.store';
import { getLanguage } from '../../i18n';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  showLanguageToggle?: boolean;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  showLanguageToggle = true,
  rightAction,
}) => {
  const router = useRouter();
  const { setAppLanguage, language } = useAuthStore();

  const toggleLanguage = () => {
    const nextLang = language === 'en' ? 'ml' : 'en';
    setAppLanguage(nextLang);
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {showBack && (
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        )}

        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        <View style={styles.actionsContainer}>
          {showLanguageToggle && (
            <TouchableOpacity
              onPress={toggleLanguage}
              style={styles.langBadge}
              activeOpacity={0.7}
            >
              <Text style={styles.langText}>
                {language === 'en' ? 'മലയാളം' : 'English'}
              </Text>
            </TouchableOpacity>
          )}
          {rightAction}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  backIcon: {
    fontSize: 22,
    color: colors.primary,
    fontWeight: '700',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  langBadge: {
    backgroundColor: colors.goodBg,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.goodBorder,
  },
  langText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.goodText,
  },
});
