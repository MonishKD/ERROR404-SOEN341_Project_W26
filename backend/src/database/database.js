// database.js
import { prisma } from './prisma.js';

class Database {
  async connect() {
    return;
  }

  async close() {
    return;
  }

  async createUser(username, email, passwordHash) {
    return prisma.users.create({
      data: {
        username,
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

  async findUserByUsername(userID) {
    return prisma.users.findUnique({
      where: { username: userID },
    });
  }
}

export default Database;