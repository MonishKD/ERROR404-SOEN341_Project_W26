// Migrated from Sqllite to Postegres with Prisma ORM
const { prisma } = require('./prisma');

// This script tests the database connection and provides instructions for syncing schema changes.
async function initDatabase() {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connection successful.');
    console.log('Run `npm run prisma:migrate` or `npm run prisma:push` to sync schema changes.');
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}
// Run the initialization script if this file is executed directly
initDatabase();
