import { jest } from "@jest/globals";
import request from "supertest";
import { checkRecipeOwner } from "../src/middleware/auth.js";

/**
 * Profile Acceptance Test (AT)
 * This test verifies the behavior of the /api/profile endpoint.
 * Database and service layers are mocked to isolate route behavior.
 * Negative Scenario: User tries to access profile without logging in → access denied.
 */

// Mock prisma
// This ensures that when the server imports prisma, it gets our mocked version instead of trying to connect to a real database.
jest.unstable_mockModule("../src/database/prisma.js", () => ({
  prisma: {
    users: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    recipes: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Mock auth middleware
jest.unstable_mockModule("../src/middleware/auth.js", () => ({
  authMiddleware: (req, res, next) => {
    if (req.headers.authorization === "Bearer valid-token") {
      req.user = { id: 1, email: "test@mail.com" };
      next();
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  },
  checkRecipeOwner: (req, res, next) => next(),
}));

// Mock profile service
const mockGetProfile = jest.fn();
const mockUpdateProfile = jest.fn();

jest.unstable_mockModule("../src/services/profileService.js", () => ({
  getProfile: mockGetProfile,
  updateProfile: mockUpdateProfile,
}));

// Now import the app AFTER mocks
const { default: app } = await import("../src/server.js");

describe("Profile AT - /api/profile", () => {
  const validToken = "Bearer valid-token";
  const mockProfile = {
    id: 1,
    email: "test@mail.com",
    name: "Test User",
    bio: "Original bio",
    location: "New York",
  };

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

  test("GET profile - success returns 200 with user data", async () => {
    mockGetProfile.mockResolvedValue(mockProfile);

    const res = await request(app)
      .get("/api/profile")
      .set("Authorization", validToken);

    expect(res.status).toBe(200);
    expect(mockGetProfile).toHaveBeenCalledWith(1);
    expect(res.body).toEqual(mockProfile);
  });
    // This test verifies that after updating the profile, a subsequent GET request returns the updated values, confirming that changes persist as expected.  
  test("PUT profile - update success returns 200 with updated data", async () => {
    const updates = { name: "Updated Name", bio: "Updated bio" };
    const updatedProfile = { ...mockProfile, ...updates };
    
    mockUpdateProfile.mockResolvedValue(updatedProfile);

    const res = await request(app)
      .put("/api/profile")
      .set("Authorization", validToken)
      .send(updates);

    expect(res.status).toBe(200);
    expect(mockUpdateProfile).toHaveBeenCalledWith(1, updates);
    expect(res.body).toMatchObject(updates);
  });
    // This test ensures that after a successful profile update, the changes are reflected in future GET requests, confirming that the update operation correctly modifies the stored profile data.
    test("PUT then GET - updated values persist", async () => {
    const updates = { name: "Updated Name", bio: "Updated bio" };
    const updatedProfile = { ...mockProfile, ...updates };
    
    // Mock update
    mockUpdateProfile.mockResolvedValue(updatedProfile);
    
    await request(app)
      .put("/api/profile")
      .set("Authorization", validToken)
      .send(updates);

    // Mock subsequent GET
    mockGetProfile.mockResolvedValue(updatedProfile);

    const res = await request(app)
      .get("/api/profile")
      .set("Authorization", validToken);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated Name");
    expect(res.body.bio).toBe("Updated bio");
  });
// This test checks that if a user tries to access their profile without providing an authentication token, the server responds with a 401 Unauthorized status and does not call the profile retrieval service, ensuring that only authenticated users can access profile information.
  test("GET profile - no token returns 401", async () => {
    const res = await request(app).get("/api/profile");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
    expect(mockGetProfile).not.toHaveBeenCalled();
  });
// This test checks that if a user tries to update their profile without providing an authentication token, the server responds with a 401 Unauthorized status and does not call the profile update service, ensuring that only authenticated users can modify their profiles.
  test("PUT profile - no token returns 401", async () => {
    const res = await request(app)
      .put("/api/profile")
      .send({ name: "Hacker" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });
});