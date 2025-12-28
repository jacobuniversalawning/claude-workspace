import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  isValidRole,
  isAdmin,
  isSuperAdmin,
  canChangeRole,
  canDeleteUser,
  requireAdmin,
  requireSuperAdmin,
  VALID_ROLES,
} from "@/lib/permissions";

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

    // Require admin or super_admin to manage users
    const adminCheck = requireAdmin(session);
    if (!adminCheck.authorized) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const body = await request.json();
    const { role, isActive } = body;

    // Get the target user's current role
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Validate role if provided
    if (role !== undefined) {
      if (!isValidRole(role)) {
        return NextResponse.json(
          { error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` },
          { status: 400 }
        );
      }

      // Check if actor can change this user's role to the new role
      if (!canChangeRole(session.user.role, targetUser.role, role)) {
        // Non-super admins cannot change to/from super_admin
        if (role === 'super_admin' || targetUser.role === 'super_admin') {
          return NextResponse.json(
            { error: "Only Super Admins can modify Super Admin roles" },
            { status: 403 }
          );
        }
        return NextResponse.json(
          { error: "Insufficient permissions to change this user's role" },
          { status: 403 }
        );
      }
    }

    // Prevent user from deactivating themselves
    if (id === session.user.id && isActive === false) {
      return NextResponse.json(
        { error: "You cannot deactivate your own account" },
        { status: 400 }
      );
    }

    // Prevent user from demoting themselves
    if (id === session.user.id && role !== undefined && role !== session.user.role) {
      return NextResponse.json(
        { error: "You cannot change your own role" },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: { role?: string; isActive?: boolean } = {};
    if (role !== undefined) updateData.role = role;
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

// DELETE /api/users/[id] - Delete a user (super_admin only)
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

    // Only super_admin can delete users
    const superAdminCheck = requireSuperAdmin(session);
    if (!superAdminCheck.authorized) {
      return NextResponse.json({ error: superAdminCheck.error }, { status: superAdminCheck.status });
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

    // Extra protection: cannot delete a super_admin (even as super_admin)
    if (targetUser.role === 'super_admin') {
      return NextResponse.json(
        { error: "Cannot delete a Super Admin account" },
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
