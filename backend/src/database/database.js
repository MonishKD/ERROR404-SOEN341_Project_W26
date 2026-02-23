// database.js
import { prisma } from './prisma.js';

class Database {
  async connect() {
    return;
  }

  async close() {
    return;
  }

  async createUser(email, passwordHash) {
    return prisma.users.create({
      data: {
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

}

export default Database;