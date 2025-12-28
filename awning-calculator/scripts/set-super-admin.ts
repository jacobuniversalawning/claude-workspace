/**
 * Migration Script: Set Super Admin Role
 *
 * This script sets the user with email 'jacob@universalawning.com' to the super_admin role.
 *
 * Usage: npx tsx scripts/set-super-admin.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SUPER_ADMIN_EMAIL = 'jacob@universalawning.com';

async function main() {
  console.log('Setting super admin role...');
  console.log(`Target email: ${SUPER_ADMIN_EMAIL}`);

  try {
    // First, try to find the user
    const user = await prisma.user.findUnique({
      where: { email: SUPER_ADMIN_EMAIL },
    });

    if (!user) {
      console.log(`User with email ${SUPER_ADMIN_EMAIL} not found in database.`);
      console.log('The user will be set as super_admin when they first sign in.');

      // Create a note for future reference
      console.log('\nTo manually set super admin after user signs in, run:');
      console.log(`  npx tsx scripts/set-super-admin.ts`);

      return;
    }

    // Update the user to super_admin
    const updatedUser = await prisma.user.update({
      where: { email: SUPER_ADMIN_EMAIL },
      data: {
        role: 'super_admin',
        isActive: true, // Ensure super admin is always active
      },
    });

    console.log('\nSuper admin set successfully!');
    console.log(`  User: ${updatedUser.name || 'No name'}`);
    console.log(`  Email: ${updatedUser.email}`);
    console.log(`  Role: ${updatedUser.role}`);
    console.log(`  Active: ${updatedUser.isActive}`);
  } catch (error) {
    console.error('Error setting super admin:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
