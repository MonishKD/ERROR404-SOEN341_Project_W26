import { prisma } from "../database/prisma.js";
import { getProfile, updateProfile } from "../services/profileService.js";

export async function getProfileController(req, res) {
  try {
    const profile = await getProfile(req.user.userId);
    res.json(profile);
  } catch (error) {
    console.error("Error loading profile:", error);
    res.status(500).json({ message: error.message || "Failed to load profile" });
  }
}

export async function updateProfileController(req, res) {
  try {
    const result = await updateProfile(req.user.userId, req.body);

    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }

    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: error.message || "Failed to update profile" });
  }
}

export async function getProfileCompletionStatusController(req, res) {
  try {
    const user = await prisma.users.findUnique({
      where: { id: Number.parseInt(req.user.userId, 10) },
      select: { age: true, weight: true, height: true }
    });

    const missingFields = [];
    if (!user?.age) missingFields.push("age");
    if (!user?.weight) missingFields.push("weight");
    if (!user?.height) missingFields.push("height");

    res.json({
      isComplete: missingFields.length === 0,
      missingFields
    });
  } catch (error) {
    console.error("Error checking profile completion:", error);
    res.status(500).json({ error: error.message });
  }
}

export async function updateHealthMetricsController(req, res) {
  try {
    const { age, weight, height } = req.body;

    if (age && (age < 1 || age > 120)) {
      return res.status(400).json({ message: "Invalid age value" });
    }

    if (weight && (weight < 1 || weight > 300)) {
      return res.status(400).json({ message: "Invalid weight value" });
    }

    if (height && (height < 50 || height > 250)) {
      return res.status(400).json({ message: "Invalid height value" });
    }

    const updatedUser = await prisma.users.update({
      where: { id: Number.parseInt(req.user.userId, 10) },
      data: {
        age: age ? Number.parseInt(age, 10) : null,
        weight: weight ? Number.parseFloat(weight) : null,
        height: height ? Number.parseFloat(height) : null
      }
    });

    res.json({
      message: "Health metrics updated successfully",
      user: {
        age: updatedUser.age,
        weight: updatedUser.weight,
        height: updatedUser.height
      }
    });
  } catch (error) {
    console.error("Error updating health metrics:", error);
    res.status(500).json({ error: error.message });
  }
}