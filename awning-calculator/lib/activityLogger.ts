import { prisma } from './prisma';

export type ActivityAction = 'created' | 'updated' | 'deleted' | 'restored' | 'imported';

interface LogActivityParams {
  action: ActivityAction;
  userId: string;
  costSheetId: string;
  description?: string;
  changes?: Record<string, unknown>;
}

export async function logActivity({
  action,
  userId,
  costSheetId,
  description,
  changes,
}: LogActivityParams) {
  try {
    await prisma.activityLog.create({
      data: {
        action,
        userId,
        costSheetId,
        description,
        changes: changes ? JSON.stringify(changes) : null,
      },
    });
  } catch (error) {
    // Log error but don't fail the main operation
    console.error('Failed to log activity:', error);
  }
}

// Generate a human-readable description of what changed
export function generateChangeDescription(
  action: ActivityAction,
  userName: string,
  details?: { customer?: string; project?: string }
): string {
  switch (action) {
    case 'created':
      return `${userName} created this cost sheet`;
    case 'updated':
      return `${userName} updated this cost sheet`;
    case 'deleted':
      return `${userName} moved this cost sheet to trash`;
    case 'restored':
      return `${userName} restored this cost sheet from trash`;
    case 'imported':
      return `${userName} imported this cost sheet from Excel`;
    default:
      return `${userName} performed an action`;
  }
}
