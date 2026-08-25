import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { Button } from '../common/Button';
import { t } from '../../i18n';

interface MultiPhotoCaptureModalProps {
  visible: boolean;
  barcode: string;
  onClose: () => void;
  onAnalyzePhotos: (base64Images: string[]) => void;
}

export const MultiPhotoCaptureModal: React.FC<MultiPhotoCaptureModalProps> = ({
  visible,
  barcode,
  onClose,
  onAnalyzePhotos,
}) => {
  const [photo1, setPhoto1] = useState<string | null>(null); // Front / Barcode
  const [photo2, setPhoto2] = useState<string | null>(null); // Nutrition Table
  const [photo3, setPhoto3] = useState<string | null>(null); // Ingredients List
  const [loading, setLoading] = useState(false);

  const takePhoto = async (slotSetter: (b64: string | null) => void) => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Camera Access', 'Camera permission is required to capture product label photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets[0]?.base64) {
        slotSetter(result.assets[0].base64);
      }
    } catch (err: any) {
      Alert.alert('Camera Error', err.message || 'Could not take photo');
    }
  };

  const pickFromGallery = async (slotSetter: (b64: string | null) => void) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets[0]?.base64) {
        slotSetter(result.assets[0].base64);
      }
    } catch (err: any) {
      Alert.alert('Gallery Error', err.message || 'Could not pick photo from gallery');
    }
  };

  const handleProceed = () => {
    const images = [photo1, photo2, photo3].filter(Boolean) as string[];
    if (images.length === 0) {
      Alert.alert('Photo Required', 'Please take at least one photo of the product label or nutrition table.');
      return;
    }
    onAnalyzePhotos(images);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Product Not In Catalog Yet</Text>
          <Text style={styles.subtitle}>
            Barcode: <Text style={styles.barcodeHighlight}>{barcode}</Text>
          </Text>
          <Text style={styles.desc}>
            Photograph the product packaging below. AI Vision will analyze the nutrition table and ingredients automatically.
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Photo Slot 1: Front / Barcode */}
          <View style={styles.slotCard}>
            <View style={styles.slotHeader}>
              <Text style={styles.slotTitle}>📷 1. Front / Barcode (Required)</Text>
              {photo1 ? <Text style={styles.checkedBadge}>✓ Captured</Text> : null}
            </View>
            {photo1 ? (
              <Image source={{ uri: `data:image/jpeg;base64,${photo1}` }} style={styles.previewImage} />
            ) : (
              <View style={styles.placeholderBox}>
                <Text style={styles.placeholderText}>No photo captured yet</Text>
              </View>
            )}
            <View style={styles.slotActions}>
              <TouchableOpacity style={styles.btnAction} onPress={() => takePhoto(setPhoto1)}>
                <Text style={styles.btnActionText}>Take Camera Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnActionSecondary} onPress={() => pickFromGallery(setPhoto1)}>
                <Text style={styles.btnActionSecondaryText}>From Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Photo Slot 2: Nutrition Facts Table */}
          <View style={styles.slotCard}>
            <View style={styles.slotHeader}>
              <Text style={styles.slotTitle}>📊 2. Nutrition Table (Recommended)</Text>
              {photo2 ? <Text style={styles.checkedBadge}>✓ Captured</Text> : null}
            </View>
            {photo2 ? (
              <Image source={{ uri: `data:image/jpeg;base64,${photo2}` }} style={styles.previewImage} />
            ) : (
              <View style={styles.placeholderBox}>
                <Text style={styles.placeholderText}>No photo captured yet</Text>
              </View>
            )}
            <View style={styles.slotActions}>
              <TouchableOpacity style={styles.btnAction} onPress={() => takePhoto(setPhoto2)}>
                <Text style={styles.btnActionText}>Take Camera Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnActionSecondary} onPress={() => pickFromGallery(setPhoto2)}>
                <Text style={styles.btnActionSecondaryText}>From Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Photo Slot 3: Ingredients List */}
          <View style={styles.slotCard}>
            <View style={styles.slotHeader}>
              <Text style={styles.slotTitle}>🌾 3. Ingredients List (Optional)</Text>
              {photo3 ? <Text style={styles.checkedBadge}>✓ Captured</Text> : null}
            </View>
            {photo3 ? (
              <Image source={{ uri: `data:image/jpeg;base64,${photo3}` }} style={styles.previewImage} />
            ) : (
              <View style={styles.placeholderBox}>
                <Text style={styles.placeholderText}>No photo captured yet</Text>
              </View>
            )}
            <View style={styles.slotActions}>
              <TouchableOpacity style={styles.btnAction} onPress={() => takePhoto(setPhoto3)}>
                <Text style={styles.btnActionText}>Take Camera Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnActionSecondary} onPress={() => pickFromGallery(setPhoto3)}>
                <Text style={styles.btnActionSecondaryText}>From Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Analyze Photos with AI Vision ➔"
            size="lg"
            onPress={handleProceed}
            disabled={!photo1 && !photo2 && !photo3}
            style={styles.proceedBtn}
          />
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.xl,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  barcodeHighlight: {
    fontWeight: '700',
    color: colors.primary,
  },
  desc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
  content: {
    padding: spacing.md,
  },
  slotCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  slotTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  checkedBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
  },
  previewImage: {
    width: '100%',
    height: 120,
    borderRadius: borderRadius.md,
    marginVertical: spacing.xs,
  },
  placeholderBox: {
    width: '100%',
    height: 60,
    backgroundColor: '#f1f5f9',
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  placeholderText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  slotActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  btnAction: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  btnActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  btnActionSecondary: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  btnActionSecondaryText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  proceedBtn: {
    marginBottom: spacing.sm,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  cancelText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
