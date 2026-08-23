import { randomUUID } from 'crypto';
import { getDb } from '../../db';
import {
  UserProfile,
  UpdateProfileSchema,
  UpdateHealthProfileSchema,
  HealthConditionCode,
  DietaryPreferenceCode,
  AllergenRestrictionCode,
  MASTER_HEALTH_CONDITIONS,
  MASTER_DIETARY_PREFERENCES,
  MASTER_ALLERGENS,
  MANDATORY_MEDICAL_DISCLAIMER_EN,
  MANDATORY_MEDICAL_DISCLAIMER_ML,
} from '@health-scanner/shared';

export class UserService {
  private db = getDb();

  getMasterData() {
    return {
      healthConditions: MASTER_HEALTH_CONDITIONS,
      dietaryPreferences: MASTER_DIETARY_PREFERENCES,
      allergens: MASTER_ALLERGENS,
      disclaimer: {
        en: MANDATORY_MEDICAL_DISCLAIMER_EN,
        ml: MANDATORY_MEDICAL_DISCLAIMER_ML,
      },
    };
  }

  getProfile(userId: string): UserProfile {
    const profileRow = this.db.tables.user_profiles.find((p) => p.user_id === userId);

    if (!profileRow) {
      throw new Error('User profile not found.');
    }

    const conditionsRows = this.db.tables.user_health_conditions.filter((c) => c.user_id === userId);
    const restrictionsRows = this.db.tables.user_restrictions.filter((r) => r.user_id === userId);
    const medicationsRows = this.db.tables.user_medications.filter((m) => m.user_id === userId);

    const conditions = conditionsRows.map((r) => r.condition_code as HealthConditionCode);

    const dietaryPreferences: DietaryPreferenceCode[] = [];
    const allergenRestrictions: AllergenRestrictionCode[] = [];
    const customRestrictions: string[] = [];

    const allergenCodes = new Set(MASTER_ALLERGENS.map((a) => a.code as string));
    const preferenceCodes = new Set(MASTER_DIETARY_PREFERENCES.map((p) => p.code as string));

    for (const r of restrictionsRows) {
      if (r.restriction_code) {
        if (allergenCodes.has(r.restriction_code)) {
          allergenRestrictions.push(r.restriction_code as AllergenRestrictionCode);
        } else if (preferenceCodes.has(r.restriction_code)) {
          dietaryPreferences.push(r.restriction_code as DietaryPreferenceCode);
        }
      }
      if (r.custom_text) {
        customRestrictions.push(r.custom_text);
      }
    }

    return {
      id: profileRow.id,
      userId: profileRow.user_id,
      name: profileRow.name,
      age: profileRow.age ?? undefined,
      gender: (profileRow.gender as any) ?? undefined,
      heightCm: profileRow.height_cm ?? undefined,
      weightKg: profileRow.weight_kg ?? undefined,
      country: profileRow.country || 'India',
      state: profileRow.state || 'Kerala',
      languagePreference: (profileRow.language_preference as 'en' | 'ml') || 'en',
      disclaimerAcknowledged: Boolean(profileRow.disclaimer_acknowledged),
      disclaimerAcknowledgedAt: profileRow.disclaimer_acknowledged_at ?? undefined,
      conditions: conditions.length > 0 ? conditions : ['none'],
      dietaryPreferences: dietaryPreferences.length > 0 ? dietaryPreferences : ['none'],
      allergenRestrictions,
      customRestrictions,
      medications: medicationsRows.map((m) => ({
        id: m.id,
        medicineName: m.medicine_name,
        dosage: m.dosage || undefined,
        frequency: m.frequency || undefined,
      })),
      createdAt: profileRow.created_at,
      updatedAt: profileRow.updated_at,
    };
  }

  updateBasicProfile(userId: string, data: any) {
    const validated = UpdateProfileSchema.parse(data);
    const profile = this.db.tables.user_profiles.find((p) => p.user_id === userId);

    if (!profile) {
      throw new Error('User profile not found.');
    }

    if (validated.name !== undefined) profile.name = validated.name;
    if (validated.age !== undefined) profile.age = validated.age;
    if (validated.gender !== undefined) profile.gender = validated.gender;
    if (validated.heightCm !== undefined) profile.height_cm = validated.heightCm;
    if (validated.weightKg !== undefined) profile.weight_kg = validated.weightKg;
    if (validated.country !== undefined) profile.country = validated.country;
    if (validated.state !== undefined) profile.state = validated.state;
    if (validated.languagePreference !== undefined) profile.language_preference = validated.languagePreference;

    profile.updated_at = new Date().toISOString();
    this.db.save();

    return this.getProfile(userId);
  }

