// Calculation utilities for cost sheet

export interface MaterialLineItem {
  qty: number;
  unitPrice: number;
  salesTax: number;
  freight?: number;
}

export interface FabricLineItem {
  yards: number;
  pricePerYard: number;
  salesTax: number;
  freight?: number;
}

export interface LaborLineItem {
  hours: number;
  people: number;
  rate: number;
}

export interface OtherRequirements {
  permitCost?: number;
  engineeringCost?: number;
  equipmentCost?: number;
  driveTimeTotal?: number;
  mileageTotal?: number;
  hotelTotal?: number;
  foodCost?: number;
}

/**
 * Calculate total for a material line item
 */
export function calculateMaterialTotal(item: MaterialLineItem): number {
  const subtotal = item.qty * item.unitPrice;
  const taxAmount = subtotal * item.salesTax;
  const freight = item.freight || 0;
  return subtotal + taxAmount + freight;
}

/**
 * Calculate total for a fabric line item
 */
export function calculateFabricTotal(item: FabricLineItem): number {
  const subtotal = item.yards * item.pricePerYard;
  const taxAmount = subtotal * item.salesTax;
  const freight = item.freight || 0;
  return subtotal + taxAmount + freight;
}

/**
 * Calculate total for a labor line item
 */
export function calculateLaborTotal(item: LaborLineItem): number {
  return item.hours * item.people * item.rate;
}

/**
 * Calculate drive time total
 */
export function calculateDriveTimeTotal(
  trips: number,
  hours: number,
  people: number,
  rate: number
): number {
  return trips * hours * people * rate;
}

/**
 * Calculate mileage total
 */
export function calculateMileageTotal(
  miles: number,
  trips: number,
  ratePerMile: number
): number {
  return miles * trips * ratePerMile;
}

/**
 * Calculate hotel total
 */
export function calculateHotelTotal(
  nights: number,
  people: number,
  ratePerNight: number
): number {
  return nights * people * ratePerNight;
}

/**
 * Calculate total of "Other Requirements" (site-specific costs)
 */
export function calculateOtherRequirementsTotal(reqs: OtherRequirements): number {
  return (
    (reqs.permitCost || 0) +
    (reqs.engineeringCost || 0) +
    (reqs.equipmentCost || 0) +
    (reqs.driveTimeTotal || 0) +
    (reqs.mileageTotal || 0) +
    (reqs.hotelTotal || 0) +
    (reqs.foodCost || 0)
  );
}

/**
 * Calculate price per square foot
 */
export function calculatePricePerSqFt(total: number, sqFt?: number): number | null {
  if (!sqFt || sqFt === 0) return null;
  return total / sqFt;
}

/**
 * Calculate price per linear foot
 */
export function calculatePricePerLinFt(total: number, linFt?: number): number | null {
  if (!linFt || linFt === 0) return null;
  return total / linFt;
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Round to 2 decimal places
 */
export function round2(num: number): number {
  return Math.round(num * 100) / 100;
}
