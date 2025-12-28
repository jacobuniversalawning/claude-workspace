'use client';

import { useEffect, useState, useTransition } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { updateUserPermissions, deleteUser, getUsers, type UserUpdate } from '@/app/actions/users';
import { isSuperAdmin, canChangeRole, type UserRole } from '@/lib/permissions';

// Form validation schema
const UserFormSchema = z.object({
  users: z.array(
    z.object({
      id: z.string(),
      name: z.string().nullable(),
      email: z.string().nullable(),
      image: z.string().nullable(),
      role: z.enum(['super_admin', 'admin', 'estimator', 'sales_rep', 'viewer', 'pending']),
      isActive: z.boolean(),
      createdAt: z.string(),
      // Track original values for dirty detection
      originalRole: z.string(),
      originalIsActive: z.boolean(),
    })
  ),
});

type UserFormData = z.infer<typeof UserFormSchema>;

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date | string;
}

interface UserManagementProps {
  currentUserRole: string | undefined;
  currentUserId: string | undefined;
}

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'pending', label: 'Pending Approval' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'sales_rep', label: 'Sales Rep' },
  { value: 'estimator', label: 'Estimator' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' },
];

export default function UserManagement({ currentUserRole, currentUserId }: UserManagementProps) {
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const userIsSuperAdmin = isSuperAdmin(currentUserRole);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isDirty, dirtyFields },
  } = useForm<UserFormData>({
    resolver: zodResolver(UserFormSchema),
    defaultValues: { users: [] },
  });

  const { fields } = useFieldArray({
    control,
    name: 'users',
  });

  const watchedUsers = watch('users');

  // Calculate which users have changes
  const changedUsers = watchedUsers.filter((user, index) => {
    return user.role !== user.originalRole || user.isActive !== user.originalIsActive;
  });

  const hasChanges = changedUsers.length > 0;

  // Fetch users on mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const result = await getUsers();
      if (result.success && result.users) {
        const formattedUsers = result.users.map((user) => ({
          ...user,
          createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
          role: user.role as UserRole,
          originalRole: user.role,
          originalIsActive: user.isActive,
        }));
        reset({ users: formattedUsers });
      } else {
        toast.error(result.message || 'Failed to load users');
      }
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: UserFormData) => {
    // Filter only changed users
    const usersToUpdate: UserUpdate[] = data.users
      .filter((user) => user.role !== user.originalRole || user.isActive !== user.originalIsActive)
      .map((user) => ({
        id: user.id,
        role: user.role as UserRole,
        isActive: user.isActive,
      }));

    if (usersToUpdate.length === 0) {
      toast.info('No changes to save');
      return;
    }

    startTransition(async () => {
      const result = await updateUserPermissions({ users: usersToUpdate });

      if (result.success) {
        toast.success(result.message);
        // Reload users to get fresh data
        await loadUsers();
      } else {
        toast.error(result.message);
        if (result.errors) {
          result.errors.forEach((err) => {
            toast.error(`User ${err.userId}: ${err.error}`);
          });
        }
      }
    });
  };

  const handleDelete = async (userId: string, userName: string) => {
    setDeleteConfirm({ id: userId, name: userName });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    startTransition(async () => {
      const result = await deleteUser(deleteConfirm.id);

      if (result.success) {
        toast.success(result.message);
        await loadUsers();
      } else {
        toast.error(result.message);
      }
      setDeleteConfirm(null);
    });
  };

  const handleReset = () => {
    loadUsers();
    toast.info('Changes discarded');
  };

  // Check if a specific user row has changes
  const userHasChanges = (index: number) => {
    const user = watchedUsers[index];
    if (!user) return false;
    return user.role !== user.originalRole || user.isActive !== user.originalIsActive;
  };

  // Styles matching the existing admin panel design
  const selectClass = "text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-brand-surface-grey-dark text-[#EDEDED] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors";
  const buttonClass = "px-4 py-2 text-sm font-medium rounded-lg transition-colors";
  const primaryButtonClass = `${buttonClass} bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed`;
  const secondaryButtonClass = `${buttonClass} bg-[#1F1F1F] text-[#EDEDED] border border-[#333333] hover:bg-[#2A2A2A]`;
  const dangerButtonClass = `${buttonClass} bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20`;
  const iconButtonClass = "p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with Save/Reset buttons */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-[#EDEDED]">User Management</h2>
          <p className="text-sm text-[#666666] mt-1">
            Manage user access, roles, and permissions.
            {hasChanges && (
              <span className="ml-2 text-amber-500">
                ({changedUsers.length} unsaved change{changedUsers.length !== 1 ? 's' : ''})
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <button
              type="button"
              onClick={handleReset}
              className={secondaryButtonClass}
              disabled={isPending}
            >
              Discard
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            className={primaryButtonClass}
            disabled={!hasChanges || isPending}
          >
            {isPending ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={loadUsers}
            className={secondaryButtonClass}
            disabled={isLoading || isPending}
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Users List */}
      {fields.length === 0 ? (
        <div className="text-center py-12 bg-[#111111] rounded border border-dashed border-gray-300 dark:border-gray-600">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p className="text-[#666666]">No users found. Users will appear here after they sign in with Google.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-3">
            {fields.map((field, index) => {
              const user = watchedUsers[index];
              const hasChange = userHasChanges(index);
              const isSuperAdminUser = user?.role === 'super_admin';
              const canModifyRole = canChangeRole(currentUserRole, user?.originalRole || '', user?.role || '');
              const isCurrentUser = user?.id === currentUserId;

              return (
                <div
                  key={field.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                    hasChange
                      ? 'bg-amber-500/5 border-amber-500/30 ring-1 ring-amber-500/20'
                      : user?.isActive
                        ? 'bg-white dark:bg-brand-surface-grey-dark border-[#1F1F1F]'
                        : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 opacity-60'
                  }`}
                >
                  {/* User Avatar */}
                  {user?.image ? (
                    <img
                      src={user.image}
                      alt={user.name || 'User'}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-300 font-medium">
                        {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[#EDEDED] truncate">
                        {user?.name || 'Unknown User'}
                      </p>
                      {isSuperAdminUser && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                          Super Admin
                        </span>
                      )}
                      {user?.originalRole === 'pending' && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded">
                          Pending
                        </span>
                      )}
                      {!user?.isActive && !isSuperAdminUser && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded">
                          Inactive
                        </span>
                      )}
                      {hasChange && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded">
                          Modified
                        </span>
                      )}
                      {isCurrentUser && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#666666] truncate">
                      {user?.email}
                    </p>
                  </div>

                  {/* Status Toggle */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[#666666]">Status:</label>
                    <Controller
                      name={`users.${index}.isActive`}
                      control={control}
                      render={({ field: controllerField }) => (
                        <button
                          type="button"
                          onClick={() => {
                            if (!isSuperAdminUser && !isCurrentUser) {
                              controllerField.onChange(!controllerField.value);
                            }
                          }}
                          disabled={isSuperAdminUser || isCurrentUser}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            controllerField.value
                              ? 'bg-green-500'
                              : 'bg-gray-300 dark:bg-gray-600'
                          } ${(isSuperAdminUser || isCurrentUser) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              controllerField.value ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      )}
                    />
                    <span className="text-xs text-[#A1A1A1] w-16">
                      {user?.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Role Select */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[#666666]">Role:</label>
                    {user?.originalRole === 'super_admin' && !userIsSuperAdmin ? (
                      <span className="text-sm px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded font-medium">
                        Super Admin
                      </span>
                    ) : (
                      <Controller
                        name={`users.${index}.role`}
                        control={control}
                        render={({ field: controllerField }) => (
                          <select
                            value={controllerField.value}
                            onChange={(e) => {
                              if (!isCurrentUser) {
                                controllerField.onChange(e.target.value);
                              }
                            }}
                            disabled={isCurrentUser || (!userIsSuperAdmin && user?.originalRole === 'super_admin')}
                            className={selectClass}
                          >
                            {ROLE_OPTIONS.map((option) => {
                              // Only show super_admin option to super admins
                              if (option.value === 'super_admin' && !userIsSuperAdmin) {
                                return null;
                              }
                              return (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              );
                            })}
                          </select>
                        )}
                      />
                    )}
                  </div>

                  {/* Delete Button */}
                  {userIsSuperAdmin && !isSuperAdminUser && !isCurrentUser && (
                    <button
                      type="button"
                      onClick={() => handleDelete(user?.id || '', user?.name || user?.email || 'this user')}
                      className={`${iconButtonClass} hover:bg-red-500/10`}
                      title="Delete user"
                    >
                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </form>
      )}

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Note:</strong> Users are automatically created when they sign in with Google for the first time.
          New users default to <strong>Inactive</strong> status with <strong>Pending Approval</strong> role and must be activated by an admin.
        </p>
        <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
          <strong>Roles:</strong> Pending Approval (no access) → Viewer (read-only) → Sales Rep (create quotes) → Estimator (full cost sheets) → Admin (full access) → Super Admin (system control)
        </p>
        {!userIsSuperAdmin && (
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
            <strong>Permissions:</strong> Only Super Admins can delete users, assign Super Admin roles, and access Danger Zone features.
          </p>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-[#EDEDED] mb-2">Delete User</h3>
            <p className="text-[#A1A1A1] mb-6">
              Are you sure you want to delete &quot;{deleteConfirm.name}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className={secondaryButtonClass}
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className={dangerButtonClass}
                disabled={isPending}
              >
                {isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
