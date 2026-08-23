import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Header } from '@/components/common/Header';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { t } from '@/i18n';
import { api } from '@/services/api';
import { DEMO_PRESETS, DemoProductPreset } from '@/services/demo-products';

export default function ScanScreen() {
  const router = useRouter();
  const [scanMode, setScanMode] = useState<'barcode' | 'ocr'>('barcode');
  const [manualBarcode, setManualBarcode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);

  // Reset scan debounce when changing modes
  useEffect(() => {
    setHasScanned(false);
  }, [scanMode]);

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (hasScanned || isProcessing || !result.data) return;
    setHasScanned(true);
    processBarcodeScan(result.data);
  };

  const processBarcodeScan = async (barcode: string) => {
    if (!barcode.trim()) return;
    setIsProcessing(true);
    try {
      // Lookup product by barcode
      const lookup = await api.lookupBarcode(barcode.trim());
      if (lookup.found && lookup.product) {
        // Evaluate product against user's profile
        const evalResult = await api.evaluateProduct({
          productId: lookup.product.id,
          barcode: lookup.product.barcode || barcode.trim(),
          scanType: 'barcode',
        });
        router.push(`/result/${evalResult.scanId}`);
      } else {
        // Barcode not found -> Suggest OCR Label Scan
        Alert.alert(
          'Product Not in Catalog',
          `Barcode ${barcode} is not in our database yet. Would you like to photograph the nutrition label for AI analysis?`,
          [
            {
              text: 'Try Another Barcode',
              style: 'cancel',
              onPress: () => setHasScanned(false),
            },
            {
              text: 'Scan Nutrition Label',
              onPress: () => {
                setScanMode('ocr');
                setHasScanned(false);
              },
            },
          ]
        );
      }
    } catch (err: any) {
      Alert.alert('Scan Failed', err.message || 'Could not process scan');
      setHasScanned(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const captureAndAnalyzeLabel = async () => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      let base64Image: string | null = null;

      if (cameraRef.current && cameraRef.current.takePictureAsync) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          base64: true,
        });
        if (photo?.base64) {
          base64Image = photo.base64;
        }
      }

      if (!base64Image) {
        // Fallback to ImagePicker if camera ref not ready (e.g. on web or simulator)
        const pickerRes = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          base64: true,
          quality: 0.5,
        });
        if (!pickerRes.canceled && pickerRes.assets[0]?.base64) {
          base64Image = pickerRes.assets[0].base64;
        }
      }

      if (!base64Image) {
        setIsProcessing(false);
        return;
      }

      // Send to OCR extraction endpoint
      const ocrRes = await api.extractLabelNutrition(base64Image);
      const customData = {
        name: ocrRes.data.productName || 'Captured Food Product',
        brand: ocrRes.data.brand || 'Supermarket Product',
        nutrition: ocrRes.data.nutrition,
        ingredientsList: ocrRes.data.ingredients,
        detectedAllergens: ocrRes.data.allergens,
      };

      const evalResult = await api.evaluateProduct({
        customProduct: customData,
        scanType: 'ocr_label',
      });
      router.push(`/result/${evalResult.scanId}`);
    } catch (err: any) {
      Alert.alert('OCR Label Failed', err.message || 'Failed to analyze nutrition label');
    } finally {
      setIsProcessing(false);
    }
  };

  const pickImageFromGallery = async () => {
    try {
      setIsProcessing(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0]?.base64) {
        const ocrRes = await api.extractLabelNutrition(result.assets[0].base64);
        const customData = {
          name: ocrRes.data.productName || 'Imported Label Product',
          brand: ocrRes.data.brand || 'Supermarket Product',
          nutrition: ocrRes.data.nutrition,
          ingredientsList: ocrRes.data.ingredients,
          detectedAllergens: ocrRes.data.allergens,
        };

        const evalResult = await api.evaluateProduct({
          customProduct: customData,
          scanType: 'ocr_label',
        });
        router.push(`/result/${evalResult.scanId}`);
      }
    } catch (err: any) {
      Alert.alert('Gallery Import Failed', err.message || 'Could not import label image');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={scanMode === 'barcode' ? t('scan_barcode_title') : t('scan_label_title')}
        subtitle={scanMode === 'barcode' ? t('scan_barcode_hint') : t('scan_label_hint')}
        showBack={false}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Mode Selector Toggle */}
        <View style={styles.modeToggleContainer}>
          <TouchableOpacity
            onPress={() => setScanMode('barcode')}
            style={[styles.modeBtn, scanMode === 'barcode' && styles.modeBtnActive]}
          >
            <Text style={[styles.modeText, scanMode === 'barcode' && styles.modeTextActive]}>
              📱 Live Barcode
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setScanMode('ocr')}
            style={[styles.modeBtn, scanMode === 'ocr' && styles.modeBtnActive]}
          >
            <Text style={[styles.modeText, scanMode === 'ocr' && styles.modeTextActive]}>
              📷 Label Photo OCR
            </Text>
          </TouchableOpacity>
        </View>

        {/* Live Camera Viewfinder Frame */}
        <Card variant="elevated" style={styles.cameraContainerCard}>
          {!permission ? (
            <View style={styles.permissionBox}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.permissionText}>Checking camera access...</Text>
            </View>
          ) : !permission.granted ? (
            <View style={styles.permissionBox}>
              <Text style={styles.permissionIcon}>📷</Text>
              <Text style={styles.permissionTitle}>Camera Permission Required</Text>
              <Text style={styles.permissionDesc}>
                We need access to your camera to scan barcodes and photograph nutrition panels in supermarkets.
              </Text>
              <Button
                title="Enable Camera Access"
                size="sm"
                onPress={requestPermission}
                style={styles.permissionBtn}
              />
            </View>
          ) : (
            <View style={styles.cameraViewport}>
              <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFillObject}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: [
                    'ean13',
                    'ean8',
                    'upc_a',
                    'upc_e',
                    'code128',
                    'code39',
                    'code93',
                    'itf14',
                    'qr',
                    'pdf417',
                    'aztec',
                    'datamatrix',
                  ],
                }}
                onBarcodeScanned={scanMode === 'barcode' && !hasScanned && !isProcessing ? handleBarcodeScanned : undefined}
              />

              {/* Viewfinder Reticle Overlay */}
              <View style={styles.reticleOverlay} pointerEvents="none">
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />

                {isProcessing ? (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={colors.primaryLight} />
                    <Text style={styles.loadingText}>
                      {scanMode === 'barcode' ? 'Evaluating product...' : 'Extracting nutrition facts...'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.reticleCenter}>
                    {hasScanned && scanMode === 'barcode' ? (
                      <View style={styles.scannedBadge}>
                        <Text style={styles.scannedText}>✓ Scanned! Loading...</Text>
                      </View>
                    ) : (
                      <Text style={styles.reticleHint}>
                        {scanMode === 'barcode'
                          ? 'Point camera at barcode'
                          : 'Frame nutrition table & ingredients'}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </View>
          )}
        </Card>

        {/* Action Controls for OCR Mode */}
        {scanMode === 'ocr' && (
          <View style={styles.ocrActionsRow}>
            <Button
              title="📸 Snap Nutrition Label"
              size="lg"
              onPress={captureAndAnalyzeLabel}
              loading={isProcessing}
              style={{ flex: 1 }}
            />
            <Button
              title="🖼️ Gallery"
              variant="outline"
              size="lg"
              onPress={pickImageFromGallery}
              disabled={isProcessing}
              style={{ marginLeft: spacing.sm }}
            />
          </View>
        )}

        {/* Barcode Manual Entry */}
        {scanMode === 'barcode' && (
          <Card variant="default" style={styles.manualCard}>
            <Text style={styles.cardHeader}>Manual Barcode Entry</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.barcodeInput}
                placeholder="Enter 13-digit EAN (e.g. 8901030000010)"
                value={manualBarcode}
                onChangeText={setManualBarcode}
                keyboardType="numeric"
              />
              <Button
                title="Scan"
                size="sm"
                onPress={() => processBarcodeScan(manualBarcode)}
                loading={isProcessing}
              />
            </View>
          </Card>
        )}

        {/* Supermarket Demo Presets for Quick Testing */}
        <View style={styles.demoSection}>
          <Text style={styles.demoTitle}>Supermarket Products (Instant Test):</Text>
          <View style={styles.demoGrid}>
            {DEMO_PRESETS.map((p: DemoProductPreset) => (
              <TouchableOpacity
                key={p.id}
                onPress={() => processBarcodeScan(p.barcode)}
                style={styles.demoChip}
                disabled={isProcessing}
              >
                <Text style={styles.demoChipName} numberOfLines={1}>
                  {p.name}
                </Text>
                <Text style={styles.demoChipBrand}>{p.brand} • {p.category}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: borderRadius.lg,
    padding: 4,
    marginBottom: spacing.md,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  modeBtnActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  modeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modeTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  cameraContainerCard: {
    padding: 0,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
    backgroundColor: '#000',
  },
  cameraViewport: {
    width: '100%',
    height: 280,
    position: 'relative',
    backgroundColor: '#000',
  },
  permissionBox: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220,
    backgroundColor: colors.surface,
  },
  permissionText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  permissionIcon: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  permissionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  permissionDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  permissionBtn: {
    marginTop: spacing.xs,
  },
  reticleOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: colors.primaryLight,
  },
  topLeft: {
    top: 20,
    left: 20,
    borderTopWidth: 3.5,
    borderLeftWidth: 3.5,
  },
  topRight: {
    top: 20,
    right: 20,
    borderTopWidth: 3.5,
    borderRightWidth: 3.5,
  },
  bottomLeft: {
    bottom: 20,
    left: 20,
    borderBottomWidth: 3.5,
    borderLeftWidth: 3.5,
  },
  bottomRight: {
    bottom: 20,
    right: 20,
    borderBottomWidth: 3.5,
    borderRightWidth: 3.5,
  },
  reticleCenter: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: borderRadius.full,
  },
  reticleHint: {
    ...typography.bodySmall,
    color: colors.textLight,
    fontWeight: '600',
    fontSize: 12,
  },
  scannedBadge: {
    backgroundColor: colors.goodBg,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: borderRadius.full,
  },
  scannedText: {
    color: colors.goodText,
    fontWeight: '700',
    fontSize: 13,
  },
  loadingOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  loadingText: {
    ...typography.bodySmall,
    color: colors.textLight,
    marginTop: spacing.sm,
    fontWeight: '600',
  },
  ocrActionsRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  manualCard: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    ...typography.h3,
    fontSize: 14,
    marginBottom: spacing.sm,
    color: colors.textPrimary,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  barcodeInput: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: borderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 14,
  },
  demoSection: {
    marginTop: spacing.sm,
  },
  demoTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs + 2,
  },
  demoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
  },
  demoChip: {
    width: '48%',
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  demoChipName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  demoChipBrand: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
