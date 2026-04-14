// seed.js

// This script seeds the database with initial recipe data.
// It can be run with `node scripts/seed.js` to populate the recipes table with sample recipes for testing and development. 

import { prisma } from "../src/database/prisma.js";

async function main() {
  const ownerId = 1;

  await prisma.recipes.createMany({
    data: [
      {
        name: "Spicy Chickpea Wrap",
        prep_time: 12,
        cost: "Low",
        ingredients: ["chickpeas", "tortilla", "tahini", "lemon", "cucumber", "vegan"],
        prep_steps: ["Mash chickpeas + spices.", "Spread tahini.", "Add veggies.", "Wrap. (vegan)"],
        difficulty: "Easy",
        dietary_tags: ["Vegan"],
        allergens: ["Gluten", "Sesame"],
        ownerId,
      },
      {
        name: "Garlic Butter Shrimp Pasta",
        prep_time: 25,
        cost: "Medium",
        ingredients: ["shrimp", "pasta", "garlic", "butter", "parsley"],
        prep_steps: ["Boil pasta.", "Sauté garlic + butter.", "Add shrimp.", "Toss with pasta."],
        difficulty: "Medium",
        dietary_tags: ["Dairy-Free"],
        allergens: ["Shellfish", "Gluten", "Dairy"],
        ownerId,
      },
      {
        name: "One-Pan Veggie Fried Rice",
        prep_time: 30,
        cost: "Low",
        ingredients: ["rice", "soy sauce", "carrots", "peas", "eggs", "vegetarian"],
        prep_steps: ["Cook rice.", "Stir-fry veggies.", "Add rice + soy sauce.", "Add eggs. (vegetarian)"],
        difficulty: "Easy",
        dietary_tags: ["Vegetarian"],
        allergens: ["Soy", "Eggs", "Gluten"],
        ownerId,
      },
      {
        name: "Slow-Cooked Beef Chili",
        prep_time: 75,
        cost: "Medium",
        ingredients: ["ground beef", "beans", "tomato", "onion", "spices", "gluten-free"],
        prep_steps: ["Brown beef.", "Add all ingredients.", "Simmer 60+ min. (gluten-free)"],
        difficulty: "Medium",
        dietary_tags: ["Gluten-Free"],
        allergens: [],
        ownerId,
      },
      {
        name: "Salmon & Lemon Tray Bake",
        prep_time: 45,
        cost: "High",
        ingredients: ["salmon", "lemon", "potatoes", "broccoli", "dairy-free"],
        prep_steps: ["Season salmon + veggies.", "Bake 35–40 min. (dairy-free)"],
        difficulty: "Easy",
        dietary_tags: ["Dairy-Free"],
        allergens: ["Fish"],
        ownerId,
      },
      {
        name: "Halal Chicken Shawarma Bowl",
        prep_time: 35,
        cost: "Low",
        ingredients: ["chicken", "rice", "garlic sauce", "cucumber", "halal"],
        prep_steps: ["Season chicken shawarma-style.", "Cook rice.", "Assemble bowl. (halal)"],
        difficulty: "Medium",
        dietary_tags: ["Halal", "Dairy-Free"],
        allergens: ["Gluten", "Dairy"],
        ownerId,
      },
      // Snacks 
      {
        name: "Hummus & Veggie Sticks",
        prep_time: 10,
        cost: "Low",
        ingredients: ["chickpeas", "tahini", "lemon", "garlic", "carrots", "celery", "bell pepper"],
        prep_steps: ["Blend chickpeas, tahini, lemon, garlic.", "Season with salt + cumin.", "Slice veggies.", "Serve together. (vegan)"],
        difficulty: "Easy",
        dietary_tags: ["Vegan", "Gluten-Free"],
        allergens: ["Sesame"],
        ownerId,
      },
      {
        name: "Peanut Butter Energy Balls",
        prep_time: 15,
        cost: "Low",
        ingredients: ["oats", "peanut butter", "honey", "chocolate chips", "chia seeds"],
        prep_steps: ["Mix all ingredients in a bowl.", "Roll into small balls.", "Refrigerate 30 min before serving."],
        difficulty: "Easy",
        dietary_tags: ["Vegetarian"],
        allergens: ["Peanuts", "Gluten"],
        ownerId,
      },
      // Breakfast
      {
        name: "Avocado Toast with Poached Egg",
        prep_time: 15,
        cost: "Low",
        ingredients: ["sourdough bread", "avocado", "eggs", "lemon", "chili flakes", "salt"],
        prep_steps: ["Toast bread.", "Mash avocado with lemon + salt.", "Poach egg 3–4 min.", "Assemble and top with chili flakes."],
        difficulty: "Easy",
        dietary_tags: ["Vegetarian"],
        allergens: ["Gluten", "Eggs"],
        ownerId,
      },
      {
        name: "Banana Oat Pancakes",
        prep_time: 20,
        cost: "Low",
        ingredients: ["oats", "banana", "eggs", "baking powder", "cinnamon", "maple syrup"],
        prep_steps: ["Blend oats into flour.", "Mash banana + mix with eggs + baking powder.", "Cook small pancakes on medium heat 2 min per side.", "Serve with maple syrup. (gluten-free)"],
        difficulty: "Easy",
        dietary_tags: ["Gluten-Free", "Vegetarian"],
        allergens: ["Eggs"],
        ownerId,
      },
      {
        name: "Greek Yogurt Parfait",
        prep_time: 8,
        cost: "Low",
        ingredients: ["greek yogurt", "granola", "mixed berries", "honey", "chia seeds"],
        prep_steps: ["Layer yogurt in a glass.", "Add granola + berries.", "Drizzle honey.", "Top with chia seeds."],
        difficulty: "Easy",
        dietary_tags: ["Vegetarian"],
        allergens: ["Dairy", "Gluten", "Nuts"],
        ownerId,
      },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Seeded NEW My Recipes (no duplicates with General Recipes)!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());


