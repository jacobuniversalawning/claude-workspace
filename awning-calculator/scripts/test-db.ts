const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Testing database connection...');
    try {
        const userCount = await prisma.user.count();
        console.log(`Successfully connected! Current user count: ${userCount}`);

        console.log('Attempting to create/upsert a test user...');
        const user = await prisma.user.upsert({
            where: { email: 'test-db-connection@universalawning.com' },
            update: {},
            create: {
                email: 'test-db-connection@universalawning.com',
                name: 'DB Connection Test User',
                image: 'https://example.com/avatar.jpg'
            },
        });
        console.log('Successfully created/fetched user:', user);
        console.log('Database connection is HEALTHY.');
    } catch (error) {
        console.error('DATABASE ERROR:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
