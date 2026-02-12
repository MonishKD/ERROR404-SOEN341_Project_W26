require('dotenv').config();

module.exports = {
  schema: 'backend/prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL
  }
};
