/**
 * Permission System for Universal Awning Calculator
 *
 * Role Hierarchy (highest to lowest):
 * - super_admin: Full system control, can manage all users including admins
 * - admin: Can manage settings and most features, but cannot change super_admin roles
 * - estimator: Full access to cost sheets
 * - sales_rep: Can create and manage quotes
 * - viewer: Read-only access
 * - pending: No access until approved
 */

// Super Admin email - the designated super admin user
export const SUPER_ADMIN_EMAIL = 'jacob@universalawning.com';

// Role type definition
export type UserRole = 'super_admin' | 'admin' | 'estimator' | 'sales_rep' | 'viewer' | 'pending';

// Role hierarchy (higher number = more permissions)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 100,
  admin: 80,
  estimator: 60,
  sales_rep: 40,
  viewer: 20,
  pending: 0,
};

// All valid roles for validation
export const VALID_ROLES: UserRole[] = ['super_admin', 'admin', 'estimator', 'sales_rep', 'viewer', 'pending'];

// Permission definitions
export type Permission =
  | 'view_costsheets'
  | 'create_costsheets'
  | 'edit_costsheets'
  | 'delete_costsheets'
  | 'view_admin'
  | 'edit_settings'
  | 'manage_users'
  | 'change_user_roles'
  | 'delete_users'
  | 'danger_zone'
  | 'empty_trash'
  | 'permanent_delete';

// Role-to-permission mapping
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    'view_costsheets',
    'create_costsheets',
    'edit_costsheets',
    'delete_costsheets',
    'view_admin',
    'edit_settings',
    'manage_users',
    'change_user_roles',
    'delete_users',
    'danger_zone',
    'empty_trash',
    'permanent_delete',
  ],
  admin: [
    'view_costsheets',
    'create_costsheets',
    'edit_costsheets',
    'delete_costsheets',
    'view_admin',
    'edit_settings',
    'manage_users',
    // Admin cannot: change_user_roles (to super_admin), delete_users, danger_zone
  ],
  estimator: [
    'view_costsheets',
    'create_costsheets',
    'edit_costsheets',
    'delete_costsheets',
  ],
  sales_rep: [
    'view_costsheets',
    'create_costsheets',
    'edit_costsheets',
  ],
  viewer: [
    'view_costsheets',
  ],
  pending: [],
};

/**
 * Check if a role is valid
 */
export function isValidRole(role: string): role is UserRole {
  return VALID_ROLES.includes(role as UserRole);
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(role: string | undefined | null, permission: Permission): boolean {
  if (!role || !isValidRole(role)) {
    return false;
  }
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Check if a user has any of the given permissions
 */
export function hasAnyPermission(role: string | undefined | null, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p));
}

/**
 * Check if a user has all of the given permissions
 */
export function hasAllPermissions(role: string | undefined | null, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(role, p));
}

/**
 * Check if a role is Super Admin
 */
export function isSuperAdmin(role: string | undefined | null): boolean {
  return role === 'super_admin';
}

/**
 * Check if a role is Admin or higher
 */
export function isAdmin(role: string | undefined | null): boolean {
  if (!role || !isValidRole(role)) {
    return false;
  }
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.admin;
}

/**
 * Check if user can manage another user's role
 * Super Admin can change any role
 * Admin can change roles up to 'admin' (but not to super_admin)
 */
export function canChangeRole(
  actorRole: string | undefined | null,
  targetCurrentRole: string,
  targetNewRole: string
): boolean {
  if (!actorRole || !isValidRole(actorRole)) {
    return false;
  }

  // Only super_admin can change to/from super_admin
  if (targetCurrentRole === 'super_admin' || targetNewRole === 'super_admin') {
    return actorRole === 'super_admin';
  }

  // Admin and super_admin can change other roles
  return isAdmin(actorRole);
}

/**
 * Check if user can delete another user
 * Only super_admin can delete users
 */
export function canDeleteUser(role: string | undefined | null): boolean {
  return isSuperAdmin(role);
}

/**
 * Check if user can access danger zone features
 * Only super_admin can access danger zone
 */
export function canAccessDangerZone(role: string | undefined | null): boolean {
  return isSuperAdmin(role);
}

/**
 * Check if a role has higher privileges than another
 */
export function hasHigherPrivilege(role1: string | undefined | null, role2: string | undefined | null): boolean {
  if (!role1 || !role2 || !isValidRole(role1) || !isValidRole(role2)) {
    return false;
  }
  return ROLE_HIERARCHY[role1] > ROLE_HIERARCHY[role2];
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: string | undefined | null): Permission[] {
  if (!role || !isValidRole(role)) {
    return [];
  }
  return [...ROLE_PERMISSIONS[role]];
}

/**
 * Get roles that the actor can assign to users
 */
export function getAssignableRoles(actorRole: string | undefined | null): UserRole[] {
  if (!actorRole || !isValidRole(actorRole)) {
    return [];
  }

  if (actorRole === 'super_admin') {
    // Super admin can assign any role
    return [...VALID_ROLES];
  }

  if (actorRole === 'admin') {
    // Admin can assign roles up to admin (not super_admin)
    return VALID_ROLES.filter(r => r !== 'super_admin');
  }

  return [];
}

/**
 * Check if email is the designated super admin
 */
export function isSuperAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

/**
 * Server-side session permission check helper
 * Use in API routes and server components
 */
export function requirePermission(
  session: { user?: { role?: string } } | null,
  permission: Permission
): { authorized: true } | { authorized: false; error: string; status: 401 | 403 } {
  if (!session?.user) {
    return { authorized: false, error: 'Unauthorized', status: 401 };
  }

  if (!hasPermission(session.user.role, permission)) {
    return { authorized: false, error: 'Forbidden: Insufficient permissions', status: 403 };
  }

  return { authorized: true };
}

/**
 * Server-side super admin check helper
 * Use in API routes for super admin only actions
 */
export function requireSuperAdmin(
  session: { user?: { role?: string } } | null
): { authorized: true } | { authorized: false; error: string; status: 401 | 403 } {
  if (!session?.user) {
    return { authorized: false, error: 'Unauthorized', status: 401 };
  }

  if (!isSuperAdmin(session.user.role)) {
    return { authorized: false, error: 'Forbidden: Super Admin access required', status: 403 };
  }

  return { authorized: true };
}

/**
 * Server-side admin check helper
 * Use in API routes for admin or super admin actions
 */
export function requireAdmin(
  session: { user?: { role?: string } } | null
): { authorized: true } | { authorized: false; error: string; status: 401 | 403 } {
  if (!session?.user) {
    return { authorized: false, error: 'Unauthorized', status: 401 };
  }

  if (!isAdmin(session.user.role)) {
    return { authorized: false, error: 'Forbidden: Admin access required', status: 403 };
  }

  return { authorized: true };
}
