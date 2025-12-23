import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/costsheets/[id] - Get a single cost sheet
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const costSheet = await prisma.costSheet.findUnique({
      where: { id: params.id },
      include: {
        materials: true,
        fabricLines: true,
        laborLines: true,
        recapLines: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!costSheet) {
      return NextResponse.json(
        { error: 'Cost sheet not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(costSheet);
  } catch (error) {
    console.error('Error fetching cost sheet:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cost sheet' },
      { status: 500 }
    );
  }
}

// PUT /api/costsheets/[id] - Update a cost sheet
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Delete existing related records
    await prisma.materialLine.deleteMany({
      where: { costSheetId: params.id },
    });
    await prisma.fabricLine.deleteMany({
      where: { costSheetId: params.id },
    });
    await prisma.laborLine.deleteMany({
      where: { costSheetId: params.id },
    });
    await prisma.recapLine.deleteMany({
      where: { costSheetId: params.id },
    });

    // Update cost sheet with new data
    const costSheet = await prisma.costSheet.update({
      where: { id: params.id },
      data: {
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

    return NextResponse.json(costSheet);
  } catch (error) {
    console.error('Error updating cost sheet:', error);
    return NextResponse.json(
      { error: 'Failed to update cost sheet' },
      { status: 500 }
    );
  }
}

// DELETE /api/costsheets/[id] - Delete a cost sheet
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.costSheet.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting cost sheet:', error);
    return NextResponse.json(
      { error: 'Failed to delete cost sheet' },
      { status: 500 }
    );
  }
}
