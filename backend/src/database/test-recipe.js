// test-recipe.js
import { prisma } from './prisma.js';

async function testRecipes() {
  try {
    // CREATE a recipe
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

    // UPDATE a recipe
    const updatedRecipe = await prisma.recipes.update({
      where: { id: newRecipe.id },
      data: { prep_time: 25 }
    });
    console.log('✅ Updated recipe prep time to:', updatedRecipe.prep_time, 'minutes');

    // 🚫 DELETE section removed - your recipe will stay in the database!

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testRecipes();