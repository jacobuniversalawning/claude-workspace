'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import {
  isValidRole,
  isAdmin,
  isSuperAdmin,
  canChangeRole,
  requireAdmin,
  VALID_ROLES,
} from '@/lib/permissions';

// Schema for a single user update
const UserUpdateSchema = z.object({
  id: z.string(),
  role: z.enum(['super_admin', 'admin', 'estimator', 'sales_rep', 'viewer', 'pending']),
  isActive: z.boolean(),
});

// Schema for batch user updates
const BatchUserUpdateSchema = z.object({
  users: z.array(UserUpdateSchema),
});

export type UserUpdate = z.infer<typeof UserUpdateSchema>;
export type BatchUserUpdateInput = z.infer<typeof BatchUserUpdateSchema>;

// Result type for batch updates
export type BatchUpdateResult = {
  success: boolean;
  message: string;
  updatedCount?: number;
  errors?: Array<{ userId: string; error: string }>;
};

/**
 * Server action to update multiple users' permissions at once
 */
export async function updateUserPermissions(
  input: BatchUserUpdateInput
): Promise<BatchUpdateResult> {
  try {
    // Verify authentication
    const session = await auth();
    if (!session?.user) {
      return { success: false, message: 'Unauthorized: You must be logged in' };
    }

    // Require admin or super_admin role
    const adminCheck = requireAdmin(session);
    if (!adminCheck.authorized) {
      return { success: false, message: adminCheck.error };
    }

    // Validate input
    const validationResult = BatchUserUpdateSchema.safeParse(input);
    if (!validationResult.success) {
      return {
        success: false,
        message: 'Invalid input data',
        errors: validationResult.error.issues.map((e) => ({
          userId: 'unknown',
          error: e.message,
        })),
      };
    }

    const { users } = validationResult.data;
    const actorRole = session.user.role;
    const actorId = session.user.id;
    const actorIsSuperAdmin = isSuperAdmin(actorRole);
    const errors: Array<{ userId: string; error: string }> = [];
    let updatedCount = 0;

    // Process each user update
    for (const userUpdate of users) {
      try {
        // Get current user data
        const currentUser = await prisma.user.findUnique({
          where: { id: userUpdate.id },
          select: { id: true, role: true, email: true },
        });

        if (!currentUser) {
          errors.push({ userId: userUpdate.id, error: 'User not found' });
          continue;
        }

        // Prevent self-modification of role
        if (userUpdate.id === actorId && userUpdate.role !== actorRole) {
          errors.push({ userId: userUpdate.id, error: 'Cannot change your own role' });
          continue;
        }

        // Check role change permissions
        if (currentUser.role !== userUpdate.role) {
          if (!canChangeRole(actorRole, currentUser.role, userUpdate.role)) {
            if (userUpdate.role === 'super_admin' || currentUser.role === 'super_admin') {
              errors.push({
                userId: userUpdate.id,
                error: 'Only Super Admins can modify Super Admin roles',
              });
            } else {
              errors.push({
                userId: userUpdate.id,
                error: 'Insufficient permissions to change this user\'s role',
              });
            }
            continue;
          }
        }

        // Prevent deactivating self
        if (userUpdate.id === actorId && !userUpdate.isActive) {
          errors.push({ userId: userUpdate.id, error: 'Cannot deactivate your own account' });
          continue;
        }

        // Super admins are always active
        const isActiveValue = userUpdate.role === 'super_admin' ? true : userUpdate.isActive;

        // Update the user
        await prisma.user.update({
          where: { id: userUpdate.id },
          data: {
            role: userUpdate.role,
            isActive: isActiveValue,
          },
        });

        updatedCount++;
      } catch (error) {
        console.error(`Error updating user ${userUpdate.id}:`, error);
        errors.push({ userId: userUpdate.id, error: 'Failed to update user' });
      }
    }

    if (errors.length > 0 && updatedCount === 0) {
      return {
        success: false,
        message: 'Failed to update users',
        errors,
      };
    }

    if (errors.length > 0) {
      return {
        success: true,
        message: `Updated ${updatedCount} user(s) with ${errors.length} error(s)`,
        updatedCount,
        errors,
      };
    }

    return {
      success: true,
      message: `Successfully updated ${updatedCount} user(s)`,
      updatedCount,
    };
  } catch (error) {
    console.error('Error in updateUserPermissions:', error);
    return { success: false, message: 'An unexpected error occurred' };
  }
}

/**
 * Server action to delete a user (super_admin only)
 */
export async function deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, message: 'Unauthorized: You must be logged in' };
    }

    // Only super_admin can delete users
    if (!isSuperAdmin(session.user.role)) {
      return { success: false, message: 'Forbidden: Only Super Admins can delete users' };
    }

    // Prevent self-deletion
    if (userId === session.user.id) {
      return { success: false, message: 'Cannot delete your own account' };
    }

    // Get the target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true, name: true },
    });

    if (!targetUser) {
      return { success: false, message: 'User not found' };
    }

    // Cannot delete super_admin users
    if (targetUser.role === 'super_admin') {
      return { success: false, message: 'Cannot delete a Super Admin account' };
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return { success: true, message: 'User deleted successfully' };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, message: 'Failed to delete user' };
  }
}

/**
 * Server action to fetch all users
 */
export async function getUsers(): Promise<{
  success: boolean;
  users?: Array<{
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
    isActive: boolean;
    createdAt: Date;
  }>;
  message?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, message: 'Unauthorized' };
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: [
        { role: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return { success: true, users };
  } catch (error) {
    console.error('Error fetching users:', error);
    return { success: false, message: 'Failed to fetch users' };
  }
}
