import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// Helper to check if user can hard delete (SUPER_ADMIN or ADMIN only)
const canHardDelete = (role: string) => ['SUPER_ADMIN', 'ADMIN'].includes(role);

// GET /api/costsheets/trash - Get all soft-deleted cost sheets
export async function GET() {
  try {
    const costSheets = await prisma.costSheet.findMany({
      where: {
        deletedAt: { not: null },
      },
      orderBy: {
        deletedAt: 'desc',
      },
      include: {
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
    console.error('Error fetching deleted cost sheets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deleted cost sheets' },
      { status: 500 }
    );
  }
}

// DELETE /api/costsheets/trash - Hard delete all soft-deleted cost sheets (Empty Trash)
// Only SUPER_ADMIN and ADMIN can perform this action
export async function DELETE() {
  try {
    const session = await auth();

    // Get user role
    let userRole: string;

    if (session?.user?.id) {
      userRole = session.user.role || 'pending';
    } else {
      // Fallback for development
      const tempUser = await prisma.user.findFirst({
        where: { email: 'temp@universalawning.com' },
      });
      userRole = tempUser?.role || 'ADMIN'; // Fallback for development
    }

    // Check permission
    if (!canHardDelete(userRole)) {
      return NextResponse.json(
        { error: 'Only Super Admins and Admins can permanently delete cost sheets' },
        { status: 403 }
      );
    }

    // Delete all soft-deleted cost sheets
    const result = await prisma.costSheet.deleteMany({
      where: {
        deletedAt: { not: null },
      },
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: `${result.count} cost sheet(s) permanently deleted`,
    });
  } catch (error) {
    console.error('Error emptying trash:', error);
    return NextResponse.json(
      { error: 'Failed to empty trash' },
      { status: 500 }
    );
  }
}
