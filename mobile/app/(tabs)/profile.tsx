import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/services/api';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { MedicalDisclaimerBanner } from '@/components/common/DisclaimerBanner';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { t } from '@/i18n';
import { MASTER_HEALTH_CONDITIONS } from '@health-scanner/shared';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, logout, language, setAppLanguage } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(onboarding)/welcome');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account & Health Data',
      'This will permanently delete your account, health profile, and all scan history. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Permanently Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteAccount();
              logout();
              router.replace('/(onboarding)/welcome');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete account');
            }
          },
        },
      ]
    );
  };

  const conditionNames = (profile?.conditions || ['none'])
    .map((c) => {
      const match = MASTER_HEALTH_CONDITIONS.find((m) => m.code === c);
      return match ? (language === 'ml' ? match.nameMl : match.nameEn) : c;
    })
    .join(', ');

  return (
    <View style={styles.container}>
      <Header title={t('nav_profile')} showBack={false} />
      <ScrollView contentContainerStyle={styles.content}>
        {/* User Card */}
        <Card variant="elevated" style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{profile?.name || 'User'}</Text>
            <Text style={styles.userState}>
              {profile?.state || 'Kerala'}, {profile?.country || 'India'}
              {profile?.age ? ` • ${profile.age} yrs` : ''}
            </Text>
          </View>
        </Card>

        {/* Health Profile Section */}
        <Card variant="default" style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{t('my_health_profile')}</Text>
            <TouchableOpacity onPress={() => router.push('/(onboarding)/health-conditions')}>
              <Text style={styles.editLink}>{t('edit_profile')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Conditions:</Text>
            <Text style={styles.rowValue}>{conditionNames}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Preference:</Text>
            <Text style={styles.rowValue}>
              {profile?.dietaryPreferences?.join(', ') || 'None'}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Allergens:</Text>
            <Text
              style={[
                styles.rowValue,
                profile?.allergenRestrictions?.length ? { color: colors.notGoodText, fontWeight: '700' } : null,
              ]}
            >
              {profile?.allergenRestrictions?.length
                ? profile.allergenRestrictions.join(', ')
                : 'None marked'}
            </Text>
          </View>

          {profile?.medications && profile.medications.length > 0 && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Medicines:</Text>
              <Text style={styles.rowValue}>
                {profile.medications.map((m) => m.medicineName).join(', ')}
              </Text>
            </View>
          )}
        </Card>

        {/* Language Selection Card */}
        <Card variant="default" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('language_label')}</Text>
          <View style={styles.langToggleRow}>
            <TouchableOpacity
              onPress={() => setAppLanguage('en')}
              style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
            >
              <Text style={[styles.langBtnText, language === 'en' && styles.langBtnTextActive]}>
                English
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setAppLanguage('ml')}
              style={[styles.langBtn, language === 'ml' && styles.langBtnActive]}
            >
              <Text style={[styles.langBtnText, language === 'ml' && styles.langBtnTextActive]}>
                മലയാളം
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        <MedicalDisclaimerBanner />

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <Button
            title={t('logout')}
            variant="outline"
            onPress={handleLogout}
            style={styles.actionBtn}
          />
          <Button
            title={t('delete_account')}
            variant="danger"
            onPress={handleDeleteAccount}
            style={styles.actionBtn}
          />
        </View>
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
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    color: colors.textLight,
    fontSize: 22,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...typography.h2,
    fontSize: 18,
    color: colors.textPrimary,
  },
  userState: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionCard: {
    marginBottom: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    fontSize: 15,
    color: colors.textPrimary,
  },
  editLink: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    width: 90,
  },
  rowValue: {
    fontSize: 13,
    color: colors.textPrimary,
    flex: 1,
  },
  langToggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  langBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  langBtnActive: {
    backgroundColor: colors.goodBg,
    borderColor: colors.primary,
  },
  langBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  langBtnTextActive: {
    color: colors.goodText,
    fontWeight: '700',
  },
  actionsContainer: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  actionBtn: {},
});
