import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '@/components/common/Header';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { t } from '@/i18n';
import { api } from '@/services/api';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestCode = async () => {
    if (!email.trim()) {
      Alert.alert('Missing Email', 'Please enter your registered email address.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.forgotPassword(email.trim());
      if (res.resetCode) {
        setResetCode(res.resetCode); // Pre-fill for user convenience in dev/testing
      }
      Alert.alert(
        'Code Sent',
        res.resetCode
          ? `Verification code sent! (Demo Code: ${res.resetCode})`
          : 'A 6-digit verification code has been sent to your email.'
      );
      setStep('reset');
    } catch (err: any) {
      Alert.alert('Request Failed', err.message || 'Could not send verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim() || !resetCode.trim() || !newPassword) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Password Too Short', 'Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Password Mismatch', 'The passwords entered do not match.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.resetPassword({
        email: email.trim(),
        resetCode: resetCode.trim(),
        newPassword,
      });
      Alert.alert('Success', res.message || 'Your password has been reset successfully!', [
        {
          text: 'Go to Login',
          onPress: () => router.replace('/(auth)/login'),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Reset Failed', err.message || 'Invalid or expired code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Header title="Reset Password" showBack={true} />

      <ScrollView contentContainerStyle={styles.content}>
        <Card variant="elevated" style={styles.card}>
          {step === 'request' ? (
            <>
              <Text style={styles.headerTitle}>Forgot Password?</Text>
              <Text style={styles.headerSubtitle}>
                Enter your registered email address and we'll send you a 6-digit verification code to reset your password.
              </Text>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <Button
                title="Send Verification Code"
                size="lg"
                onPress={handleRequestCode}
                loading={isLoading}
                style={styles.actionBtn}
              />

              <TouchableOpacity
                onPress={() => setStep('reset')}
                style={styles.switchStepBtn}
              >
                <Text style={styles.switchStepText}>Already have a verification code? Tap here</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.headerTitle}>Enter New Password</Text>
              <Text style={styles.headerSubtitle}>
                Enter the 6-digit verification code sent to {email} and choose a new password.
              </Text>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>6-Digit Verification Code</Text>
                <TextInput
                  style={[styles.input, styles.codeInput]}
                  placeholder="e.g. 123456"
                  placeholderTextColor={colors.textSecondary}
                  value={resetCode}
                  onChangeText={setResetCode}
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>New Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="At least 6 characters"
                  placeholderTextColor={colors.textSecondary}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Confirm New Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter your new password"
                  placeholderTextColor={colors.textSecondary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>

              <Button
                title="Reset Password"
                size="lg"
                onPress={handleResetPassword}
                loading={isLoading}
                style={styles.actionBtn}
              />

              <TouchableOpacity
                onPress={() => setStep('request')}
                style={styles.switchStepBtn}
              >
                <Text style={styles.switchStepText}>← Request a new code</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Remember your password? </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.footerLink}>Log In</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    justifyContent: 'center',
    flexGrow: 1,
  },
  card: {
    padding: spacing.lg,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.textPrimary,
  },
  codeInput: {
    letterSpacing: 4,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  actionBtn: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  switchStepBtn: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  switchStepText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  footerText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  footerLink: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '700',
  },
});
