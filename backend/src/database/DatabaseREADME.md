### Backend database layer now uses Prisma + PostgreSQL.

**Required backend packages:**

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

#### Useful commands (MAC):

- npm run prisma:generate
- npm run prisma:migrate
- npm run prisma:push

#### Windows:
STEPS FOR PRISMA

1. Go on project root

2. Go to backend and reinstall dependencies
```git bash
cd backend
npm install
```

3. Check if Prisma Client needs to be generated
``` git bash
npx prisma generate
```

4. Run migrations to sync database
``` git bash
npx prisma migrate dev --name init
```

5. Start the server
``` git bash
npm start
```
