import multer from "multer";
import { prisma } from "../database/prisma.js";
import { checkRecipeOwner } from "../middleware/auth.js";
import {
  createRecipe,
  getAllRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
  recipeRatings,
  createOrUpdateRecipeRating,
  videoRecipe,
  getExploreRecipes
} from "../services/recipesService.js";

const upload = multer({ storage: multer.memoryStorage() });

export { upload, checkRecipeOwner };

export async function getAllRecipesController(req, res) {
  try {
    console.log({
      message: "/api/recipes route HIT",
      query: req.query,
      time: new Date().toISOString(),
    });

    const q = (req.query.q || "").trim();
    const ownerId = parseInt(req.user.userId, 10);

    const normalize = (v) =>
      (v || "")
        .toString()
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    const timeVals = normalize(req.query.time);
    const costVals = normalize(req.query.cost);
    const dietaryVals = normalize(req.query.dietary);
    const difficultyVals = normalize(req.query.difficulty);
    const allergyVals = normalize(req.query.allergies);

    const AND = [];
    AND.push({ ownerId });

    if (q) {
      AND.push({
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { ingredients: { has: q } },
          { prep_steps: { has: q } },
        ],
      });
    }

    if (timeVals.length) {
      const timeOR = [];

      for (const time of timeVals) {
        if (time === "under-15") timeOR.push({ prep_time: { lt: 15 } });
        else if (time === "15-30") timeOR.push({ prep_time: { gte: 15, lte: 30 } });
        else if (time === "30-60") timeOR.push({ prep_time: { gte: 30, lte: 60 } });
        else if (time === "60plus") timeOR.push({ prep_time: { gt: 60 } });
      }

      if (timeOR.length) AND.push({ OR: timeOR });
    }

    if (costVals.length) {
      const costOR = [];
      for (const cost of costVals) {
        if (cost === "low") costOR.push({ cost: "Low" });
        else if (cost === "medium") costOR.push({ cost: "Medium" });
        else if (cost === "high") costOR.push({ cost: "High" });
      }
      if (costOR.length) AND.push({ OR: costOR });
    }

    if (dietaryVals.length) {
      const dietaryOR = [];

      for (const dietary of dietaryVals) {
        let dbValue = dietary;
        if (dietary === "gluten-free") dbValue = "Gluten-Free";
        else if (dietary === "dairy-free") dbValue = "Dairy-Free";
        else if (dietary === "nut-free") dbValue = "Nut-Free";

        dietaryOR.push({ dietary_tags: { has: dbValue } });
      }
      if (dietaryOR.length) AND.push({ OR: dietaryOR });
    }

    if (difficultyVals.length) {
      const difficultyOR = [];
      for (const difficulty of difficultyVals) {
        const capitalized = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
        if (["Easy", "Medium", "Hard"].includes(capitalized)) {
          difficultyOR.push({ difficulty: capitalized });
        }
      }
      if (difficultyOR.length) AND.push({ OR: difficultyOR });
    }

    if (allergyVals.length) {
      const allergyOR = [];
      for (const allergy of allergyVals) {
        let dbValue = allergy;
        if (allergy === "nut-free") dbValue = "Nut-Free";
        else if (allergy === "dairy-free") dbValue = "Dairy-Free";
        else if (allergy === "gluten-free") dbValue = "Gluten-Free";

        allergyOR.push({ allergens: { has: dbValue } });
      }
      if (allergyOR.length) AND.push({ OR: allergyOR });
    }

    const where = AND.length ? { AND } : undefined;
    const recipes = await getAllRecipes(where);
    return res.json(recipes);
  } catch (error) {
    console.error("Error fetching recipes:", error);
    return res.status(500).json({ error: error.message });
  }
}

