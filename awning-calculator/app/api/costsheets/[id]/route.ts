import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { logActivity } from '@/lib/activityLogger';
import { isSuperAdmin, requireSuperAdmin } from '@/lib/permissions';

// GET /api/costsheets/[id] - Get a single cost sheet
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const costSheet = await prisma.costSheet.findUnique({
      where: { id },
      include: {
        materials: true,
        fabricLines: true,
        laborLines: true,
        recapLines: true,
        activityLogs: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;
    const body = await request.json();

    // Get user info for logging
    let userId: string;
    let userName: string;

    if (session?.user?.id) {
      userId = session.user.id;
      userName = session.user.name || session.user.email || 'Unknown';
    } else {
      // Fallback for development
      const tempUser = await prisma.user.findFirst({
        where: { email: 'temp@universalawning.com' },
      });
      userId = tempUser?.id || 'temp-user-1';
      userName = tempUser?.name || 'Temporary User';
    }

    // Get original cost sheet for comparison
    const original = await prisma.costSheet.findUnique({
      where: { id },
      select: {
        customer: true,
        project: true,
        category: true,
        grandTotal: true,
      },
    });

    // Delete existing related records
    await prisma.materialLine.deleteMany({
      where: { costSheetId: id },
    });
    await prisma.fabricLine.deleteMany({
      where: { costSheetId: id },
    });
    await prisma.laborLine.deleteMany({
      where: { costSheetId: id },
    });
    await prisma.recapLine.deleteMany({
      where: { costSheetId: id },
    });

    // Update cost sheet with new data
    const costSheet = await prisma.costSheet.update({
      where: { id },
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
        estimator: body.estimator,
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

    // Log the update activity
    await logActivity({
      action: 'updated',
      userId,
      costSheetId: id,
      description: `Updated by ${userName}`,
      changes: {
        previous: original,
        updated: {
          customer: body.customer,
          project: body.project,
          category: body.category,
          grandTotal: body.grandTotal,
        },
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

// DELETE /api/costsheets/[id] - Soft delete a cost sheet (move to trash)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';

    // Permanent delete requires super admin
    if (permanent) {
      const superAdminCheck = requireSuperAdmin(session);
      if (!superAdminCheck.authorized) {
        return NextResponse.json(
          { error: superAdminCheck.error },
          { status: superAdminCheck.status }
        );
      }
    }

    // Get user info for logging
    let userId: string;
    let userName: string;

    if (session?.user?.id) {
      userId = session.user.id;
      userName = session.user.name || session.user.email || 'Unknown';
    } else {
      const tempUser = await prisma.user.findFirst({
        where: { email: 'temp@universalawning.com' },
      });
      userId = tempUser?.id || 'temp-user-1';
      userName = tempUser?.name || 'Temporary User';
    }

    if (permanent) {
      // Permanent delete - actually remove from database (super admin only)
      await prisma.costSheet.delete({
        where: { id },
      });

      return NextResponse.json({ success: true, permanent: true });
    } else {
      // Soft delete - move to trash
      const costSheet = await prisma.costSheet.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedById: userId,
        },
      });

      // Log the deletion activity
      await logActivity({
        action: 'deleted',
        userId,
        costSheetId: id,
        description: `Moved to trash by ${userName}`,
      });

      return NextResponse.json({ success: true, deletedAt: costSheet.deletedAt });
    }
  } catch (error) {
    console.error('Error deleting cost sheet:', error);
    return NextResponse.json(
      { error: 'Failed to delete cost sheet' },
      { status: 500 }
    );
  }
}

// PATCH /api/costsheets/[id] - Restore a cost sheet from trash
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;
    const body = await request.json();

    // Check if this is a restore operation
    if (body.action === 'restore') {
      // Get user info for logging
      let userId: string;
      let userName: string;

      if (session?.user?.id) {
        userId = session.user.id;
        userName = session.user.name || session.user.email || 'Unknown';
      } else {
        const tempUser = await prisma.user.findFirst({
          where: { email: 'temp@universalawning.com' },
        });
        userId = tempUser?.id || 'temp-user-1';
        userName = tempUser?.name || 'Temporary User';
      }

      // Restore the cost sheet
      const costSheet = await prisma.costSheet.update({
        where: { id },
        data: {
          deletedAt: null,
          deletedById: null,
        },
      });

      // Log the restore activity
      await logActivity({
        action: 'restored',
        userId,
        costSheetId: id,
        description: `Restored from trash by ${userName}`,
      });

      return NextResponse.json({ success: true, restored: true, costSheet });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error patching cost sheet:', error);
    return NextResponse.json(
      { error: 'Failed to patch cost sheet' },
      { status: 500 }
    );
  }
}
