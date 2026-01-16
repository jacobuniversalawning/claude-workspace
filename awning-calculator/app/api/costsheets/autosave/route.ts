import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// POST /api/costsheets/autosave - Silently auto-save a cost sheet (create or update)
export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json();

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

    const estimatorName = body.estimator || userName;

    // If an ID is provided, update the existing cost sheet
    if (body.id) {
      // Check if the cost sheet exists and belongs to the user
      const existingCostSheet = await prisma.costSheet.findFirst({
        where: {
          id: body.id,
          userId,
          deletedAt: null,
        },
      });

      if (!existingCostSheet) {
        return NextResponse.json(
          { error: 'Cost sheet not found' },
          { status: 404 }
        );
      }

      // Update the draft with partial data
      const costSheet = await prisma.costSheet.update({
        where: { id: body.id },
        data: {
          estimator: estimatorName,
          inquiryDate: body.inquiryDate ? new Date(body.inquiryDate) : undefined,
          dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
          category: body.category,
          customer: body.customer,
          salesRep: body.salesRep,
          project: body.project,
          jobSite: body.jobSite,
          width: body.width,
          projection: body.projection,
          height: body.height,
          valance: body.valance,
          canopySqFt: body.canopySqFt,
          awningLinFt: body.awningLinFt,
          miscQty: body.miscQty,
          miscPrice: body.miscPrice,
          salesTax: body.salesTax,
          laborRate: body.laborRate,
          totalMaterials: body.totalMaterials,
          totalFabric: body.totalFabric,
          totalFabricationLabor: body.totalFabricationLabor,
          totalInstallationLabor: body.totalInstallationLabor,
          totalLabor: body.totalLabor,
          subtotalBeforeMarkup: body.subtotalBeforeMarkup,
          markup: body.markup,
          totalWithMarkup: body.totalWithMarkup,
          permitCost: body.permitCost,
          engineeringCost: body.engineeringCost,
          equipmentCost: body.equipmentCost,
          driveTimeTrips: body.driveTimeTrips,
          driveTimeHours: body.driveTimeHours,
          driveTimePeople: body.driveTimePeople,
          driveTimeRate: body.driveTimeRate,
          driveTimeTotal: body.driveTimeTotal,
          roundtripMiles: body.roundtripMiles,
          roundtripTrips: body.roundtripTrips,
          mileageRate: body.mileageRate,
          mileageTotal: body.mileageTotal,
          hotelNights: body.hotelNights,
          hotelPeople: body.hotelPeople,
          hotelRate: body.hotelRate,
          hotelTotal: body.hotelTotal,
          foodCost: body.foodCost,
          totalOtherRequirements: body.totalOtherRequirements,
          totalWithOtherReqs: body.totalWithOtherReqs,
          grandTotal: body.grandTotal,
          discountIncrease: body.discountIncrease,
          totalPriceToClient: body.totalPriceToClient,
          pricePerSqFt: body.pricePerSqFt,
          pricePerLinFt: body.pricePerLinFt,
          pricePerSqFtPreDelivery: body.pricePerSqFtPreDelivery,
          pricePerLinFtPreDelivery: body.pricePerLinFtPreDelivery,
          outcome: body.outcome,
        },
        include: {
          materials: true,
          fabricLines: true,
          laborLines: true,
          recapLines: true,
        },
      });

      // Update related data if provided
      if (body.materials !== undefined) {
        // Delete existing materials and create new ones
        await prisma.materialLine.deleteMany({
          where: { costSheetId: body.id },
        });
        if (body.materials.length > 0) {
          await prisma.materialLine.createMany({
            data: body.materials.map((m: any) => ({
              ...m,
              costSheetId: body.id,
            })),
          });
        }
      }

      if (body.fabricLines !== undefined) {
        await prisma.fabricLine.deleteMany({
          where: { costSheetId: body.id },
        });
        if (body.fabricLines.length > 0) {
          await prisma.fabricLine.createMany({
            data: body.fabricLines.map((f: any) => ({
              ...f,
              costSheetId: body.id,
            })),
          });
        }
      }

      if (body.laborLines !== undefined) {
        await prisma.laborLine.deleteMany({
          where: { costSheetId: body.id },
        });
        if (body.laborLines.length > 0) {
          await prisma.laborLine.createMany({
            data: body.laborLines.map((l: any) => ({
              ...l,
              costSheetId: body.id,
            })),
          });
        }
      }

      if (body.recapLines !== undefined) {
        await prisma.recapLine.deleteMany({
          where: { costSheetId: body.id },
        });
        if (body.recapLines.length > 0) {
          await prisma.recapLine.createMany({
            data: body.recapLines.map((r: any) => ({
              ...r,
              costSheetId: body.id,
            })),
          });
        }
      }

      // Fetch the updated cost sheet with all relations
      const updatedCostSheet = await prisma.costSheet.findUnique({
        where: { id: body.id },
        include: {
          materials: true,
          fabricLines: true,
          laborLines: true,
          recapLines: true,
        },
      });

      return NextResponse.json(updatedCostSheet);
    }

    // Create a new cost sheet (saved silently in background)
    const costSheet = await prisma.costSheet.create({
      data: {
        userId,
        status: 'FINAL', // Save as regular cost sheet, not draft
        estimator: estimatorName,
        inquiryDate: body.inquiryDate ? new Date(body.inquiryDate) : new Date(),
        dueDate: body.dueDate ? new Date(body.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 7 days from now
        category: body.category || '',
        customer: body.customer,
        salesRep: body.salesRep,
        project: body.project,
        jobSite: body.jobSite,
        width: body.width,
        projection: body.projection,
        height: body.height,
        valance: body.valance,
        canopySqFt: body.canopySqFt,
        awningLinFt: body.awningLinFt,
        miscQty: body.miscQty,
        miscPrice: body.miscPrice,
        salesTax: body.salesTax ?? 0.0975,
        laborRate: body.laborRate ?? 95.00,
        totalMaterials: body.totalMaterials ?? 0,
        totalFabric: body.totalFabric ?? 0,
        totalFabricationLabor: body.totalFabricationLabor ?? 0,
        totalInstallationLabor: body.totalInstallationLabor ?? 0,
        totalLabor: body.totalLabor ?? 0,
        subtotalBeforeMarkup: body.subtotalBeforeMarkup ?? 0,
        markup: body.markup ?? 0.8,
        totalWithMarkup: body.totalWithMarkup ?? 0,
        permitCost: body.permitCost,
        engineeringCost: body.engineeringCost,
        equipmentCost: body.equipmentCost,
        driveTimeTrips: body.driveTimeTrips,
        driveTimeHours: body.driveTimeHours,
        driveTimePeople: body.driveTimePeople,
        driveTimeRate: body.driveTimeRate ?? 75.00,
        driveTimeTotal: body.driveTimeTotal ?? 0,
        roundtripMiles: body.roundtripMiles,
        roundtripTrips: body.roundtripTrips,
        mileageRate: body.mileageRate ?? 0.75,
        mileageTotal: body.mileageTotal ?? 0,
        hotelNights: body.hotelNights,
        hotelPeople: body.hotelPeople,
        hotelRate: body.hotelRate,
        hotelTotal: body.hotelTotal ?? 0,
        foodCost: body.foodCost,
        totalOtherRequirements: body.totalOtherRequirements ?? 0,
        totalWithOtherReqs: body.totalWithOtherReqs ?? 0,
        grandTotal: body.grandTotal ?? 0,
        discountIncrease: body.discountIncrease ?? 0,
        totalPriceToClient: body.totalPriceToClient ?? 0,
        pricePerSqFt: body.pricePerSqFt,
        pricePerLinFt: body.pricePerLinFt,
        pricePerSqFtPreDelivery: body.pricePerSqFtPreDelivery,
        pricePerLinFtPreDelivery: body.pricePerLinFtPreDelivery,
        outcome: body.outcome ?? 'Unknown',
        materials: {
          create: body.materials || [],
        },
        fabricLines: {
          create: body.fabricLines || [],
        },
        laborLines: {
          create: body.laborLines || [],
        },
        recapLines: {
          create: body.recapLines || [],
        },
      },
      include: {
        materials: true,
        fabricLines: true,
        laborLines: true,
        recapLines: true,
      },
    });

    return NextResponse.json(costSheet, { status: 201 });
  } catch (error) {
    console.error('Error auto-saving cost sheet:', error);
    return NextResponse.json(
      { error: 'Failed to auto-save cost sheet' },
      { status: 500 }
    );
  }
}
