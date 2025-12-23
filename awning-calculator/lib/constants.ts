// Product categories for Universal Awning Company
export const PRODUCT_CATEGORIES = [
  'Fabric Awning',
  'Metal Awning',
  'Cantilevered Canopy',
  'IN-N-OUT',
  'Hip Roof Canopy',
  'Roof Balcony Cover',
  'Alum Canopies',
  'Steel Trellis',
  'Fabric Panel',
  'Tent',
  'Permits & Engineering',
  'Steel Canopies',
  'Other',
  'Curtains',
  'Patio Awning',
  "Umbrella's",
  'Sail Shade',
  'Retractables',
  'Bahama Style',
  'Car Port',
  'Recover Retractables',
  'Slidewire',
  'Screens',
  'Repairs',
  'Pergola covers',
  'Skylight Cover',
  '4k Trellis',
  'Recover',
  'Greenscreen',
  'Survey',
  'Pergola',
  'Valance',
  'Change Order',
  'Standing Seam',
  'Louvered Awning',
  '4K Canopy',
  'Cabanas',
  'Cushions',
  'Take Down',
  'Aluminum Trellis'
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
