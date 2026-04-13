import { getToken, clearToken, isAuthenticated, getInitials, logout, fetchRecipeData, notificationManager } from "./script.js";
const API_BASE_URL = 'http://localhost:4002/api';
/**
 * Helper to set field value
 */
function setFieldValue(id, value) {
  const field = document.getElementById(id);
  if (field && value) {
    field.value = value;
  }
}
/**
 * Populate edit form with recipe data
 */
function populateEditForm(recipe) {
  // Basic fields
  setFieldValue('recipeName', recipe.name);
  setFieldValue('prepTime', recipe.prep_time);
  setFieldValue('cost', recipe.cost);
  setFieldValue('difficulty', recipe.difficulty);

  // Convert ingredients to text for editing
  if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
    setFieldValue('ingredients', recipe.ingredients.join('\n'));
  }

  // Convert steps to text for editing
  if (recipe.prep_steps && Array.isArray(recipe.prep_steps)) {
    setFieldValue('steps', recipe.prep_steps.join('\n'));
  }


  // Dietary tags checkboxes
  if (recipe.dietary_tags && Array.isArray(recipe.dietary_tags)) {
    recipe.dietary_tags.forEach(tag => {
      // Map database values back to form values
      let formValue = tag;
      if (tag === 'Gluten-Free') formValue = 'gluten-free';
      if (tag === 'Dairy-Free') formValue = 'dairy-free';
      if (tag === 'Nut-Free') formValue = 'nut-free';
      if (tag === 'Vegan') formValue = 'vegan';
      if (tag === 'Vegetarian') formValue = 'vegetarian';
      if (tag === 'Halal') formValue = 'halal';

      const checkbox = document.querySelector(`input[name="dietary"][value="${formValue}"]`);
      if (checkbox) checkbox.checked = true;
    });
  }

  // Allergens checkboxes
  if (recipe.allergens && Array.isArray(recipe.allergens)) {
    const customAllergies = [];

    recipe.allergens.forEach(allergen => {
      const checkbox = document.querySelector(`input[name="allergy"][value="${allergen.toLowerCase()}"]`);
      if (checkbox) {
        checkbox.checked = true;
      } else {
        customAllergies.push(allergen);
      }
    });

    // Set custom allergies
    if (customAllergies.length > 0) {
      const otherAllergies = document.getElementById('otherAllergies');
      if (otherAllergies) {
        otherAllergies.value = customAllergies.join(', ');
      }
    }
  }
}
/**
 * Update recipe
 */
async function updateRecipe(recipeId) {
  // Get form values
  const dietaryTags = getSelectedDietaryTags();
  const allergens = getSelectedAllergens();

  // Convert ingredients from text to array
  const ingredientsText = document.getElementById('ingredients')?.value || '';
  const ingredientsArray = ingredientsText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  // Convert steps from text to array
  const stepsText = document.getElementById('steps')?.value || '';
  const stepsArray = stepsText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const recipeData = {
    name: document.getElementById('recipeName')?.value,
    prep_time: parseInt(document.getElementById('prepTime')?.value),
    cost: document.getElementById('cost')?.value,
    difficulty: document.getElementById('difficulty')?.value,
    ingredients: ingredientsArray,
    prep_steps: stepsArray,
    dietary_tags: dietaryTags,
    allergens: allergens
  };

  console.log('Updating recipe with data:', recipeData);

  // Validate required fields
  if (!recipeData.name || !recipeData.prep_time || !ingredientsArray.length || !stepsArray.length) {
    notificationManager.error('Please fill in all required fields');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(recipeData)
    });

    const responseData = await response.json();
    console.log('Server response:', responseData);

    if (response.ok) {
      notificationManager.success('Recipe updated successfully!');
      window.location.href = '/pages/recipes.html';
    } else {
      notificationManager.error('Error: ' + (responseData.message || 'Failed to update recipe'));
    }
  } catch (error) {
    console.error('Error updating recipe:', error);
    notificationManager.error('Failed to update recipe. Please try again.');
  }
}

// initialization
document.addEventListener('DOMContentLoaded', async () => {
    console.log('✏️ INIT_EDIT_RECIPE PAGE');
    
    // Check authentication
    if (!isAuthenticated()) {
    window.location.href = '/pages/login-page.html';
    return;
    }

    getInitials();

    // Get recipe ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get('id');

    if (!recipeId) {
        notificationManager.error('No recipe ID specified');
        window.location.href = '/pages/recipes.html';
        return;
    }

    // Fetch recipe data
    const recipe = await fetchRecipeData(recipeId);

    // Populate form fields
    populateEditForm(recipe);

    // Setup form submission
    const form = document.getElementById('editRecipeForm');
    if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await updateRecipe(recipeId);
    });
    }

    // log out functionality
    logout();
});