export async function createRecipeController(req, res) {
  try {
    const { name, ingredients, prep_time, prep_steps, cost, difficulty, dietary_tags, allergens } = req.body;
    const ownerId = parseInt(req.user.userId, 10);

    let ingredientsArray = ingredients;
    if (typeof ingredients === "string") {
      try {
        ingredientsArray = JSON.parse(ingredients);
      } catch {
        if (ingredients.includes("\n")) {
          ingredientsArray = ingredients.split("\n").map(i => i.trim()).filter(Boolean);
        } else if (ingredients.includes(",")) {
          ingredientsArray = ingredients.split(",").map(i => i.trim()).filter(Boolean);
        } else {
          ingredientsArray = [ingredients];
        }
      }
    }
    if (!Array.isArray(ingredientsArray)) {
      ingredientsArray = ingredientsArray ? [ingredientsArray] : [];
    }

    let prepStepsArray = prep_steps;
    if (typeof prep_steps === "string") {
      try {
        prepStepsArray = JSON.parse(prep_steps);
      } catch {
        if (prep_steps.includes("\n")) {
          prepStepsArray = prep_steps.split("\n").map(s => s.trim()).filter(Boolean);
        } else if (prep_steps.includes(".")) {
          prepStepsArray = prep_steps.split(".").map(s => s.trim()).filter(Boolean);
        } else {
          prepStepsArray = [prep_steps];
        }
      }
    }
    if (!Array.isArray(prepStepsArray)) {
      prepStepsArray = prepStepsArray ? [prepStepsArray] : [];
    }

    let parsedDietaryTags = dietary_tags;
    if (typeof dietary_tags === "string") {
      try {
        parsedDietaryTags = JSON.parse(dietary_tags);
      } catch {}
    }
    const dietaryTagsArray = Array.isArray(parsedDietaryTags) ? parsedDietaryTags : [];

    const mappedDietaryTags = dietaryTagsArray.map(tag => {
      if (tag === "gluten-free" || tag === "Gluten-Free") return "Gluten-Free";
      if (tag === "dairy-free" || tag === "Dairy-Free") return "Dairy-Free";
      if (tag === "nut-free" || tag === "Nut-Free") return "Nut-Free";
      if (tag === "vegan" || tag === "Vegan") return "Vegan";
      if (tag === "vegetarian" || tag === "Vegetarian") return "Vegetarian";
      if (tag === "halal" || tag === "Halal") return "Halal";
      return tag;
    });

    let allergensArray = allergens;
    if (typeof allergens === "string") {
      try {
        allergensArray = JSON.parse(allergens);
      } catch {
        if (allergens.includes(",")) {
          allergensArray = allergens.split(",").map(a => a.trim()).filter(Boolean);
        } else if (allergens.length > 0) {
          allergensArray = [allergens];
        } else {
          allergensArray = [];
        }
      }
    }
    if (!Array.isArray(allergensArray)) {
      allergensArray = allergensArray ? [allergensArray] : [];
    }

    const recipeData = {
      name,
      ingredients: ingredientsArray,
      prep_time: parseInt(prep_time, 10),
      prep_steps: prepStepsArray,
      cost,
      difficulty,
      dietary_tags: mappedDietaryTags,
      allergens: allergensArray,
      ownerId
    };

    const newRecipe = await createRecipe(recipeData);
    res.status(201).json(newRecipe);
  } catch (error) {
    console.error("Error creating recipe:", error);
    res.status(500).json({ error: error.message });
  }
}

