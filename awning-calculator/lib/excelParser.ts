import * as XLSX from 'xlsx';

// Types for parsed cost sheet data
export interface ParsedMaterial {
  description: string;
  length?: number;
  qty: number;
  unitPrice: number;
  salesTax: number;
  freight?: number;
  total: number;
}

export interface ParsedFabric {
  name: string;
  yards: number;
  pricePerYard: number;
  salesTax: number;
  freight?: number;
  total: number;
}

export interface ParsedLabor {
  type: string;
  hours: number;
  people: number;
  rate: number;
  total: number;
  isFabrication: boolean;
}

export interface ParsedRecapLine {
  name: string;
  width?: number;
  length?: number;
  fabricYard?: number;
  linearFt?: number;
  sqFt?: number;
}

export interface ParsedCostSheet {
  // Header Info
  inquiryDate: Date;
  dueDate: Date;
  customer: string;
  salesRep: string;
  project: string;
  category: string;
  jobSite: string;

  // Dimensions
  width?: number;
  projection?: number;
  height?: number;
  valance?: number;
  canopySqFt?: number;
  awningLinFt?: number;

  // Materials & Fabric & Labor
  materials: ParsedMaterial[];
  fabricLines: ParsedFabric[];
  laborLines: ParsedLabor[];
  recapLines: ParsedRecapLine[];

  // Calculated totals
  totalMaterials: number;
  totalFabric: number;
  totalFabricationLabor: number;
  totalInstallationLabor: number;
  totalLabor: number;
  subtotalBeforeMarkup: number;
  markup: number;
  totalWithMarkup: number;

  // Other Requirements
  permitCost?: number;
  engineeringCost?: number;
  equipmentCost?: number;
  driveTimeTrips?: number;
  driveTimeHours?: number;
  driveTimePeople?: number;
  driveTimeRate: number;
  driveTimeTotal: number;
  roundtripMiles?: number;
  roundtripTrips?: number;
  mileageRate: number;
  mileageTotal: number;
  hotelNights?: number;
  hotelPeople?: number;
  hotelRate?: number;
  hotelTotal: number;
  foodCost?: number;
  totalOtherRequirements: number;
  totalWithOtherReqs: number;

  // Final totals
  grandTotal: number;
  discountIncrease: number;
  totalPriceToClient: number;

  // Pricing metrics
  pricePerSqFt?: number;
  pricePerLinFt?: number;
  pricePerSqFtPreDelivery?: number;
  pricePerLinFtPreDelivery?: number;

  // Notes/Remarks
  notes?: string;
}

export interface ParseResult {
  success: boolean;
  data?: ParsedCostSheet;
  errors: string[];
  warnings: string[];
  fileName: string;
}

// Helper to safely get cell value
function getCellValue(worksheet: XLSX.WorkSheet, cellRef: string): string | number | null {
  const cell = worksheet[cellRef];
  return cell ? cell.v : null;
}

// Helper to find cell by content (for dynamic layouts)
function findCellByContent(worksheet: XLSX.WorkSheet, searchText: string, startRow: number = 1, endRow: number = 100): { row: number; col: number } | null {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:Z100');

  for (let row = startRow - 1; row <= Math.min(endRow - 1, range.e.r); row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
      const value = getCellValue(worksheet, cellRef);
      if (value && String(value).toLowerCase().includes(searchText.toLowerCase())) {
        return { row: row + 1, col: col + 1 }; // 1-indexed for easier use
      }
    }
  }
  return null;
}

// Helper to get value to the right of a label
function getValueAfterLabel(worksheet: XLSX.WorkSheet, label: string, defaultCol: number = 2): string | number | null {
  const labelCell = findCellByContent(worksheet, label);
  if (labelCell) {
    const valueRef = XLSX.utils.encode_cell({ r: labelCell.row - 1, c: labelCell.col });
    return getCellValue(worksheet, valueRef);
  }
  return null;
}

// Parse Excel date serial number to JS Date
function parseExcelDate(value: number | string | null): Date {
  if (!value) return new Date();

  if (typeof value === 'number') {
    // Excel serial date
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
  }

  if (typeof value === 'string') {
    // Try to parse string date
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
    // Try MM/DD/YY format
    const parts = value.split('/');
    if (parts.length === 3) {
      let year = parseInt(parts[2]);
      if (year < 100) year += 2000;
      return new Date(year, parseInt(parts[0]) - 1, parseInt(parts[1]));
    }
  }

  return new Date();
}

