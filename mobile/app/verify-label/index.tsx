import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Header } from '@/components/common/Header';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { t } from '@/i18n';
import { api, getPendingImages } from '@/services/api';
import { OpenFoodFactsSubmitter } from '@/services/off-submitter';
import { NutritionValues } from '@health-scanner/shared';
import { NonFoodDetectedModal } from '@/components/scanner/NonFoodDetectedModal';

export default function VerifyLabelScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    isEdibleFood?: string;
    barcode?: string;
    productName?: string;
    brand?: string;
    category?: string;
    servingSize?: string;
    energyKcal?: string;
    carbohydratesG?: string;
    sugarsG?: string;
    addedSugarsG?: string;
    proteinG?: string;
    fatG?: string;
    saturatedFatG?: string;
    transFatG?: string;
    fibreG?: string;
    sodiumMg?: string;
    ingredientsText?: string;
    rawImagesJson?: string;
  }>();

  const isEdible = params.isEdibleFood !== 'false';
  const barcode = params.barcode || '';
  const [productName, setProductName] = useState(params.productName || (isEdible ? 'Captured Packaged Product' : 'Non-Food Item'));
  const [brand, setBrand] = useState(params.brand || (isEdible ? 'Supermarket Brand' : 'Personal Care / Household'));
  const [category, setCategory] = useState(params.category || (isEdible ? 'Packaged Food' : 'Personal Care'));
  const [servingSize, setServingSize] = useState(params.servingSize || '');

  const [energyKcal, setEnergyKcal] = useState(params.energyKcal || '');
  const [carbohydratesG, setCarbohydratesG] = useState(params.carbohydratesG || '');
  const [sugarsG, setSugarsG] = useState(params.sugarsG || '');
  const [addedSugarsG, setAddedSugarsG] = useState(params.addedSugarsG || '');
  const [proteinG, setProteinG] = useState(params.proteinG || '');
  const [fatG, setFatG] = useState(params.fatG || '');
  const [saturatedFatG, setSaturatedFatG] = useState(params.saturatedFatG || '');
  const [transFatG, setTransFatG] = useState(params.transFatG || '');
  const [fibreG, setFibreG] = useState(params.fibreG || '');
  const [sodiumMg, setSodiumMg] = useState(params.sodiumMg || '');

  const [ingredientsText, setIngredientsText] = useState(params.ingredientsText || '');
  const [contributeToOFF, setContributeToOFF] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNonFoodModal, setShowNonFoodModal] = useState(!isEdible);

  const parseNum = (val: string): number | null => {
    if (!val || val.trim() === '' || isNaN(Number(val))) return null;
    return Number(val);
  };

  const handleConfirmAndAnalyze = async () => {
    if (!productName.trim()) {
      Alert.alert('Required Field', 'Please enter a product name.');
      return;
    }

    try {
      setIsSubmitting(true);

      const nutrition: NutritionValues = {
        energyKcal: parseNum(energyKcal),
        carbohydratesG: parseNum(carbohydratesG),
        sugarsG: parseNum(sugarsG),
        addedSugarsG: parseNum(addedSugarsG),
        proteinG: parseNum(proteinG),
        fatG: parseNum(fatG),
        saturatedFatG: parseNum(saturatedFatG),
        transFatG: parseNum(transFatG),
        fibreG: parseNum(fibreG),
        sodiumMg: parseNum(sodiumMg),
      };

      const ingredientsList = ingredientsText
        .split(/[,;\n]/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      const customProductData = {
        name: productName.trim(),
        brand: brand.trim(),
        category: category.trim(),
        servingSize: servingSize.trim() || undefined,
        nutrition,
        ingredientsList,
        ingredientsText: ingredientsText.trim(),
      };

      // 1. Evaluate locally on-device & navigate to result immediately (0ms delay)
      const evalResult = await api.evaluateProduct({
        barcode: barcode || undefined,
        customProduct: customProductData,
        scanType: 'ocr_label',
      });

      // 2. Trigger asynchronous background contribution to OpenFoodFacts if checked
      if (contributeToOFF && barcode) {
        const rawImages = getPendingImages();

        OpenFoodFactsSubmitter.submitProductToOpenFoodFacts({
          barcode,
          productName: productName.trim(),
          brand: brand.trim(),
          category: category.trim(),
          servingSize: servingSize.trim(),
          ingredientsText: ingredientsText.trim(),
          nutrition,
          imagesBase64: rawImages,
        }).catch((err) => console.warn('OpenFoodFacts background submission log:', err));
      }

      router.replace(`/result/${evalResult.scanId}`);
    } catch (err: any) {
      Alert.alert('Analysis Failed', err.message || 'Could not process label verification');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Verify Extracted Data"
        subtitle="Review AI vision results & confirm accuracy"
        showBack
      />

      <ScrollView contentContainerStyle={styles.content}>
        {!isEdible ? (
          <Card variant="default" style={styles.nonFoodCard}>
            <Text style={styles.nonFoodTitle}>⚠️ Non-Food Item Detected</Text>
            <Text style={styles.nonFoodText}>
              This product was identified as a non-food item (e.g. toothpaste, personal care, or household item). Dietary nutrition rules apply to edible foods and beverages.
            </Text>
          </Card>
        ) : null}

        {/* Verification Note Banner */}
        <Card variant="default" style={styles.noteCard}>
          <Text style={styles.noteTitle}>🔍 Verification Step</Text>
          <Text style={styles.noteText}>
            Gemini AI Vision has extracted the label below. Please verify the numbers and tap **Confirm & Analyze**.
          </Text>
        </Card>

        {/* Basic Product Info */}
        <Card variant="default" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Product Details</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Product Name *</Text>
            <TextInput
              style={styles.input}
              value={productName}
              onChangeText={setProductName}
              placeholder="e.g. Parle Hide & Seek Biscuits"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Brand</Text>
            <TextInput
              style={styles.input}
              value={brand}
              onChangeText={setBrand}
              placeholder="e.g. Parle"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Serving Size (optional)</Text>
            <TextInput
              style={styles.input}
              value={servingSize}
              onChangeText={setServingSize}
              placeholder="e.g. 30g or 250ml"
            />
          </View>
        </Card>

        {/* Nutrition Values (Per 100g) */}
        <Card variant="default" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Nutrition Facts (Per 100g / 100ml)</Text>

          <View style={styles.rowTwoCols}>
            <View style={styles.colInput}>
              <Text style={styles.label}>Energy (kcal)</Text>
              <TextInput style={styles.input} value={energyKcal} onChangeText={setEnergyKcal} keyboardType="numeric" placeholder="—" />
            </View>
            <View style={styles.colInput}>
              <Text style={styles.label}>Carbohydrates (g)</Text>
              <TextInput style={styles.input} value={carbohydratesG} onChangeText={setCarbohydratesG} keyboardType="numeric" placeholder="—" />
            </View>
          </View>

          <View style={styles.rowTwoCols}>
            <View style={styles.colInput}>
              <Text style={styles.label}>Total Sugars (g)</Text>
              <TextInput style={styles.input} value={sugarsG} onChangeText={setSugarsG} keyboardType="numeric" placeholder="—" />
            </View>
            <View style={styles.colInput}>
              <Text style={styles.label}>Added Sugars (g)</Text>
              <TextInput style={styles.input} value={addedSugarsG} onChangeText={setAddedSugarsG} keyboardType="numeric" placeholder="—" />
            </View>
          </View>

          <View style={styles.rowTwoCols}>
            <View style={styles.colInput}>
              <Text style={styles.label}>Total Fat (g)</Text>
              <TextInput style={styles.input} value={fatG} onChangeText={setFatG} keyboardType="numeric" placeholder="—" />
            </View>
            <View style={styles.colInput}>
              <Text style={styles.label}>Saturated Fat (g)</Text>
              <TextInput style={styles.input} value={saturatedFatG} onChangeText={setSaturatedFatG} keyboardType="numeric" placeholder="—" />
            </View>
          </View>

          <View style={styles.rowTwoCols}>
            <View style={styles.colInput}>
              <Text style={styles.label}>Trans Fat (g)</Text>
              <TextInput style={styles.input} value={transFatG} onChangeText={setTransFatG} keyboardType="numeric" placeholder="—" />
            </View>
            <View style={styles.colInput}>
              <Text style={styles.label}>Protein (g)</Text>
              <TextInput style={styles.input} value={proteinG} onChangeText={setProteinG} keyboardType="numeric" placeholder="—" />
            </View>
          </View>

          <View style={styles.rowTwoCols}>
            <View style={styles.colInput}>
              <Text style={styles.label}>Sodium (mg)</Text>
              <TextInput style={styles.input} value={sodiumMg} onChangeText={setSodiumMg} keyboardType="numeric" placeholder="—" />
            </View>
            <View style={styles.colInput}>
              <Text style={styles.label}>Dietary Fibre (g)</Text>
              <TextInput style={styles.input} value={fibreG} onChangeText={setFibreG} keyboardType="numeric" placeholder="—" />
            </View>
          </View>
        </Card>

        {/* Ingredients Text */}
        <Card variant="default" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Ingredients List</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={ingredientsText}
            onChangeText={setIngredientsText}
            placeholder="e.g. Wheat flour, sugar, palm oil, cocoa solids, milk solids..."
            multiline
            numberOfLines={4}
          />
        </Card>

        {/* OpenFoodFacts Crowdsourcing Option */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setContributeToOFF(!contributeToOFF)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, contributeToOFF && styles.checkboxActive]}>
            {contributeToOFF ? <Text style={styles.checkmark}>✓</Text> : null}
          </View>
          <Text style={styles.checkboxLabel}>
            Contribute product data anonymously to OpenFoodFacts to help other shoppers in India.
          </Text>
        </TouchableOpacity>

        <Button
          title={isSubmitting ? 'Analyzing & Saving...' : '✓ Confirm, Analyze & View Assessment'}
          size="lg"
          onPress={handleConfirmAndAnalyze}
          disabled={isSubmitting}
          style={styles.submitBtn}
        />

        <TouchableOpacity
          style={styles.notFoodBtn}
          onPress={() => setShowNonFoodModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.notFoodBtnText}>🛑 Not a Food Product? (Toothpaste / Cosmetics / Soap)</Text>
        </TouchableOpacity>
      </ScrollView>

      <NonFoodDetectedModal
        visible={showNonFoodModal}
        productName={productName}
        brand={brand}
        category={category}
        onClose={() => {
          setShowNonFoodModal(false);
          router.replace('/(tabs)/scan');
        }}
      />
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
  },
  nonFoodCard: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    marginBottom: spacing.md,
  },
  nonFoodTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 4,
  },
  nonFoodText: {
    fontSize: 13,
    color: '#78350f',
    lineHeight: 18,
  },
  noteCard: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    marginBottom: spacing.md,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 13,
    color: '#1e3a8a',
    lineHeight: 18,
  },
  sectionCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 4,
    fontSize: 14,
    color: colors.textPrimary,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  colInput: {
    flex: 1,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  checkboxActive: {
    backgroundColor: colors.primary,
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  submitBtn: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  notFoodBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: '#fff1f2',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#fecdd3',
    marginBottom: spacing.xl,
  },
  notFoodBtnText: {
    color: '#be123c',
    fontSize: 13,
    fontWeight: '700',
  },
});
