// backend/src/hello-prisma/prisma.js
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

console.log('DATABASE_URL loaded:', process.env.DATABASE_URL ? 'Yes' : 'No');

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Create adapter with the pool
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

// Export prisma
module.exports = { prisma };