  updateHealthProfile(userId: string, data: any) {
    const validated = UpdateHealthProfileSchema.parse(data);
    const now = new Date().toISOString();

    // 1. Update Health Conditions
    this.db.tables.user_health_conditions = this.db.tables.user_health_conditions.filter((c) => c.user_id !== userId);
    for (const cond of validated.conditions) {
      this.db.tables.user_health_conditions.push({
        id: randomUUID(),
        user_id: userId,
        condition_code: cond,
        created_at: now,
      });
    }

    // 2. Update Dietary Restrictions & Allergens
    this.db.tables.user_restrictions = this.db.tables.user_restrictions.filter((r) => r.user_id !== userId);

    for (const pref of validated.dietaryPreferences) {
      this.db.tables.user_restrictions.push({
        id: randomUUID(),
        user_id: userId,
        restriction_code: pref,
        custom_text: null,
        created_at: now,
      });
    }

    for (const allergen of validated.allergenRestrictions) {
      this.db.tables.user_restrictions.push({
        id: randomUUID(),
        user_id: userId,
        restriction_code: allergen,
        custom_text: null,
        created_at: now,
      });
    }

    if (validated.customRestrictions) {
      for (const custom of validated.customRestrictions) {
        if (custom.trim()) {
          this.db.tables.user_restrictions.push({
            id: randomUUID(),
            user_id: userId,
            restriction_code: null,
            custom_text: custom.trim(),
            created_at: now,
          });
        }
      }
    }

    // 3. Update Medications (Stored for record, not evaluated for food-med interaction in MVP)
    if (validated.medications !== undefined) {
      this.db.tables.user_medications = this.db.tables.user_medications.filter((m) => m.user_id !== userId);
      for (const med of validated.medications) {
        if (med.medicineName.trim()) {
          this.db.tables.user_medications.push({
            id: randomUUID(),
            user_id: userId,
            medicine_name: med.medicineName.trim(),
            dosage: med.dosage || null,
            frequency: med.frequency || null,
            created_at: now,
          });
        }
      }
    }

    // 4. Update Disclaimer Acknowledgment
    if (validated.disclaimerAcknowledged) {
      const profile = this.db.tables.user_profiles.find((p) => p.user_id === userId);
      if (profile) {
        profile.disclaimer_acknowledged = 1;
        profile.disclaimer_acknowledged_at = now;
        profile.updated_at = now;
      }
    }

    this.db.save();
    return this.getProfile(userId);
  }

  acknowledgeDisclaimer(userId: string) {
    const profile = this.db.tables.user_profiles.find((p) => p.user_id === userId);
    if (profile) {
      profile.disclaimer_acknowledged = 1;
      profile.disclaimer_acknowledged_at = new Date().toISOString();
      profile.updated_at = new Date().toISOString();
      this.db.save();
    }

    return { success: true, acknowledged: true };
  }

  deleteAccount(userId: string) {
    this.db.tables.users = this.db.tables.users.filter((u) => u.id !== userId);
    this.db.tables.user_profiles = this.db.tables.user_profiles.filter((p) => p.user_id !== userId);
    this.db.tables.user_health_conditions = this.db.tables.user_health_conditions.filter((c) => c.user_id !== userId);
    this.db.tables.user_restrictions = this.db.tables.user_restrictions.filter((r) => r.user_id !== userId);
    this.db.tables.user_medications = this.db.tables.user_medications.filter((m) => m.user_id !== userId);
    this.db.tables.scan_results = this.db.tables.scan_results.filter((s) => s.user_id !== userId);
    this.db.tables.saved_products = this.db.tables.saved_products.filter((sp) => sp.user_id !== userId);

    this.db.save();
    return { success: true, message: 'Account and associated health data deleted successfully.' };
  }
}
