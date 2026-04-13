import { getToken, isAuthenticated, getInitials, logout } from "./script.js";
const API_BASE_URL = 'http://localhost:4002/api';

/**
 * Helper functions to get selected tags
 */
function getSelectedDietaryTags() {
  const checkboxes = document.querySelectorAll('input[name="dietary"]:checked');
  return Array.from(checkboxes).map(cb => cb.value);
}

function getSelectedAllergens() {
  const checkboxes = document.querySelectorAll('input[name="allergy"]:checked');
  const customAllergies = document.getElementById('otherAllergies')?.value
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0) || [];

  const selectedAllergies = Array.from(checkboxes).map(cb => cb.value);
  return [...selectedAllergies, ...customAllergies];
}
/**
 * Save new recipe in database
 */
async function saveRecipe(event) {
  event.preventDefault();

  // Get form values once
  const dietaryTags = getSelectedDietaryTags();
  const allergens = getSelectedAllergens();

  const ingredientsText = document.getElementById('ingredients')?.value || '';
  const ingredientsArray = ingredientsText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const stepsText = document.getElementById('steps')?.value || '';
  const stepsArray = stepsText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const recipeData = {
    name: document.getElementById('recipeName')?.value,
    prep_time: Number.parseInt(document.getElementById('prepTime')?.value),
    cost: document.getElementById('cost')?.value,
    difficulty: document.getElementById('difficulty')?.value,
    ingredients: ingredientsArray,
    prep_steps: stepsArray,
    dietary_tags: dietaryTags,
    allergens: allergens
  };

  console.log('Saving recipe with data:', recipeData);

  // Validate required fields
  if (!recipeData.name || !recipeData.prep_time || !ingredientsArray.length || !stepsArray.length) {
    alert('Please fill in all required fields');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/recipes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(recipeData)
    });

    const responseData = await response.json();
    console.log('Server response:', responseData);

    if (response.ok) {
      alert('Recipe saved successfully!');
      globalThis.location.href = '/pages/recipes.html';
    } else {
      alert('Error: ' + (responseData.message || 'Failed to save recipe'));
    }
  } catch (error) {
    console.error('Error saving recipe:', error);
    alert('Failed to save recipe. Please try again.');
  }
}

// page initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('📝 INIT_CREATE_RECIPE PAGE');

    // Check authentication
    if (!isAuthenticated()) {
    globalThis.location.href = '/pages/login-page.html';
    return;
    }

    getInitials();

    const form = document.getElementById('createRecipeForm');
    if (!form) return;

    // Override the default form submission
    form.addEventListener('submit', saveRecipe);

    // log out functionality
    logout();
});