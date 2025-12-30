import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// Helper to check if user can hard delete (SUPER_ADMIN or ADMIN only)
const canHardDelete = (role: string) => ['SUPER_ADMIN', 'ADMIN'].includes(role);

// DELETE /api/costsheets/all - Permanently delete ALL cost sheets
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
        { error: 'Only Super Admins and Admins can delete all cost sheet data' },
        { status: 403 }
      );
    }

    // Delete all cost sheets (this will cascade to related records)
    const result = await prisma.costSheet.deleteMany({});

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: `${result.count} cost sheet(s) permanently deleted`,
    });
  } catch (error) {
    console.error('Error deleting all cost sheets:', error);
    return NextResponse.json(
      { error: 'Failed to delete all cost sheet data' },
      { status: 500 }
    );
  }
}
