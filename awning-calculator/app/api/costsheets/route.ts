import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { logActivity } from '@/lib/activityLogger';

// GET /api/costsheets - Get all cost sheets (excluding deleted)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const outcome = searchParams.get('outcome');
    const search = searchParams.get('search');
    const includeDeleted = searchParams.get('includeDeleted') === 'true';
    const includeDrafts = searchParams.get('includeDrafts') === 'true';
    const draftsOnly = searchParams.get('draftsOnly') === 'true';

    const where: Record<string, unknown> = {};

    // Exclude soft-deleted items unless specifically requested
    if (!includeDeleted) {
      where.deletedAt = null;
    } else {
      // Only show deleted items (for trash view)
      where.deletedAt = { not: null };
    }

    // Handle draft filtering
    if (draftsOnly) {
      // Only show drafts
      where.status = 'DRAFT';
    } else if (!includeDrafts) {
      // Exclude drafts by default (only show finalized cost sheets)
      where.status = 'FINAL';
    }
    // If includeDrafts is true, show both drafts and final

    if (category) {
      where.category = category;
    }

    if (outcome) {
      where.outcome = outcome;
    }

    if (search) {
      where.OR = [
        { customer: { contains: search, mode: 'insensitive' } },
        { project: { contains: search, mode: 'insensitive' } },
        { jobSite: { contains: search, mode: 'insensitive' } },
      ];
    }

    const costSheets = await prisma.costSheet.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
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
        deletedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(costSheets);
  } catch (error) {
    console.error('Error fetching cost sheets:', error);
    // Return empty array on error so the app still loads
    return NextResponse.json([]);
  }
}

// POST /api/costsheets - Create a new cost sheet
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

    // Set the estimator name from the logged-in user if not provided
    const estimatorName = body.estimator || userName;

    const costSheet = await prisma.costSheet.create({
      data: {
        userId,
        status: 'FINAL', // Mark as final when explicitly submitted
        estimator: estimatorName,
        inquiryDate: new Date(body.inquiryDate),
        dueDate: new Date(body.dueDate),
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
        salesTax: body.salesTax || 0.0975,
        laborRate: body.laborRate || 95.00,
        totalMaterials: body.totalMaterials || 0,
        totalFabric: body.totalFabric || 0,
        totalFabricationLabor: body.totalFabricationLabor || 0,
        totalInstallationLabor: body.totalInstallationLabor || 0,
        totalLabor: body.totalLabor || 0,
        subtotalBeforeMarkup: body.subtotalBeforeMarkup || 0,
        markup: body.markup || 0.8,
        totalWithMarkup: body.totalWithMarkup || 0,
        permitCost: body.permitCost,
        engineeringCost: body.engineeringCost,
        equipmentCost: body.equipmentCost,
        driveTimeTrips: body.driveTimeTrips,
        driveTimeHours: body.driveTimeHours,
        driveTimePeople: body.driveTimePeople,
        driveTimeRate: body.driveTimeRate || 75.00,
        driveTimeTotal: body.driveTimeTotal || 0,
        roundtripMiles: body.roundtripMiles,
        roundtripTrips: body.roundtripTrips,
        mileageRate: body.mileageRate || 0.75,
        mileageTotal: body.mileageTotal || 0,
        hotelNights: body.hotelNights,
        hotelPeople: body.hotelPeople,
        hotelRate: body.hotelRate,
        hotelTotal: body.hotelTotal || 0,
        foodCost: body.foodCost,
        totalOtherRequirements: body.totalOtherRequirements || 0,
        totalWithOtherReqs: body.totalWithOtherReqs || 0,
        grandTotal: body.grandTotal || 0,
        discountIncrease: body.discountIncrease || 0,
        totalPriceToClient: body.totalPriceToClient || 0,
        pricePerSqFt: body.pricePerSqFt,
        pricePerLinFt: body.pricePerLinFt,
        pricePerSqFtPreDelivery: body.pricePerSqFtPreDelivery,
        pricePerLinFtPreDelivery: body.pricePerLinFtPreDelivery,
        outcome: body.outcome || 'Unknown',
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

    // Log the creation activity
    await logActivity({
      action: 'created',
      userId,
      costSheetId: costSheet.id,
      description: `Created by ${userName}`,
      changes: {
        customer: body.customer,
        project: body.project,
        category: body.category,
      },
    });

    return NextResponse.json(costSheet, { status: 201 });
  } catch (error) {
    console.error('Error creating cost sheet:', error);
    return NextResponse.json(
      { error: 'Failed to create cost sheet' },
      { status: 500 }
    );
  }
}
