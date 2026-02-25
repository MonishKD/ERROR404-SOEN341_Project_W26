// recipesService.js
import { prisma } from '../database/prisma.js';

async function testRecipes() {
  try {
    // CREATE a recipe Laila's task
    const newRecipe = await prisma.recipes.create({
      data: {
        name: 'Spaghetti',
        ingredients: 'Pasta, eggs, cheese, black pepper',
        prep_time: 20,
        prep_steps: '1. Boil pasta\n2. Mix eggs and cheese\n3. Combine',
        cost: 12.50
      }
    });
    console.log('✅ Created recipe:', newRecipe.name, '(ID:', newRecipe.id, ')');

    // READ all recipes
    const allRecipes = await prisma.recipes.findMany();
    console.log(`📊 Total recipes in db: ${allRecipes.length}`);
    console.log('Recipes:', allRecipes);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

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
