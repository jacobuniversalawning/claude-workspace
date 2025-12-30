import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { UserRole } from "@prisma/client";

// PATCH /api/users/[id] - Update user role or status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserRole = session.user.role;

    // Only ADMIN and SUPER_ADMIN can modify users
    if (currentUserRole !== 'ADMIN' && currentUserRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { role, isActive } = body;

    // Validate role if provided
    const validRoles: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'SALES_REP', 'ESTIMATOR', 'VIEWER', 'pending'];
    if (role && !validRoles.includes(role as UserRole)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(", ")}` },
        { status: 400 }
      );
    }

    // Get the target user to check their current role
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Protect SUPER_ADMIN users from modification by regular ADMINs
    if (targetUser.role === 'SUPER_ADMIN' && currentUserRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: "Only Super Admins can modify other Super Admin accounts" },
        { status: 403 }
      );
    }

    // Prevent regular ADMINs from creating SUPER_ADMINs
    if (role === 'SUPER_ADMIN' && currentUserRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: "Only Super Admins can assign the Super Admin role" },
        { status: 403 }
      );
    }

    // Prevent user from deactivating themselves
    if (id === session.user.id && isActive === false) {
      return NextResponse.json(
        { error: "You cannot deactivate your own account" },
        { status: 400 }
      );
    }

    // Prevent user from demoting themselves
    if (id === session.user.id && role && role !== currentUserRole) {
      return NextResponse.json(
        { error: "You cannot change your own role" },
        { status: 400 }
      );
    }

    // Build update data - use enum type for role
    const updateData: { role?: UserRole; isActive?: boolean } = {};
    if (role !== undefined) updateData.role = role as UserRole;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete a user (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserRole = session.user.role;

    // Only ADMIN and SUPER_ADMIN can delete users
    if (currentUserRole !== 'ADMIN' && currentUserRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Prevent user from deleting themselves
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    // Get the target user to check their role
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only SUPER_ADMIN can delete other SUPER_ADMINs
    if (targetUser.role === 'SUPER_ADMIN' && currentUserRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: "Only Super Admins can delete other Super Admin accounts" },
        { status: 403 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