// Parse number safely
function parseNumber(value: string | number | null): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return value;

  // Remove currency symbols and commas
  const cleaned = String(value).replace(/[$,]/g, '').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// Map category from Excel to system categories
function mapCategory(excelCategory: string): string {
  const categoryMap: { [key: string]: string } = {
    'metal awning': 'Steel Awning',
    'steel awning': 'Steel Awning',
    'aluminum awning': 'Aluminum Canopy',
    'fabric awning': 'Patio Awning',
    'cantilevered': 'Cantilevered Canopy',
    'hip roof': 'Hip Roof Canopy',
    'trellis': 'Steel Trellis',
    'fabric panel': 'Fabric Panel',
    'curtain': 'Curtains',
    'patio': 'Patio Awning',
    'umbrella': 'Umbrellas',
    'sail': 'Sail Shades',
    'retractable': 'Motorized Retractable',
    'bahama': 'Bahama Style',
    'carport': 'Carport',
    'recover': 'Recover',
    'slidewire': 'Slidewire Manual',
    'screen': 'Motorized Screen',
    '4k': '4K Trellis',
    'green screen': 'Green Screen',
    'standing seam': 'Standing Seam Awning',
    'louvered': 'Aluminum Louvered Awning',
    'wall canopy': '4K Wall Canopy',
    'cabana': 'Cabanas',
  };

  const lowerCategory = excelCategory.toLowerCase();
  for (const [key, value] of Object.entries(categoryMap)) {
    if (lowerCategory.includes(key)) {
      return value;
    }
  }

  return 'Other';
}

