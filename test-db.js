// test-db.js
const { prisma } = require('./backend/src/hello-prisma/prisma');  // ✅ This works with { prisma } export

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test your ACTUAL recipes table
    const recipeCount = await prisma.recipes.count();
    console.log('✅ Connected to PostgreSQL!');
    console.log(`📊 Your 'recipes' table has ${recipeCount} rows`);
    
    // Test raw query
    const result = await prisma.$queryRaw`SELECT current_database() as db_name`;
    console.log('📁 Database name:', result[0].db_name);
    
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();