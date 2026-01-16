import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { logActivity } from '@/lib/activityLogger';
import { parseExcelCostSheet, ParseResult, ParsedCostSheet } from '@/lib/excelParser';

export interface ImportResult {
  success: boolean;
  fileName: string;
  costSheetId?: string;
  errors: string[];
  warnings: string[];
}

export interface ImportResponse {
  totalFiles: number;
  successful: number;
  failed: number;
  results: ImportResult[];
}

// POST /api/costsheets/import - Import cost sheets from Excel files
export async function POST(request: Request) {
  try {
    const session = await auth();

    // Get the authenticated user or create/find a temporary one
    let userId: string;
    let userName: string;

    if (session?.user?.id) {
      userId = session.user.id;
      userName = session.user.name || session.user.email || 'Unknown';
    } else {
      // Fallback for development/testing - use temp user
      const tempUserId = 'temp-user-1';
      let user = await prisma.user.findUnique({
        where: { id: tempUserId },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            id: tempUserId,
            email: 'temp@universalawning.com',
            name: 'Temporary User',
          },
        });
      }
      userId = user.id;
      userName = user.name || 'Temporary User';
    }

    // Parse the multipart form data
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    const results: ImportResult[] = [];

    for (const file of files) {
      // Validate file type
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/octet-stream', // Some browsers send this
      ];

      const fileExtension = file.name.toLowerCase().split('.').pop();
      const isValidExtension = fileExtension === 'xls' || fileExtension === 'xlsx';

      if (!isValidExtension) {
        results.push({
          success: false,
          fileName: file.name,
          errors: ['Invalid file type. Only .xls and .xlsx files are supported.'],
          warnings: [],
        });
        continue;
      }

      try {
        // Read file buffer
        const buffer = await file.arrayBuffer();

        // Parse the Excel file
        const parseResult: ParseResult = parseExcelCostSheet(buffer, file.name);

        if (!parseResult.success || !parseResult.data) {
          results.push({
            success: false,
            fileName: file.name,
            errors: parseResult.errors,
            warnings: parseResult.warnings,
          });
          continue;
        }

        const data: ParsedCostSheet = parseResult.data;

        // Create the cost sheet in the database
        const costSheet = await prisma.costSheet.create({
          data: {
            userId,
            status: 'FINAL',
            estimator: userName,
            inquiryDate: data.inquiryDate,
            dueDate: data.dueDate,
            category: data.category,
            customer: data.customer || undefined,
            salesRep: data.salesRep || undefined,
            project: data.project || undefined,
            jobSite: data.jobSite || undefined,
            width: data.width || undefined,
            projection: data.projection || undefined,
            height: data.height || undefined,
            valance: data.valance || undefined,
            canopySqFt: data.canopySqFt || undefined,
            awningLinFt: data.awningLinFt || undefined,
            salesTax: 0.0975,
            laborRate: 95.00,
            totalMaterials: data.totalMaterials,
            totalFabric: data.totalFabric,
            totalFabricationLabor: data.totalFabricationLabor,
            totalInstallationLabor: data.totalInstallationLabor,
            totalLabor: data.totalLabor,
            subtotalBeforeMarkup: data.subtotalBeforeMarkup,
            markup: data.markup,
            totalWithMarkup: data.totalWithMarkup,
            permitCost: data.permitCost || undefined,
            engineeringCost: data.engineeringCost || undefined,
            equipmentCost: data.equipmentCost || undefined,
            driveTimeTrips: data.driveTimeTrips || undefined,
            driveTimeHours: data.driveTimeHours || undefined,
            driveTimePeople: data.driveTimePeople || undefined,
            driveTimeRate: data.driveTimeRate,
            driveTimeTotal: data.driveTimeTotal,
            roundtripMiles: data.roundtripMiles || undefined,
            roundtripTrips: data.roundtripTrips || undefined,
            mileageRate: data.mileageRate,
            mileageTotal: data.mileageTotal,
            hotelNights: data.hotelNights || undefined,
            hotelPeople: data.hotelPeople || undefined,
            hotelRate: data.hotelRate || undefined,
            hotelTotal: data.hotelTotal,
            foodCost: data.foodCost || undefined,
            totalOtherRequirements: data.totalOtherRequirements,
            totalWithOtherReqs: data.totalWithOtherReqs,
            grandTotal: data.grandTotal,
            discountIncrease: data.discountIncrease,
            totalPriceToClient: data.totalPriceToClient,
            pricePerSqFt: data.pricePerSqFt || undefined,
            pricePerLinFt: data.pricePerLinFt || undefined,
            pricePerSqFtPreDelivery: data.pricePerSqFtPreDelivery || undefined,
            pricePerLinFtPreDelivery: data.pricePerLinFtPreDelivery || undefined,
            outcome: 'Unknown',
            materials: {
              create: data.materials.map((m) => ({
                description: m.description,
                length: m.length,
                qty: m.qty,
                unitPrice: m.unitPrice,
                salesTax: m.salesTax,
                freight: m.freight,
                total: m.total,
              })),
            },
            fabricLines: {
              create: data.fabricLines.map((f) => ({
                name: f.name,
                yards: f.yards,
                pricePerYard: f.pricePerYard,
                salesTax: f.salesTax,
                freight: f.freight,
                total: f.total,
              })),
            },
            laborLines: {
              create: data.laborLines.map((l) => ({
                type: l.type,
                hours: l.hours,
                people: l.people,
                rate: l.rate,
                total: l.total,
                isFabrication: l.isFabrication,
              })),
            },
            recapLines: {
              create: data.recapLines.map((r) => ({
                name: r.name,
                width: r.width,
                length: r.length,
                fabricYard: r.fabricYard,
                linearFt: r.linearFt,
                sqFt: r.sqFt,
              })),
            },
          },
          include: {
            materials: true,
            fabricLines: true,
            laborLines: true,
            recapLines: true,
          },
        });

        // Log the import activity
        await logActivity({
          action: 'imported',
          userId,
          costSheetId: costSheet.id,
          description: `Imported from ${file.name} by ${userName}`,
          changes: {
            source: 'excel_import',
            fileName: file.name,
            customer: data.customer,
            project: data.project,
            category: data.category,
          },
        });

        results.push({
          success: true,
          fileName: file.name,
          costSheetId: costSheet.id,
          errors: [],
          warnings: parseResult.warnings,
        });

      } catch (error) {
        console.error(`Error importing ${file.name}:`, error);
        results.push({
          success: false,
          fileName: file.name,
          errors: [`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`],
          warnings: [],
        });
      }
    }

    const response: ImportResponse = {
      totalFiles: files.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Error in import endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to import cost sheets' },
      { status: 500 }
    );
  }
}
