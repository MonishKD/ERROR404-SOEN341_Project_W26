import { PrismaClient } from '@prisma/client'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Get current directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env from project root
dotenv.config({ path: path.join(__dirname, '../../../.env') })

// Check if DATABASE_URL is loaded
console.log('DATABASE_URL loaded:', !!process.env.DATABASE_URL)

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not defined in .env file')
  console.error('Please check your .env file at the project root')
  if (process.env.NODE_ENV === 'test') {
    throw new Error('DATABASE_URL is required for tests')
  } else {
    process.exit(1)
  }
}

// Create PostgreSQL connection pool
const pool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Neon
  }
})

// Create Prisma adapter
const adapter = new PrismaPg(pool)

// Create Prisma Client with adapter
export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'test' ? [] : ['error', 'warn'],
})

// Handle cleanup on app shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})