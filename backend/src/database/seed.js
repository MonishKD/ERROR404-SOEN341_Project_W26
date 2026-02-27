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
        cost: 5,
        ingredients: "chickpeas, tortilla, tahini, lemon, cucumber, vegan",
        prep_steps: "Mash chickpeas + spices. Spread tahini. Add veggies. Wrap. (vegan)",
        ownerId,
      },
      {
        name: "Garlic Butter Shrimp Pasta",
        prep_time: 25,
        cost: 16,
        ingredients: "shrimp, pasta, garlic, butter, parsley",
        prep_steps: "Boil pasta. Sauté garlic + butter. Add shrimp. Toss with pasta.",
        ownerId,
      },
      {
        name: "One-Pan Veggie Fried Rice",
        prep_time: 30,
        cost: 9,
        ingredients: "rice, soy sauce, carrots, peas, eggs, vegetarian",
        prep_steps: "Cook rice. Stir-fry veggies. Add rice + soy sauce. Add eggs. (vegetarian)",
        ownerId,
      },
      {
        name: "Slow-Cooked Beef Chili",
        prep_time: 75,
        cost: 20,
        ingredients: "ground beef, beans, tomato, onion, spices, gluten-free",
        prep_steps: "Brown beef. Add all ingredients. Simmer 60+ min. (gluten-free)",
        ownerId,
      },
      {
        name: "Salmon & Lemon Tray Bake",
        prep_time: 45,
        cost: 18,
        ingredients: "salmon, lemon, potatoes, broccoli, dairy-free",
        prep_steps: "Season salmon + veggies. Bake 35–40 min. (dairy-free)",
        ownerId,
      },
      {
        name: "Halal Chicken Shawarma Bowl",
        prep_time: 35,
        cost: 14,
        ingredients: "chicken, rice, garlic sauce, cucumber, halal",
        prep_steps: "Season chicken shawarma-style. Cook rice. Assemble bowl. (halal)",
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


  