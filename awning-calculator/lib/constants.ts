// Product categories for Universal Awning Company (consolidated list)
export const PRODUCT_CATEGORIES = [
  'Steel Awning',
  'Cantilevered Canopy',
  'Hip Roof Canopy',
  'Aluminum Canopy',
  'Steel Trellis',
  'Aluminum Trellis',
  'Fabric Panel',
  'Curtains',
  'Patio Awning',
  'Umbrellas',
  'Sail Shades',
  'Motorized Retractable',
  'Manual Retractable',
  'Bahama Style',
  'Carport',
  'Recover',
  'Slidewire Manual',
  'Slidewire Motorized',
  'Motorized Screen',
  '4K Trellis',
  'Green Screen',
  'Standing Seam Awning',
  'Aluminum Louvered Awning',
  '4K Wall Canopy',
  'Cabanas',
  'Other'
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number];

// Labor types for the cost sheet
export const LABOR_TYPES = [
  'Survey',
  'Shop Drawings',
  'Sewing',
  'Graphics',
  'Assembly',
  'Welding',
  'Paint Labor',
  'Installation 1',
  'Installation 2'
] as const;

export type LaborType = typeof LABOR_TYPES[number];

// Labor rate options
export const LABOR_RATES = {
  AGGRESSIVE: 85,
  REGULAR: 95,
  PREVAILING_WAGE: 160
} as const;

// Default values
export const DEFAULTS = {
  SALES_TAX: 0.0975, // 9.75%
  MARKUP: 0.8, // 80%
  LABOR_RATE: LABOR_RATES.REGULAR,
  DRIVE_TIME_RATE: 75.00,
  MILEAGE_RATE: 0.75
} as const;

// Job outcomes for weighted averages
export const JOB_OUTCOMES = ['Won', 'Lost', 'Unknown'] as const;
export type JobOutcome = typeof JOB_OUTCOMES[number];
