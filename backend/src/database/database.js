// database.js
import { prisma } from './prisma.js';

class Database {
  async connect() {
    // Test the connection
    await prisma.$connect();
    console.log('Database connected successfully');
  }

  async close() {
    await prisma.$disconnect();
    console.log('Database disconnected');
  }

  async createUser(firstName, lastName, email, passwordHash) {
    const fullName = `${firstName} ${lastName}`.trim();
    return prisma.users.create({
      data: {
        firstName,
        lastName,
        fullName,
        email: email.trim().toLowerCase(),
        password_hash: passwordHash,
      },
    });
  }

  async findUserByEmail(email) {
    return prisma.users.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
  }

  async findUserByFullname(fullName) {
    return prisma.users.findFirst({
      where: { fullName: fullName.trim() },
    });
  }

  async updateUserProfile(userId, data) {
    return prisma.users.update({
      where: { id: userId },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });
  }
}

export default Database;