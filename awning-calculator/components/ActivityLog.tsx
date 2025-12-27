'use client';

import { formatDistanceToNow } from 'date-fns';

interface ActivityLogUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface ActivityLogEntry {
  id: string;
  createdAt: string;
  action: string;
  description: string | null;
  changes: string | null;
  user: ActivityLogUser;
}

interface ActivityLogProps {
  logs: ActivityLogEntry[];
  className?: string;
}

const actionIcons: Record<string, { icon: string; color: string; bgColor: string }> = {
  created: {
    icon: 'M12 4v16m8-8H4',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  updated: {
    icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  deleted: {
    icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  restored: {
    icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
};

const actionLabels: Record<string, string> = {
  created: 'Created',
  updated: 'Updated',
  deleted: 'Moved to Trash',
  restored: 'Restored',
};

export default function ActivityLog({ logs, className = '' }: ActivityLogProps) {
  if (!logs || logs.length === 0) {
    return (
      <div className={`bg-white dark:bg-brand-surface-black rounded-lg border border-gray-200 dark:border-brand-border-subtle p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-brand-text-primary mb-4">
          Activity Log
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
          No activity recorded yet
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-brand-surface-black rounded-lg border border-gray-200 dark:border-brand-border-subtle p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-brand-text-primary mb-4">
        Activity Log
      </h3>

      <div className="flow-root">
        <ul className="-mb-8">
          {logs.map((log, index) => {
            const actionStyle = actionIcons[log.action] || actionIcons.updated;
            const isLast = index === logs.length - 1;

            return (
              <li key={log.id}>
                <div className="relative pb-8">
                  {!isLast && (
                    <span
                      className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                      aria-hidden="true"
                    />
                  )}
                  <div className="relative flex space-x-3">
                    {/* Icon */}
                    <div>
                      <span className={`h-8 w-8 rounded-full ${actionStyle.bgColor} flex items-center justify-center ring-8 ring-white dark:ring-brand-surface-black`}>
                        <svg
                          className={`h-4 w-4 ${actionStyle.color}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d={actionStyle.icon}
                          />
                        </svg>
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                      <div>
                        <p className="text-sm text-gray-900 dark:text-brand-text-primary">
                          <span className="font-medium">
                            {log.user.name || log.user.email || 'Unknown User'}
                          </span>{' '}
                          <span className="text-gray-500 dark:text-gray-400">
                            {log.description || `${actionLabels[log.action] || log.action} this cost sheet`}
                          </span>
                        </p>
                      </div>
                      <div className="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                        <time dateTime={log.createdAt}>
                          {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                        </time>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
