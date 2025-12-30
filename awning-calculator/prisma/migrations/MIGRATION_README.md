# Database Migration: User Roles Update

## Overview
This migration updates the User model to use a proper enum for roles and adds role-based access control throughout the application.

## Changes Made

### 1. Prisma Schema Updates
- Added `UserRole` enum with values: `SUPER_ADMIN`, `ADMIN`, `SALES_REP`, `ESTIMATOR`, `VIEWER`, `pending`
- Changed `role` field from `String` to `UserRole` enum type

### 2. Role Mappings (Old to New)
| Old Role (String) | New Role (Enum) |
|-------------------|-----------------|
| `admin`           | `ADMIN`         |
| `estimator`       | `ESTIMATOR`     |
| `sales_rep`       | `SALES_REP`     |
| `viewer`          | `VIEWER`        |
| `pending`         | `pending`       |

### 3. New Role: SUPER_ADMIN
- `jacob@universalawning.com` is automatically assigned `SUPER_ADMIN` role via auth callback
- SUPER_ADMIN has full access to:
  - Manage all users including other admins
  - Permanently delete cost sheets
  - Access all features

### 4. Role Permissions Matrix

| Feature                    | SUPER_ADMIN | ADMIN | ESTIMATOR | SALES_REP | VIEWER | pending |
|---------------------------|-------------|-------|-----------|-----------|--------|---------|
| View Cost Sheets          | Yes         | Yes   | Yes       | Yes       | Yes    | No      |
| Create Cost Sheets        | Yes         | Yes   | Yes       | Yes       | No     | No      |
| Edit Cost Sheets          | Yes         | Yes   | Yes       | Yes       | No     | No      |
| Soft Delete (Trash)       | Yes         | Yes   | Yes       | Yes       | No     | No      |
| Permanent Delete          | Yes         | No    | No        | No        | No     | No      |
| Empty Trash               | Yes         | No    | No        | No        | No     | No      |
| View User List            | Yes         | Yes   | No        | No        | No     | No      |
| Manage Users              | Yes         | Yes*  | No        | No        | No     | No      |
| Delete Users              | Yes         | Yes*  | No        | No        | No     | No      |
| Assign SUPER_ADMIN role   | Yes         | No    | No        | No        | No     | No      |

*Admins cannot modify or delete SUPER_ADMIN accounts

## Migration Steps

### Option A: Fresh Database (Development)
```bash
cd awning-calculator

# Reset the database and apply all migrations
npx prisma migrate reset

# Generate updated Prisma client
npx prisma generate
```

### Option B: Existing Database (Production)
```bash
cd awning-calculator

# 1. Create a migration
npx prisma migrate dev --name update_user_role_enum

# 2. If migration fails due to existing data, run this SQL first:
# (Connect to your PostgreSQL database)
```

### SQL Migration Script (for existing data)
Run this SQL script before applying the Prisma migration if you have existing users with string roles:

```sql
-- Create the enum type first
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'SALES_REP', 'ESTIMATOR', 'VIEWER', 'pending');

-- Add a temporary column
ALTER TABLE "User" ADD COLUMN "role_new" "UserRole" DEFAULT 'pending';

-- Migrate existing data
UPDATE "User" SET "role_new" =
  CASE "role"
    WHEN 'admin' THEN 'ADMIN'::"UserRole"
    WHEN 'estimator' THEN 'ESTIMATOR'::"UserRole"
    WHEN 'sales_rep' THEN 'SALES_REP'::"UserRole"
    WHEN 'viewer' THEN 'VIEWER'::"UserRole"
    WHEN 'pending' THEN 'pending'::"UserRole"
    ELSE 'pending'::"UserRole"
  END;

-- Drop old column and rename new one
ALTER TABLE "User" DROP COLUMN "role";
ALTER TABLE "User" RENAME COLUMN "role_new" TO "role";

-- Set default
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'pending'::"UserRole";
```

### Option C: Using Prisma db push (Development only)
```bash
cd awning-calculator

# This will sync schema without creating migration files
npx prisma db push

# Generate updated Prisma client
npx prisma generate
```

## After Migration

1. **Verify the schema**:
   ```bash
   npx prisma studio
   ```

2. **Check user roles**: Ensure existing users have been properly migrated to the new enum values

3. **Test the application**:
   - Sign in as `jacob@universalawning.com` to verify SUPER_ADMIN access
   - Test role-based UI restrictions
   - Verify delete permissions work as expected

## Rollback (if needed)

To rollback to string-based roles:
```bash
npx prisma migrate reset --to <previous_migration_name>
```

Or manually revert the schema and run `npx prisma db push`
