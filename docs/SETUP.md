# ERROR404 - SOEN341 Project W26

A meal planning and recipe management web application built with Node.js, Express, and PostgreSQL.

## Prerequisites

Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v20 or higher)
- [Git](https://git-scm.com/)
- A PostgreSQL database (project uses [Neon](https://neon.tech/) as the cloud provider)

## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/MonishKD/ERROR404-SOEN341_Project_W26.git
cd ERROR404-SOEN341_Project_W26
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables
Create a `.env` file at the root of the project with the following variables:
```dotenv
# Neon PostgreSQL URL
DATABASE_URL="your_neon_postgresql_url"

# Email configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# App URL
APP_URL=http://localhost:4000

# JWT Secret
JWT_SECRET=your_jwt_secret_here
```

### 4. Set Up the Database
Generate the Prisma client and apply migrations:
```bash
npm run prisma:generate
npm run prisma:migrate
```

Optionally, seed the database with initial data:
```bash
node scripts/seed.js
```

### 5. Run the Application
```bash
npm start
```
The app will be running at **http://localhost:4000**

---

## Running Tests
```bash
npm test
```
To run tests with code coverage:
```bash
npm test -- --coverage
```

---

## Project Structure
```
├── config/              # Jest and Prisma configuration
├── docs/                # Project documentation
├── prisma/              # Prisma schema and migrations
├── public/              
│   ├── css/             # CSS files
│   ├── js/              # JS files
│   └── pages            # Frontend HTML files
├── scripts/             # Database initialization and seeding scripts
├── src/
│   ├── controllers/     # Application controllers
│   ├── database/        # Database connection setup
│   ├── middleware/      # Express middleware (e.g., auth)
│   ├── routes/          # Express route definitions
│   ├── services/        # Business logic and service layer
│   ├── utils/           # Utility and helper functions
│   ├── app.js           # Main Express app configuration and route setup
│   └── server.js        # Express server entry point
├── tests/
│   └── unit/            # Unit tests
├── sonar-project.properties  # SonarQube configuration
└── .env                 # Environment variables (do not commit)
```

---

## Database

The backend database layer uses **Prisma + PostgreSQL** (hosted on Neon). The following Prisma commands are available:

| Command | Description |
|---|---|
| `npm run prisma:generate` | Generates the Prisma client |
| `npm run prisma:migrate` | Runs database migrations |
| `npm run prisma:push` | Pushes schema changes directly to the database |

---

## Static Analysis

This project uses **SonarQube Cloud** for static code analysis. It runs automatically as part of the CI pipeline on every push and pull request to `main`. The configuration can be found in `sonar-project.properties`.

---
> **Never commit the `.env` file.** It should be is listed in `.gitignore`.
