import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { Button } from '../common/Button';

interface NonFoodDetectedModalProps {
  visible: boolean;
  productName: string;
  brand?: string;
  category?: string;
  onClose: () => void;
}

export const NonFoodDetectedModal: React.FC<NonFoodDetectedModalProps> = ({
  visible,
  productName,
  brand,
  category,
  onClose,
}) => {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>🛑</Text>
          </View>

          <Text style={styles.title}>Non-Food Product Detected</Text>

          <View style={styles.productCard}>
            <Text style={styles.productName}>{productName || 'Personal Care Item'}</Text>
            {brand ? <Text style={styles.productBrand}>Brand: {brand}</Text> : null}
            <Text style={styles.productCategory}>Category: {category || 'Non-Edible Household / Personal Care'}</Text>
          </View>

          <Text style={styles.message}>
            This product is identified as a non-food item (e.g., toothpaste, soap, cosmetics, or household product).
          </Text>
          <Text style={styles.subMessage}>
            AI Health Scanner evaluates edible packaged foods and beverages for human dietary health profiles (diabetes, hypertension, allergens). Non-food items are not eligible for health scoring or Open Food Facts.
          </Text>

          <Button
            title="📱 Scan a Food Product"
            size="lg"
            onPress={onClose}
            style={styles.actionBtn}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  dialog: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fef2f2',
    borderWidth: 2,
    borderColor: '#fecaca',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconText: {
    fontSize: 28,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  productCard: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 2,
  },
  productBrand: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  message: {
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
    lineHeight: 20,
    fontWeight: '600',
  },
  subMessage: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 17,
  },
  actionBtn: {
    width: '100%',
  },
});