// Main parsing function
export function parseExcelCostSheet(buffer: ArrayBuffer, fileName: string): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

    // Get the first sheet (cost sheet is typically on first sheet)
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    if (!worksheet) {
      return {
        success: false,
        errors: ['No worksheet found in the Excel file'],
        warnings: [],
        fileName
      };
    }

    // Parse header information
    // Based on the cost sheet structure from the images:
    // Row 1: Inquiry Date | blank | blank | DUE date
    // Row 2: Customer | name | blank | Sales Rep
    // Row 3: Project | name
    // Row 4: Category | name
    // Row 5: Job Site | address
    // Row 6: Width | value | Projection | value | blank | Canopy Sq Ft | value
    // Row 7: Height | value | Valance | value | blank | Awning Lin Ft | value

    // Try to find key labels and extract values
    const inquiryDateValue = getCellValue(worksheet, 'B1') || getCellValue(worksheet, 'C1');
    const dueDateValue = getCellValue(worksheet, 'E1') || getCellValue(worksheet, 'F1') || getCellValue(worksheet, 'G1');
    const customerValue = getCellValue(worksheet, 'B2') || getCellValue(worksheet, 'C2');
    const salesRepValue = getCellValue(worksheet, 'E2') || getCellValue(worksheet, 'F2') || getCellValue(worksheet, 'G2');
    const projectValue = getCellValue(worksheet, 'B3') || getCellValue(worksheet, 'C3');
    const categoryValue = getCellValue(worksheet, 'B4') || getCellValue(worksheet, 'C4');
    const jobSiteValue = getCellValue(worksheet, 'B5') || getCellValue(worksheet, 'C5');

    // Dimensions - Row 6 & 7
    const widthValue = getCellValue(worksheet, 'B6');
    const projectionValue = getCellValue(worksheet, 'D6');
    const canopySqFtValue = getCellValue(worksheet, 'G6') || getCellValue(worksheet, 'H6');
    const heightValue = getCellValue(worksheet, 'B7');
    const valanceValue = getCellValue(worksheet, 'D7');
    const awningLinFtValue = getCellValue(worksheet, 'G7') || getCellValue(worksheet, 'H7');

    // Initialize parsed data
    const parsedData: ParsedCostSheet = {
      inquiryDate: parseExcelDate(inquiryDateValue),
      dueDate: parseExcelDate(dueDateValue),
      customer: String(customerValue || ''),
      salesRep: String(salesRepValue || ''),
      project: String(projectValue || ''),
      category: mapCategory(String(categoryValue || '')),
      jobSite: String(jobSiteValue || ''),

      width: parseNumber(widthValue),
      projection: parseNumber(projectionValue),
      height: parseNumber(heightValue),
      valance: parseNumber(valanceValue),
      canopySqFt: parseNumber(canopySqFtValue),
      awningLinFt: parseNumber(awningLinFtValue),

      materials: [],
      fabricLines: [],
      laborLines: [],
      recapLines: [],

      totalMaterials: 0,
      totalFabric: 0,
      totalFabricationLabor: 0,
      totalInstallationLabor: 0,
      totalLabor: 0,
      subtotalBeforeMarkup: 0,
      markup: 0.8,
      totalWithMarkup: 0,

      driveTimeRate: 75,
      driveTimeTotal: 0,
      mileageRate: 0.75,
      mileageTotal: 0,
      hotelTotal: 0,
      totalOtherRequirements: 0,
      totalWithOtherReqs: 0,

      grandTotal: 0,
      discountIncrease: 0,
      totalPriceToClient: 0,
    };

    // Find section markers to parse data
    const materialsStart = findCellByContent(worksheet, 'Materials:(Metal', 1, 20);
    const fabricStart = findCellByContent(worksheet, 'Fabric', 1, 40) || findCellByContent(worksheet, 'Total Fabric', 1, 40);
    const laborStart = findCellByContent(worksheet, 'Labor Hours', 1, 50);
    const otherReqStart = findCellByContent(worksheet, 'Other Requirements', 1, 80);
    const recapStart = findCellByContent(worksheet, 'Recap of Canopies', 1, 100);

    // Parse Materials section
    if (materialsStart) {
      const startRow = materialsStart.row + 1; // Skip header
      const endRow = fabricStart ? fabricStart.row - 2 : startRow + 15;

      // Known material rows based on the image:
      const materialNames = [
        'IMS Aluminum',
        'Misc',
        'EMS metals texas canopy parts',
        'Arms steel',
        'Brackets steel for wall',
        'glass percision',
        'Piano hinges + rubber for glass',
        'Powder Coat'
      ];

      for (let row = startRow; row <= endRow; row++) {
        const descCell = getCellValue(worksheet, `A${row}`);
        const desc = String(descCell || '').trim();

        if (!desc || desc.toLowerCase().includes('total') || desc === '') continue;

        const qtyValue = getCellValue(worksheet, `B${row}`);
        const priceValue = getCellValue(worksheet, `C${row}`);
        const taxValue = getCellValue(worksheet, `D${row}`);
        const totalValue = getCellValue(worksheet, `G${row}`) || getCellValue(worksheet, `H${row}`);

        const qty = parseNumber(qtyValue);
        const price = parseNumber(priceValue);
        const total = parseNumber(totalValue);

        // Only add if we have some data
        if (qty > 0 || price > 0 || total > 0) {
          parsedData.materials.push({
            description: desc,
            qty: qty || 1,
            unitPrice: price,
            salesTax: parseNumber(taxValue) || 0.0975,
            total: total || (qty * price * 1.0975),
          });
        }
      }
    }

    // Parse Total Materials
    const totalMaterialsCell = findCellByContent(worksheet, 'Total Materials and Supplies');
    if (totalMaterialsCell) {
      const totalValue = getCellValue(worksheet, `H${totalMaterialsCell.row}`) ||
                         getCellValue(worksheet, `G${totalMaterialsCell.row}`);
      parsedData.totalMaterials = parseNumber(totalValue);
    }

    // Parse Fabric section
    if (fabricStart) {
      const startRow = fabricStart.row + 1;
      const endRow = laborStart ? laborStart.row - 2 : startRow + 5;

      for (let row = startRow; row <= endRow; row++) {
        const nameCell = getCellValue(worksheet, `A${row}`);
        const name = String(nameCell || '').trim();

        if (!name || name.toLowerCase().includes('total') || name === '' || name.toLowerCase().includes('graphics')) continue;
        if (!name.toLowerCase().includes('fabric')) continue;

        const yardsValue = getCellValue(worksheet, `B${row}`);
        const priceValue = getCellValue(worksheet, `C${row}`);
        const taxValue = getCellValue(worksheet, `D${row}`);
        const totalValue = getCellValue(worksheet, `G${row}`) || getCellValue(worksheet, `H${row}`);

        const yards = parseNumber(yardsValue);
        const price = parseNumber(priceValue);

        if (yards > 0 || price > 0) {
          parsedData.fabricLines.push({
            name: name,
            yards: yards,
            pricePerYard: price,
            salesTax: parseNumber(taxValue) || 0.0975,
            total: parseNumber(totalValue),
          });
        }
      }
    }

    // Parse Labor section
    if (laborStart) {
      const startRow = laborStart.row + 1;
      const endRow = otherReqStart ? otherReqStart.row - 5 : startRow + 15;

      // Known labor types and their fabrication status
      const laborTypeMap: { [key: string]: { type: string; isFabrication: boolean } } = {
        'survey': { type: 'Survey', isFabrication: true },
        'shop drawings': { type: 'Shop Drawings', isFabrication: true },
        'sewing': { type: 'Sewing', isFabrication: true },
        'graphics': { type: 'Graphics', isFabrication: true },
        'assembly': { type: 'Assembly', isFabrication: true },
        'welding': { type: 'Welding', isFabrication: true },
        'paint': { type: 'Paint Labor', isFabrication: true },
        'installation 1': { type: 'Installation 1', isFabrication: false },
        'installation 2': { type: 'Installation 2', isFabrication: false },
      };

      for (let row = startRow; row <= endRow; row++) {
        const typeCell = getCellValue(worksheet, `A${row}`);
        const typeStr = String(typeCell || '').trim().toLowerCase();

        if (!typeStr || typeStr.includes('total')) continue;

        // Find matching labor type
        let laborInfo = null;
        for (const [key, value] of Object.entries(laborTypeMap)) {
          if (typeStr.includes(key)) {
            laborInfo = value;
            break;
          }
        }

        if (!laborInfo) continue;

        const hoursValue = getCellValue(worksheet, `B${row}`);
        const peopleValue = getCellValue(worksheet, `C${row}`);
        const rateValue = getCellValue(worksheet, `E${row}`) || getCellValue(worksheet, `F${row}`);
        const totalValue = getCellValue(worksheet, `G${row}`) || getCellValue(worksheet, `H${row}`);

        const hours = parseNumber(hoursValue);
        const people = parseNumber(peopleValue) || 1;
        const rate = parseNumber(rateValue) || 95;
        const total = parseNumber(totalValue);

        if (hours > 0 || total > 0) {
          parsedData.laborLines.push({
            type: laborInfo.type,
            hours: hours,
            people: Math.round(people),
            rate: rate,
            total: total || (hours * people * rate),
            isFabrication: laborInfo.isFabrication,
          });
        }
      }
    }

    // Parse totals from labeled cells
    const totalFabLabor = findCellByContent(worksheet, 'Total Fabrication Labor');
    if (totalFabLabor) {
      const value = getCellValue(worksheet, `H${totalFabLabor.row}`) ||
                    getCellValue(worksheet, `G${totalFabLabor.row}`);
      parsedData.totalFabricationLabor = parseNumber(value);
    }

    const totalInstLabor = findCellByContent(worksheet, 'Total Installation Labor');
    if (totalInstLabor) {
      const value = getCellValue(worksheet, `H${totalInstLabor.row}`) ||
                    getCellValue(worksheet, `G${totalInstLabor.row}`);
      parsedData.totalInstallationLabor = parseNumber(value);
    }

    const totalLabor = findCellByContent(worksheet, 'Total Labor');
    if (totalLabor) {
      const value = getCellValue(worksheet, `H${totalLabor.row}`) ||
                    getCellValue(worksheet, `G${totalLabor.row}`);
      parsedData.totalLabor = parseNumber(value);
    }

    // Parse Other Requirements
    if (otherReqStart) {
      // Equipment
      const equipCell = findCellByContent(worksheet, 'Equipment:', otherReqStart.row, otherReqStart.row + 20);
      if (equipCell) {
        const value = getCellValue(worksheet, `G${equipCell.row}`) ||
                      getCellValue(worksheet, `H${equipCell.row}`);
        parsedData.equipmentCost = parseNumber(value);
      }

      // Drive Time
      const driveCell = findCellByContent(worksheet, 'Drive Time:', otherReqStart.row, otherReqStart.row + 20);
      if (driveCell) {
        parsedData.driveTimeTrips = Math.round(parseNumber(getCellValue(worksheet, `B${driveCell.row}`)));
        parsedData.driveTimeHours = parseNumber(getCellValue(worksheet, `C${driveCell.row}`));
        parsedData.driveTimePeople = Math.round(parseNumber(getCellValue(worksheet, `D${driveCell.row}`)));
        parsedData.driveTimeRate = parseNumber(getCellValue(worksheet, `E${driveCell.row}`)) || 75;
        parsedData.driveTimeTotal = parseNumber(getCellValue(worksheet, `G${driveCell.row}`) ||
                                                getCellValue(worksheet, `H${driveCell.row}`));
      }

      // Roundtrip Distance
      const mileageCell = findCellByContent(worksheet, 'Roundtrip Distance:', otherReqStart.row, otherReqStart.row + 20);
      if (mileageCell) {
        parsedData.roundtripMiles = parseNumber(getCellValue(worksheet, `B${mileageCell.row}`));
        parsedData.roundtripTrips = Math.round(parseNumber(getCellValue(worksheet, `C${mileageCell.row}`)));
        parsedData.mileageRate = parseNumber(getCellValue(worksheet, `D${mileageCell.row}`)) || 0.75;
        parsedData.mileageTotal = parseNumber(getCellValue(worksheet, `G${mileageCell.row}`) ||
                                              getCellValue(worksheet, `H${mileageCell.row}`));
      }

      // Hotel
      const hotelCell = findCellByContent(worksheet, 'Hotel:', otherReqStart.row, otherReqStart.row + 20);
      if (hotelCell) {
        parsedData.hotelNights = Math.round(parseNumber(getCellValue(worksheet, `B${hotelCell.row}`)));
        parsedData.hotelPeople = Math.round(parseNumber(getCellValue(worksheet, `C${hotelCell.row}`)));
        parsedData.hotelRate = parseNumber(getCellValue(worksheet, `D${hotelCell.row}`));
        parsedData.hotelTotal = parseNumber(getCellValue(worksheet, `G${hotelCell.row}`) ||
                                            getCellValue(worksheet, `H${hotelCell.row}`));
      }

      // Food
      const foodCell = findCellByContent(worksheet, 'Food:', otherReqStart.row, otherReqStart.row + 20);
      if (foodCell) {
        parsedData.foodCost = parseNumber(getCellValue(worksheet, `G${foodCell.row}`) ||
                                          getCellValue(worksheet, `H${foodCell.row}`));
      }
    }

    // Parse final totals
    const beforeMarkupCell = findCellByContent(worksheet, 'Total Materials, Fabric & Labor Before Markup');
    if (beforeMarkupCell) {
      const value = getCellValue(worksheet, `H${beforeMarkupCell.row}`) ||
                    getCellValue(worksheet, `G${beforeMarkupCell.row}`);
      parsedData.subtotalBeforeMarkup = parseNumber(value);
    }

    const withMarkupCell = findCellByContent(worksheet, 'Total Labor and Fabric Including Markup');
    if (withMarkupCell) {
      const value = getCellValue(worksheet, `H${withMarkupCell.row}`) ||
                    getCellValue(worksheet, `G${withMarkupCell.row}`);
      parsedData.totalWithMarkup = parseNumber(value);

      // Get markup value
      const markupValue = getCellValue(worksheet, `D${withMarkupCell.row}`) ||
                          getCellValue(worksheet, `E${withMarkupCell.row}`);
      parsedData.markup = parseNumber(markupValue) || 0.8;
    }

    const grandTotalCell = findCellByContent(worksheet, 'GRAND TOTAL');
    if (grandTotalCell) {
      const value = getCellValue(worksheet, `H${grandTotalCell.row}`) ||
                    getCellValue(worksheet, `G${grandTotalCell.row}`);
      parsedData.grandTotal = parseNumber(value);
    }

    const clientTotalCell = findCellByContent(worksheet, 'Total Price to Client');
    if (clientTotalCell) {
      const value = getCellValue(worksheet, `H${clientTotalCell.row}`) ||
                    getCellValue(worksheet, `G${clientTotalCell.row}`);
      parsedData.totalPriceToClient = parseNumber(value);
    }

    // Parse discount/increase notes
    const discountCell = findCellByContent(worksheet, 'Discount/Increase');
    if (discountCell) {
      // Get any notes in the row
      const notesValue = getCellValue(worksheet, `B${discountCell.row}`) ||
                         getCellValue(worksheet, `C${discountCell.row}`);
      if (notesValue && String(notesValue).length > 0) {
        parsedData.notes = String(notesValue);
      }
    }

    // Parse Recap section for multiple awnings
    if (recapStart) {
      const startRow = recapStart.row + 2; // Skip header rows

      for (let i = 0; i < 10; i++) {
        const row = startRow + i;
        const nameCell = getCellValue(worksheet, `A${row}`);
        const name = String(nameCell || '').trim();

        if (!name || !name.toLowerCase().includes('awning') && !name.toLowerCase().includes('canopy')) continue;
        if (name.toLowerCase() === 'total') break;

        const widthVal = parseNumber(getCellValue(worksheet, `B${row}`));
        const lengthVal = parseNumber(getCellValue(worksheet, `C${row}`));
        const fabricYardVal = parseNumber(getCellValue(worksheet, `D${row}`));
        const linearFtVal = parseNumber(getCellValue(worksheet, `E${row}`) || getCellValue(worksheet, `F${row}`));
        const sqFtVal = parseNumber(getCellValue(worksheet, `G${row}`) || getCellValue(worksheet, `H${row}`));

        if (widthVal > 0 || lengthVal > 0 || sqFtVal > 0) {
          parsedData.recapLines.push({
            name: name,
            width: widthVal || undefined,
            length: lengthVal || undefined,
            fabricYard: fabricYardVal || undefined,
            linearFt: linearFtVal || undefined,
            sqFt: sqFtVal || undefined,
          });
        }
      }
    }

    // Calculate price per sq ft and lin ft
    if (parsedData.canopySqFt && parsedData.canopySqFt > 0) {
      parsedData.pricePerSqFt = parsedData.totalPriceToClient / parsedData.canopySqFt;
      parsedData.pricePerSqFtPreDelivery = parsedData.totalWithMarkup / parsedData.canopySqFt;
    }

    if (parsedData.awningLinFt && parsedData.awningLinFt > 0) {
      parsedData.pricePerLinFt = parsedData.totalPriceToClient / parsedData.awningLinFt;
      parsedData.pricePerLinFtPreDelivery = parsedData.totalWithMarkup / parsedData.awningLinFt;
    }

    // Calculate other requirements total
    parsedData.totalOtherRequirements =
      (parsedData.permitCost || 0) +
      (parsedData.engineeringCost || 0) +
      (parsedData.equipmentCost || 0) +
      parsedData.driveTimeTotal +
      parsedData.mileageTotal +
      parsedData.hotelTotal +
      (parsedData.foodCost || 0);

    // If no grand total found, calculate it
    if (!parsedData.grandTotal && parsedData.totalWithMarkup > 0) {
      parsedData.grandTotal = parsedData.totalWithMarkup + (parsedData.totalOtherRequirements * (parsedData.markup || 0.8));
    }

    // If no client total, use grand total
    if (!parsedData.totalPriceToClient) {
      parsedData.totalPriceToClient = parsedData.grandTotal;
    }

    // Validate required fields
    if (!parsedData.customer && !parsedData.project) {
      warnings.push('No customer or project name found');
    }

    if (!parsedData.category || parsedData.category === 'Other') {
      warnings.push('Could not determine product category');
    }

    if (parsedData.totalPriceToClient === 0) {
      warnings.push('Total price to client is $0 - verify import data');
    }

    return {
      success: true,
      data: parsedData,
      errors,
      warnings,
      fileName
    };

  } catch (error) {
    return {
      success: false,
      errors: [`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: [],
      fileName
    };
  }
}

// Batch parse multiple files
export async function parseMultipleExcelFiles(files: File[]): Promise<ParseResult[]> {
  const results: ParseResult[] = [];

  for (const file of files) {
    try {
      const buffer = await file.arrayBuffer();
      const result = parseExcelCostSheet(buffer, file.name);
      results.push(result);
    } catch (error) {
      results.push({
        success: false,
        errors: [`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        fileName: file.name
      });
    }
  }

  return results;
}
