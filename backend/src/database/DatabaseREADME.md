Backend database layer now uses Prisma + PostgreSQL.

Required backend packages:

{
  "dependencies": {
    "@prisma/adapter-pg": "^7.4.0",
    "@prisma/client": "^7.4.0",
    "bcrypt": "^5.1.1",
    "dotenv": "^16.4.5",
    "express": "^4.18.2",
    "pg": "^8.13.1"
  },
  "devDependencies": {
    "prisma": "^7.4.0"
  }
}

Useful commands:

- npm run prisma:generate
- npm run prisma:migrate
- npm run prisma:push
