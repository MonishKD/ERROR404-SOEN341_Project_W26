// recipesService.js
import { prisma } from '../database/prisma.js';

// Create a new recipe
export async function createRecipe(recipeData) {
  try {
    const newRecipe = await prisma.recipes.create({
      data: recipeData,
      include: { owner: { select: { firstName: true, lastName: true, email: true } } }
    });
    return newRecipe;
  } catch (error) {
    console.error('Error creating recipe:', error);
    throw error; // re-throw to be handled by route handler
  }
}

// Get all recipes, optionally filtered with a Prisma `where` clause
export async function getAllRecipes(where) {
  try {
    const recipes = await prisma.recipes.findMany({
      where,
      include: { owner: { select: { firstName: true, lastName: true, email: true } } }
    });
    return recipes;
  } catch (error) {
    console.error('Error fetching recipes:', error);
    throw error; // re-throw to be handled by route handler
  }
}

// Get a recipe by ID
export async function getRecipeById(recipeId) {
  try {
    const recipe = await prisma.recipes.findUnique({
      where: { id: recipeId },
      include: { owner: { select: { firstName: true, lastName: true, email: true } } }
    });
    return recipe;
  }
  catch (error) {
    console.error('Error fetching recipe by ID:', error);
    throw error; // re-throw to be handled by route handler
  }
}

// Update a recipe by ID
export async function updateRecipe(recipeId, updateData) {
  try {
    const findRecipe = await prisma.recipes.findUnique({
      where: { id: recipeId },
    });

    if (!findRecipe) {
      throw new Error('Recipe not found');
    }

    const updatedRecipe = await prisma.recipes.update({
      where: { id: recipeId },
      data: updateData,
      include: { owner: { select: { firstName: true, lastName: true, email: true } } }
    });

    return updatedRecipe;
  } catch (error) {
    console.error('Error updating recipe:', error);
    throw error; // re-throw to be handled by route handler
  }
}

// Delete a recipe by ID
export async function deleteRecipe(recipeId) {
  try {
    const findRecipe = await prisma.recipes.findUnique({
      where: { id: recipeId },
    });

    if (!findRecipe) {
      throw new Error('Recipe not found');
    }
    await prisma.recipes.delete({
      where: { id: recipeId }
    });

    return { success: true, message: 'Recipe deleted successfully' };

  } catch (error) {
    console.error('Error deleting recipe:', error);
    throw error; // re-throw to be handled by route handler
  }
}

// get recipe ratings by ID
export async function recipeRatings(id) {
  try {
    const ratings = await prisma.RecipeRating.findMany({
      where: { recipeId: id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return ratings;
  } catch (error) {
    throw error;
  }
}

export async function videoRecipe(videoData){
  try{
    const newVideo = await prisma.video.upsert({
      where: {
        recipeId: recipeId,
      },
      update: videoData,
      create: videoData,
    });
    return newVideo;
  } catch (error) {
    throw error;
  }
}
