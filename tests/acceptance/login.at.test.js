import { jest } from "@jest/globals";
import request from "supertest";

/**
 * Login Acceptance Test (AT)
 * This test verifies the behavior of the /api/auth/login endpoint.
 * Database and service layers are mocked to isolate route behavior.
 */

/**
 * Mock external dependencies before importing the server.
 * This prevents real database connections and allows controlled testing.
 */

// Mock prisma so Jest never tries to load real Prisma client
jest.unstable_mockModule("../../src/database/prisma.js", () => ({
  prisma: {
    recipes: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    users: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock authService login/register
// Allows us to simulate successful and failed login attempts
const mockLogin = jest.fn();
const mockRegister = jest.fn();

jest.unstable_mockModule("../../src/services/authService.js", () => ({
  login: mockLogin,
  register: mockRegister,
}));

// Mock profile service (not needed for login test, but server imports it)
jest.unstable_mockModule("../../src/services/profileService.js", () => ({
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
}));

// Mock auth middleware (also imported by server)
jest.unstable_mockModule("../../src/middleware/auth.js", () => ({
  authMiddleware: (req, res, next) => next(),
  checkRecipeOwner: (req, res, next) => next(),
}));

// Now import the app AFTER mocks
const { default: app } = await import("../../src/server.js");

describe("AT Login - /api/auth/login", () => {

  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterAll(() => {
    console.error.mockRestore();
    console.log.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Login success returns 200 with token/user info", async () => {
    mockLogin.mockResolvedValue({
      message: "Login successful",
      token: "fake.jwt.token",
      user: { id: 1, email: "test@mail.com" },
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@mail.com", password: "Password123!" });

    expect(res.status).toBe(200);
    expect(mockLogin).toHaveBeenCalledWith("test@mail.com", "Password123!");
    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("user");
  });

  test("Login failure returns 401 (wrong password/user)", async () => {
    mockLogin.mockRejectedValue(new Error("Invalid credentials"));

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@mail.com", password: "wrong" });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message");
  });

  test("Missing email or password returns 400", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Missing email or password/i);
  });
});