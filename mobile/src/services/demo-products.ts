export interface DemoProductPreset {
  id: string;
  barcode: string;
  name: string;
  brand: string;
  category: string;
}

export const DEMO_PRESETS: DemoProductPreset[] = [
  {
    id: 'prod-001',
    barcode: '8901030000010',
    name: 'Parle-G Glucose Biscuits',
    brand: 'Parle',
    category: 'Biscuits',
  },
  {
    id: 'prod-002',
    barcode: '8901063012345',
    name: 'Marie Gold Biscuits',
    brand: 'Britannia',
    category: 'Biscuits',
  },
  {
    id: 'prod-003',
    barcode: '8901058852278',
    name: 'Maggi 2-Minute Masala Noodles',
    brand: 'Nestlé',
    category: 'Instant Noodles',
  },
  {
    id: 'prod-004',
    barcode: '8901491101807',
    name: "Lay's India's Magic Masala Chips",
    brand: "Lay's",
    category: 'Snacks & Chips',
  },
  {
    id: 'prod-005',
    barcode: '8901207040125',
    name: 'Quaker Rolled Oats Whole Grain',
    brand: 'Quaker',
    category: 'Breakfast Cereals',
  },
  {
    id: 'prod-006',
    barcode: '8901262010019',
    name: 'Amul Taaza Homogenised Milk',
    brand: 'Amul',
    category: 'Dairy',
  },
  {
    id: 'prod-007',
    barcode: '8906093850123',
    name: 'Epigamia Natural Greek Yogurt',
    brand: 'Epigamia',
    category: 'Dairy',
  },
  {
    id: 'prod-010',
    barcode: '8901234567890',
    name: 'Acceptance Demo High-Sugar High-Sodium Snack',
    brand: 'Demo Brand',
    category: 'Snack Food',
  },
];
