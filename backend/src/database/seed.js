import { prisma } from "./prisma.js";

async function main() {
  const ownerId = 1;

  // Optional: clear old recipes
  await prisma.recipes.deleteMany();

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
    ],
    skipDuplicates: true,
  });

  console.log("✅ Seeded NEW My Recipes (no duplicates with General Recipes)!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());


