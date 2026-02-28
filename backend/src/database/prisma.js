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
  process.exit(1)
}

const connectionString = process.env.DATABASE_URL

// Parse the connection string to remove SSL param if present
const baseConnectionString = connectionString.split('?')[0]

// Create PostgreSQL pool with SSL configuration
const pool = new pg.Pool({ 
  connectionString: baseConnectionString,
  ssl: {
    rejectUnauthorized: false, // Accept self-signed certificates
    require: true // Require SSL
  },
  connectionTimeoutMillis: 10000,
})

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
})

// Create the Prisma adapter
let adapter
try {
  adapter = new PrismaPg(pool)
} catch (error) {
  console.error('Failed to create PrismaPg adapter:', error.message)
  process.exit(1)
}

// Create Prisma Client
export const prisma = new PrismaClient({
  adapter,
  log: ['error', 'warn'],
})

// Handle cleanup on app shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})