export async function getExploreRecipesController(req, res) {
  try {
    const currentUserId = parseInt(req.user.userId, 10);
    const recipes = await getExploreRecipes(currentUserId);
    return res.json(recipes);
  } catch (error) {
    console.error("Error fetching explore recipes:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function getRecipeByIdController(req, res) {
  try {
    const recipe = await getRecipeById(parseInt(req.params.id, 10));
    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }
    res.json(recipe);
  } catch (error) {
    console.error("Error fetching recipe:", error);
    res.status(500).json({ error: error.message });
  }
}

export async function updateRecipeController(req, res) {
  try {
    const { name, ingredients, prep_time, prep_steps, cost, difficulty, dietary_tags, allergens } = req.body;

    let ingredientsArray = ingredients;
    if (typeof ingredients === "string") {
      try {
        ingredientsArray = JSON.parse(ingredients);
      } catch {
        if (ingredients.includes("\n")) {
          ingredientsArray = ingredients.split("\n").map(i => i.trim()).filter(Boolean);
        } else if (ingredients.includes(",")) {
          ingredientsArray = ingredients.split(",").map(i => i.trim()).filter(Boolean);
        } else {
          ingredientsArray = ingredients ? [ingredients] : undefined;
        }
      }
    }

    let prepStepsArray = prep_steps;
    if (typeof prep_steps === "string") {
      try {
        prepStepsArray = JSON.parse(prep_steps);
      } catch {
        if (prep_steps.includes("\n")) {
          prepStepsArray = prep_steps.split("\n").map(s => s.trim()).filter(Boolean);
        } else if (prep_steps.includes(".")) {
          prepStepsArray = prep_steps.split(".").map(s => s.trim()).filter(Boolean);
        } else {
          prepStepsArray = prep_steps ? [prep_steps] : undefined;
        }
      }
    }

    let mappedDietaryTags = [];
    if (dietary_tags && Array.isArray(dietary_tags)) {
      mappedDietaryTags = dietary_tags.map(tag => {
        if (tag === "gluten-free") return "Gluten-Free";
        if (tag === "dairy-free") return "Dairy-Free";
        if (tag === "nut-free") return "Nut-Free";
        if (tag === "vegan") return "Vegan";
        if (tag === "vegetarian") return "Vegetarian";
        if (tag === "halal") return "Halal";
        return tag;
      });
    }

    let allergensArray = allergens;
    if (typeof allergens === "string") {
      try {
        allergensArray = JSON.parse(allergens);
      } catch {
        if (allergens.includes(",")) {
          allergensArray = allergens.split(",").map(a => a.trim()).filter(Boolean);
        } else {
          allergensArray = allergens ? [allergens] : [];
        }
      }
    }
    if (allergensArray && !Array.isArray(allergensArray)) {
      allergensArray = [allergensArray];
    }

    const updateData = {
      name,
      ingredients: ingredientsArray,
      prep_time: prep_time ? parseInt(prep_time, 10) : undefined,
      prep_steps: prepStepsArray,
      cost,
      difficulty,
      dietary_tags: mappedDietaryTags,
      allergens: allergensArray || []
    };

    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    const updatedRecipe = await updateRecipe(parseInt(req.params.id, 10), updateData);
    res.json(updatedRecipe);
  } catch (error) {
    console.error("Error updating recipe:", error);
    res.status(500).json({ error: error.message });
  }
}

export async function deleteRecipeController(req, res) {
  try {
    await deleteRecipe(parseInt(req.params.id, 10));
    res.json({ message: "Recipe deleted successfully" });
  } catch (error) {
    console.error("Error deleting recipe:", error);
    res.status(500).json({ error: error.message });
  }
}

export async function updateRecipePrivacyController(req, res) {
  try {
    const { is_private } = req.body;

    const updatedRecipe = await updateRecipe(parseInt(req.params.id, 10), {
      is_private
    });

    res.json(updatedRecipe);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getRecipeRatingsController(req, res) {
  try {
    const ratings = await recipeRatings(parseInt(req.params.recipeId, 10));
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getAverageRatingController(req, res) {
  try {
    const ratings = await recipeRatings(parseInt(req.params.recipeId, 10));
    const average =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

    res.json(average);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function createOrUpdateRecipeRatingController(req, res) {
  try {
    const userId = parseInt(req.user.userId, 10);
    const { recipeId, rating, comment } = req.body;

    if (!recipeId || Number.isNaN(parseInt(recipeId, 10))) {
      return res.status(400).json({ message: "Valid recipeId is required" });
    }

    const parsedRecipeId = parseInt(recipeId, 10);

    if (rating === null || rating === undefined) {
      return res.status(400).json({ message: "Rating is required" });
    }

    const parsedRating = parseInt(rating, 10);
    if (Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const recipe = await prisma.recipes.findUnique({
      where: { id: parsedRecipeId }
    });

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    const savedRating = await createOrUpdateRecipeRating(
      parsedRecipeId,
      userId,
      parsedRating,
      comment?.trim() || null
    );

    res.status(200).json(savedRating);
  } catch (error) {
    console.error("Error saving recipe rating/comment:", error);
    res.status(500).json({ message: error.message || "Failed to save rating/comment" });
  }
}

export async function uploadRecipeVideoController(req, res) {
  try {
    const recipeId = parseInt(req.params.id, 10);

    if (!req.file) {
      return res.status(400).json({ error: "No video uploaded" });
    }

    const data = {
      videoData: req.file.buffer,
      videoType: "UPLOADED",
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      title: req.file.originalname
    };

    const newVideo = await videoRecipe(recipeId, data);
    res.json(newVideo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

export async function saveRecipeVideoUrlController(req, res) {
  try {
    const recipeId = parseInt(req.params.id, 10);
    const { videoUrl } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ error: "Video URL required" });
    }

    const data = {
      videoUrl,
      videoType: "EXTERNAL"
    };

    const newVideo = await videoRecipe(recipeId, data);
    res.json(newVideo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

export async function getRecipeVideoController(req, res) {
  try {
    const recipeId = parseInt(req.params.id, 10);

    const video = await prisma.video.findFirst({
      where: { recipeId }
    });

    if (!video) {
      return res.status(404).json({ error: "No video found" });
    }

    if (video.videoData) {
      res.set("Content-Type", video.fileType || "video/mp4");
      return res.send(video.videoData);
    }

    if (video.videoUrl) {
      return res.json({
        type: "url",
        videoUrl: video.videoUrl
      });
    }

    return res.status(404).json({ error: "No valid video data" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}