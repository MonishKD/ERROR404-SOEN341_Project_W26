// script.js
// Frontend-Backend Integration for MealMajor
// Handles: Login, Signup, Form Validation, Token Management, Profile Loading, Recipes


// CONFIGURATION
const API_BASE_URL = 'http://localhost:4002/api';
const TOKEN_KEY = 'mealmajor_token';

// Global variable to store all recipes for filtering
let allRecipes = [];


// UTILITY FUNCTIONS
/**
 * Store authentication token in localStorage
 */
function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Retrieve authentication token from localStorage
 */
function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Remove authentication token (logout)
 */
function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
  return !!getToken();
}

/**
 * Display error message in a form field
 */
function showError(elementId, message) {
  const errorElement = document.getElementById(elementId);
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
}

/**
 * Clear error message from a form field
 */
function clearError(elementId) {
  const errorElement = document.getElementById(elementId);
  if (errorElement) {
    errorElement.textContent = '';
    errorElement.style.display = 'none';
  }
}

/**
 * Clear all error messages on a page
 */
function clearAllErrors() {
  const errorElements = document.querySelectorAll('.error');
  errorElements.forEach(el => {
    el.textContent = '';
    el.style.display = 'none';
  });
}

/**
 * Show loading state on button
 */
function setButtonLoading(button, isLoading) {
  if (isLoading) {
    button.disabled = true;
    button.dataset.originalText = button.querySelector('span')?.textContent || button.textContent;
    const spanElement = button.querySelector('span');
    if (spanElement) {
      spanElement.childNodes[0].textContent = 'Loading...';
    } else {
      button.textContent = 'Loading...';
    }
  } else {
    button.disabled = false;
    const spanElement = button.querySelector('span');
    if (spanElement && button.dataset.originalText) {
      spanElement.childNodes[0].textContent = button.dataset.originalText;
    } else if (button.dataset.originalText) {
      button.textContent = button.dataset.originalText;
    }
  }
}


// VALIDATION FUNCTIONS
/**
 * Validate email format
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * Requirements: At least 8 characters, 1 number, 1 special character
 */
function validatePassword(password) {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/\d/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }
  return { valid: true, message: '' };
}


// API FUNCTIONS
/**
 * Login user
 */
async function loginUser(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Register new user
 */
async function registerUser(firstName, lastName, email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ firstName, lastName, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get user profile
 */
async function getUserProfile() {
  try {
    const token = getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch profile');
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Update user profile
 */
async function updateUserProfile(updates) {
  try {
    const token = getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update profile');
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Fetch recipes from the API
 */
async function fetchRecipes(ownerId = null) {
  try {
    let url = `${API_BASE_URL}/recipes`;
    if (ownerId) {
      url += `?ownerId=${ownerId}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch recipes');
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return { success: false, error: error.message };
  }
}


// PROFILE FUNCTIONS
/**
 * Check profile completion status
 */
async function checkProfileCompletion() {
  console.log('🔍 CHECK_PROFILE_COMPLETION STARTED at:', new Date().toISOString());

  const token = getToken();
  console.log('Token exists:', !!token);

  const prompt = document.getElementById('profilePrompt');
  console.log('Prompt element found:', !!prompt);
  console.log('Prompt current classes:', prompt ? prompt.className : 'N/A');

  if (!token) {
    console.log('❌ No token, cannot check profile');
    return;
  }

  if (!prompt) {
    console.error('❌ CRITICAL: Profile prompt element not found in DOM!');
    return;
  }

  try {
    console.log('📡 Fetching from:', `${API_BASE_URL}/profile/completion-status`);

    const response = await fetch(`${API_BASE_URL}/profile/completion-status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response OK:', response.ok);

    const data = await response.json();
    console.log('📡 Response data:', data);

    if (response.ok && !data.isComplete) {
      console.log('❌ Profile incomplete. Missing fields:', data.missingFields);
      console.log('⏰ Scheduling prompt to show in 2 seconds...');

      // Clear any existing timeout
      if (window.promptTimeout) {
        clearTimeout(window.promptTimeout);
      }

      window.promptTimeout = setTimeout(() => {
        console.log('⏰ EXECUTING SHOW PROMPT NOW');
        showProfilePrompt(data.missingFields);
      }, 2000);
    } else if (response.ok && data.isComplete) {
      console.log('✅ Profile is complete!');
      // Make sure prompt is hidden if profile is complete
      prompt.classList.add('hidden');
    } else {
      console.log('❌ Unexpected response:', data);
    }
  } catch (error) {
    console.error('❌ Error in checkProfileCompletion:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  }
}

/**
 * Show profile prompt
 */
function showProfilePrompt(missingFields) {
  const prompt = document.getElementById('profilePrompt');
  if (prompt) {
    prompt.classList.remove('hidden');

    // Customize message based on missing fields
    const message = document.querySelector('.prompt-content p');
    if (message && missingFields.length > 0) {
      const fieldNames = missingFields.map(f => {
        switch (f) {
          case 'age': return 'age';
          case 'weight': return 'weight';
          case 'height': return 'height';
          default: return f;
        }
      }).join(', ');

      message.textContent = `We notice you haven't entered your personal information yet. Help us personalize your experience!`;
    }
  }
}

/**
 * Close prompt
 */
function closePrompt() {
  const prompt = document.getElementById('profilePrompt');
  if (prompt) {
    prompt.classList.add('hidden');
  }
}

/**
 * Show success toast
 */
function showSuccessToast(message) {
  const toast = document.getElementById('successToast');
  const toastMessage = document.querySelector('.toast-message');

  if (toast && toastMessage) {
    toastMessage.textContent = message || 'Profile updated successfully!';
    toast.classList.remove('hidden');

    // Auto hide after 3 seconds
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 3000);
  }
}

/**
 * Save health metrics
 */
async function saveHealthMetrics(event) {
  event.preventDefault();

  const age = document.getElementById('promptAge').value;
  const weight = document.getElementById('promptWeight').value;
  const height = document.getElementById('promptHeight').value;

  // Remove error classes
  document.querySelectorAll('.metric-input-group input').forEach(input => {
    input.classList.remove('error');
  });

  // Validate inputs
  let hasError = false;

  if (!age || age < 1 || age > 120) {
    document.getElementById('promptAge').classList.add('error');
    hasError = true;
  }

  if (!weight || weight < 1 || weight > 300) {
    document.getElementById('promptWeight').classList.add('error');
    hasError = true;
  }

  if (!height || height < 50 || height > 250) {
    document.getElementById('promptHeight').classList.add('error');
    hasError = true;
  }

  if (hasError) return;

  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/profile/health-metrics`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        age: parseInt(age),
        weight: parseFloat(weight),
        height: parseFloat(height)
      })
    });

    if (response.ok) {
      closePrompt();
      showSuccessToast('Great! Your profile is now complete! 🎉');

      // Update UI to show completion
      const welcomeCard = document.querySelector('.welcome-card p');
      if (welcomeCard) {
        welcomeCard.innerHTML = 'Your profile is complete! Enjoy personalized recommendations. ✨';
      }
    } else {
      const error = await response.json();
      alert('Error: ' + error.message);
    }
  } catch (error) {
    console.error('Error saving health metrics:', error);
    alert('Failed to save. Please try again.');
  }
}

/**
 * Load user profile and display on home page
 */
async function loadUserProfile() {
  const result = await getUserProfile();

  if (result.success) {
    // Update name display
    const firstNameElement = document.getElementById('firstName');
    if (firstNameElement) {
      firstNameElement.textContent = `${result.data.firstName || 'User'}`;
    }

    const fullNameElement = document.getElementById('fullName');
    if (fullNameElement) {
      fullNameElement.textContent = `${result.data.firstName} ${result.data.lastName}`;
    }
  } else {
    console.error('Failed to load profile:', result.error);
    // If token is invalid, redirect to login
    if (result.error.includes('token') || result.error.includes('auth')) {
      clearToken();
      window.location.href = 'login-page.html';
    }
  }
}

/**
 * Load user profile and populate edit form
 */
async function loadUserProfileForEdit() {
  const result = await getUserProfile();

  if (result.success) {
    const profile = result.data;
    console.log('Profile loaded:', profile);

    // Populate basic fields
    if (document.getElementById('firstName')) {
      document.getElementById('firstName').value = profile.firstName || '';
    }
    if (document.getElementById('lastName')) {
      document.getElementById('lastName').value = profile.lastName || '';
    }
    if (document.getElementById('email')) {
      document.getElementById('email').value = profile.email || '';
    }

    // Populate health metrics
    if (document.getElementById('editAge')) {
      document.getElementById('editAge').value = profile.age || '';
    }
    if (document.getElementById('editWeight')) {
      document.getElementById('editWeight').value = profile.weight || '';
    }
    if (document.getElementById('editHeight')) {
      document.getElementById('editHeight').value = profile.height || '';
    }

    // Populate diet preferences
    if (profile.dietPreferences && Array.isArray(profile.dietPreferences)) {
      profile.dietPreferences.forEach(diet => {
        const checkbox = document.querySelector(`input[name="diet"][value="${diet}"]`);
        if (checkbox) checkbox.checked = true;
      });
    }

    // Populate allergies
    if (profile.allergies && Array.isArray(profile.allergies)) {
      const customAllergies = [];
      profile.allergies.forEach(allergy => {
        const checkbox = document.querySelector(`input[name="allergy"][value="${allergy}"]`);
        if (checkbox) {
          checkbox.checked = true;
        } else {
          customAllergies.push(allergy);
        }
      });
      //extra allergies that are not predefined
      if (customAllergies.length > 0) {
        const otherAllergiesArea = document.getElementById('otherAllergies');
        if (otherAllergiesArea) {
          otherAllergiesArea.value = customAllergies.join(', ');
        }
      }
    }

    // Populate cooking skill
    if (document.getElementById('cookingSkill')) {
      document.getElementById('cookingSkill').value = profile.cookingSkill || '';
    }
    // Populate meal prep time
    if (document.getElementById('mealPrepTime')) {
      document.getElementById('mealPrepTime').value = profile.mealPrepTime || '';
    }

    // Populate budget range
    if (document.getElementById('budgetRange')) {
      document.getElementById('budgetRange').value = profile.budgetRange || '';
    }
  } else {
    console.error('Failed to load profile:', result.error);
    // If token is invalid, redirect to login
    if (result.error.includes('token') || result.error.includes('auth')) {
      clearToken();
      window.location.href = 'login-page.html';
    }
  }
}


// RECIPE FUNCTIONS

/**
 * Load all recipes for filtering
 */
async function loadAllRecipes() {
  const result = await fetchRecipes();
  if (result.success) {
    allRecipes = result.data;
    console.log('Loaded all recipes for filtering:', allRecipes.length);
  }
}

/**
 * Load My Recipes
 */
async function loadMyRecipes() {
  console.log('Loading My Recipes...');

  const myRecipesGrid = document.getElementById('myRecipesGrid');
  const emptyState = document.getElementById('myRecipesEmpty');

  if (!myRecipesGrid) return;

  try {
    // Get current user profile to get their ID
    const profileResult = await getUserProfile();

    if (!profileResult.success) {
      console.error('Failed to get user profile:', profileResult.error);
      return;
    }

    const ownerId = profileResult.data.id;

    // Fetch recipes owned by this user
    const result = await fetchRecipes(ownerId);

    if (result.success) {
      const recipes = result.data;
      console.log('My Recipes fetched:', recipes.length);

      if (recipes.length === 0) {
        // Show empty state
        if (emptyState) emptyState.style.display = 'flex';
        myRecipesGrid.innerHTML = '';
      } else {
        // Hide empty state
        if (emptyState) emptyState.style.display = 'none';

        // Display recipes
        myRecipesGrid.innerHTML = '';
        recipes.forEach(recipe => {
          const card = createRecipeCard(recipe, true);
          myRecipesGrid.appendChild(card);
        });
      }
    }
  } catch (error) {
    console.error('Error in loadMyRecipes:', error);
  }
}

/**
 * Load General Recipes
 */
async function loadGeneralRecipes() {

  const generalGrid = document.getElementById('generalRecipesGrid');
  if (!generalGrid) return;

  try {
    // Fetch all recipes
    const result = await fetchRecipes();

    if (result.success) {
      // Filter to ONLY show recipes with ownerId = 1 (seed recipes)
      let recipes = result.data.filter(recipe => recipe.ownerId === 1);

      // Assign emojis based on recipe names
      recipes = recipes.map(recipe => {
        // Create a copy of the recipe with an emoji
        const recipeWithEmoji = { ...recipe };

        // Assign emoji based on name
        if (recipe.name.includes("Chickpea")) recipeWithEmoji.emoji = "🌯";
        else if (recipe.name.includes("Shrimp")) recipeWithEmoji.emoji = "🍝";
        else if (recipe.name.includes("Fried Rice")) recipeWithEmoji.emoji = "🍚";
        else if (recipe.name.includes("Beef Chili")) recipeWithEmoji.emoji = "🥘";
        else if (recipe.name.includes("Salmon")) recipeWithEmoji.emoji = "🐟";
        else if (recipe.name.includes("Shawarma")) recipeWithEmoji.emoji = "🥙";
        else recipeWithEmoji.emoji = "🍽️"; // Default emoji

        return recipeWithEmoji;
      });

      console.log('General recipes fetched (ownerId=1):', recipes.length);

      // Store in global variable for filtering
      allRecipes = recipes;

      // Clear and populate grid
      generalGrid.innerHTML = '';

      recipes.forEach(recipe => {
        const card = createRecipeCard(recipe, false);
        generalGrid.appendChild(card);
      });
    }
  } catch (error) {
    console.error('Error in loadGeneralRecipes:', error);
  }
}

/**
 * Filter recipes by search term
 */
function filterRecipesBySearch(searchTerm) {
  console.log('Searching for:', searchTerm);

  const generalGrid = document.querySelector('.section:last-child .recipe-cards-grid');
  if (!generalGrid) return;

  // If search is empty, show all recipes
  if (!searchTerm || searchTerm === '') {
    displayFilteredRecipes(allRecipes);
    return;
  }

  // Convert search term to lowercase for case-insensitive comparison
  const term = searchTerm.toLowerCase();

  // Filter recipes by name (partial match)
  const filtered = allRecipes.filter(recipe => {
    return recipe.name && recipe.name.toLowerCase().includes(term);
  });

  console.log('Search results:', filtered.length);

  if (filtered.length === 0) {
    generalGrid.innerHTML = '<p class="no-results">No recipes match your search</p>';
  } else {
    displayFilteredRecipes(filtered);
  }
}

/**
 * Filter recipes based on selected filters
 */
async function filterRecipes() {
  console.log('Filtering recipes...');

  // Get all selected filter values by name attribute (more reliable)
  const timeChecked = Array.from(document.querySelectorAll('input[name="time"]:checked')).map(cb => cb.value);
  const difficultyChecked = Array.from(document.querySelectorAll('input[name="difficulty"]:checked')).map(cb => cb.value);
  const costChecked = Array.from(document.querySelectorAll('input[name="cost"]:checked')).map(cb => cb.value);
  const dietaryChecked = Array.from(document.querySelectorAll('input[name="diet"]:checked')).map(cb => cb.value);
  const allergenChecked = Array.from(document.querySelectorAll('input[name="allergy"]:checked')).map(cb => cb.value);

  console.log('Selected filters:', {
    time: timeChecked,
    difficulty: difficultyChecked,
    cost: costChecked,
    dietary: dietaryChecked,
    allergens: allergenChecked
  });

  // If no filters selected, show all recipes
  if (timeChecked.length === 0 && difficultyChecked.length === 0 &&
    costChecked.length === 0 && dietaryChecked.length === 0 &&
    allergenChecked.length === 0) {
    displayFilteredRecipes(allRecipes);
    return;
  }

  // Filter recipes
  const filtered = allRecipes.filter(recipe => {
    // TIME FILTER
    if (timeChecked.length > 0) {
      const timeMatch = timeChecked.some(time => {
        if (time === 'under-15' && recipe.prep_time < 15) return true;
        if (time === '15-30' && recipe.prep_time >= 15 && recipe.prep_time <= 30) return true;
        if (time === '30-60' && recipe.prep_time >= 30 && recipe.prep_time <= 60) return true;
        if (time === '60plus' && recipe.prep_time > 60) return true;
        return false;
      });
      if (!timeMatch) return false;
    }

    // DIFFICULTY FILTER (case insensitive)
    if (difficultyChecked.length > 0) {
      const difficultyMatch = difficultyChecked.some(diff =>
        recipe.difficulty && recipe.difficulty.toLowerCase() === diff.toLowerCase()
      );
      if (!difficultyMatch) return false;
    }

    // COST FILTER (case insensitive)
    if (costChecked.length > 0) {
      const costMatch = costChecked.some(cost =>
        recipe.cost && recipe.cost.toLowerCase() === cost.toLowerCase()
      );
      if (!costMatch) return false;
    }

    // DIETARY FILTER (case insensitive)
    if (dietaryChecked.length > 0 && recipe.dietary_tags) {
      const dietaryMatch = dietaryChecked.some(diet => {
        // Use case-insensitive comparison for all dietary tags
        return recipe.dietary_tags.some(tag =>
          tag.toLowerCase() === diet.toLowerCase()
        );
      });
      if (!dietaryMatch) return false;
    }

    // ALLERGEN FILTER - Hide recipes with selected allergens (case insensitive)
    if (allergenChecked.length > 0 && recipe.allergens) {
      const hasAllergen = allergenChecked.some(allergen => {
        return recipe.allergens.some(recipeAllergen =>
          recipeAllergen.toLowerCase() === allergen.toLowerCase()
        );
      });
      if (hasAllergen) return false; // Hide recipes with these allergens
    }

    return true;
  });

  console.log('Filtered recipes:', filtered.length);
  displayFilteredRecipes(filtered);
}
/**
 * Display filtered recipes in the general grid
 */
function displayFilteredRecipes(recipes) {
  const generalGrid = document.querySelector('.section:last-child .recipe-cards-grid');
  if (!generalGrid) return;

  // Clear grid
  generalGrid.innerHTML = '';

  if (recipes.length === 0) {
    generalGrid.innerHTML = '<p class="no-results">No recipes match your filters</p>';
    return;
  }

  // Display each recipe
  recipes.forEach(recipe => {
    const card = createRecipeCard(recipe, false);
    generalGrid.appendChild(card);
  });
}

/**
 * Create recipe card element
 */
function createRecipeCard(recipe, isMyRecipe = false) {
  const details = document.createElement('details');
  details.className = 'recipe-card-full';

  // Determine difficulty class
  let difficultyClass = 'tag-easy';
  if (recipe.difficulty === 'Medium') difficultyClass = 'tag-medium';
  if (recipe.difficulty === 'Hard') difficultyClass = 'tag-hard';

  // Cost display
  let costDisplay = '💰 Low';
  if (recipe.cost === 'Medium') costDisplay = '💰💰 Medium';
  if (recipe.cost === 'High') costDisplay = '💰💰💰 High';

  // Dietary tags display
  const dietaryDisplay = recipe.dietary_tags && recipe.dietary_tags.length > 0
    ? recipe.dietary_tags.join(' · ')
    : '';

  // Summary
  const summary = document.createElement('summary');
  summary.className = 'recipe-card-top';
  summary.innerHTML = `
<div class="recipe-card-emoji">${recipe.emoji || '🍽️'}</div>
    <div class="recipe-card-summary">
      <div class="recipe-card-tags">
        <span class="tag ${difficultyClass}">${recipe.difficulty || 'Easy'}</span>
        <span class="tag tag-cost">${costDisplay}</span>
      </div>
      <h3 class="recipe-card-title">${recipe.name}</h3>
      <div class="recipe-card-meta">
        <span>⏱️ ${recipe.prep_time} min</span>
        <span>${dietaryDisplay}</span>
      </div>
    </div>
    <span class="recipe-card-chevron">▼</span>
  `;

  // Details content
  const detailsDiv = document.createElement('div');
  detailsDiv.className = 'recipe-card-details';

  // Format ingredients as list items
  const ingredientsList = recipe.ingredients && Array.isArray(recipe.ingredients)
    ? recipe.ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')
    : '<li>No ingredients listed</li>';

  // Format steps as list items
  const stepsList = recipe.prep_steps && Array.isArray(recipe.prep_steps)
    ? recipe.prep_steps.map(step => `<li>${step}</li>`).join('')
    : '<li>No steps provided</li>';

  // Action buttons based on recipe ownership
  let actionButtons = '';
  if (isMyRecipe) {
    actionButtons = `
      <div class="recipe-card-actions">
        <button class="btn-edit-recipe" onclick="editRecipe(${recipe.id})">Edit</button>
        <button class="btn-delete-recipe" onclick="deleteRecipe(${recipe.id})">Delete</button>
      </div>
    `;
  } else {
    actionButtons = `
      <button class="btn-save-recipe" onclick="saveRecipeToMyCollection(${recipe.id})">+ Save to My Recipes</button>
    `;
  }

  detailsDiv.innerHTML = `
    <div class="recipe-card-ingredients">
      <strong>Ingredients:</strong>
<ul>
  ${ingredientsList}
</ul>
    </div>
    <div class="recipe-card-steps">
      <strong>Steps:</strong>
      <ol>
        ${stepsList}
      </ol>
    </div>
    ${actionButtons}
  `;

  details.appendChild(summary);
  details.appendChild(detailsDiv);

  return details;
}

// Functions for edit/delete/save
async function editRecipe(id) {
  console.log('Edit recipe:', id);
  window.location.href = `edit-recipe.html?id=${id}`;
}

async function deleteRecipe(id) {
  if (confirm('Are you sure you want to delete this recipe?')) {
    try {
      const response = await fetch(`${API_BASE_URL}/recipes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });

      if (response.ok) {
        alert('Recipe deleted successfully!');
        // Reload recipes
        loadMyRecipes();
        loadAllRecipes();
        loadGeneralRecipes();
      } else {
        alert('Failed to delete recipe');
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
      alert('Error deleting recipe');
    }
  }
}

async function saveRecipeToMyCollection(recipeId) {
  // This function would copy a recipe to the user's collection
  // You'll need to implement this based on your backend
  console.log('Save recipe to my collection:', recipeId);
  alert('Save recipe functionality coming soon!');
}


// CREATE/EDIT RECIPE FUNCTIONS

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
 * Save new recipe
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
    prep_time: parseInt(document.getElementById('prepTime')?.value),
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
      window.location.href = 'recipes.html';
    } else {
      alert('Error: ' + (responseData.message || 'Failed to save recipe'));
    }
  } catch (error) {
    console.error('Error saving recipe:', error);
    alert('Failed to save recipe. Please try again.');
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
 * Helper to set field value
 */
function setFieldValue(id, value) {
  const field = document.getElementById(id);
  if (field && value) {
    field.value = value;
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
    alert('Please fill in all required fields');
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
      alert('Recipe updated successfully!');
      window.location.href = 'recipes.html';
    } else {
      alert('Error: ' + (responseData.message || 'Failed to update recipe'));
    }
  } catch (error) {
    console.error('Error updating recipe:', error);
    alert('Failed to update recipe. Please try again.');
  }
}

// MEAL PLANNER FUNCTIONS
function setTodayDate() {
    const today = new Date();
    // Format as YYYY-MM-DD
    const formattedDate = today.toISOString().split('T')[0];
    
    document.getElementById("weekPicker").value = formattedDate;

    mealPlannerDate();
}

function parseLocalDate(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // months are 0-indexed
}

function mealPlannerDate() {
    const dateContainer = document.getElementById("mealplanWeekDate");
    dateContainer.innerHTML = "";

    const spanMonth = document.createElement("span");
    const spanWeek = document.createElement("span");

    spanMonth.className = "week-month";
    spanWeek.className = "week-range";

    const inputValue = document.getElementById("weekPicker").value;

    const selectedDate = inputValue ? parseLocalDate(inputValue) : new Date();

    // Month
    const monthFormatter = new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric"
    });
    spanMonth.textContent = monthFormatter.format(selectedDate);
    
    // Week range
    const startOfWeek = new Date(selectedDate);
    const day = startOfWeek.getDay(); // 0 = Sunday
    const diffToMonday = (day === 0 ? -6 : 1 - day); // adjust to Monday

    startOfWeek.setDate(selectedDate.getDate() + diffToMonday);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const shortFormatter = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric"
    });
    spanWeek.textContent = `${shortFormatter.format(startOfWeek)} - ${shortFormatter.format(endOfWeek)}`;
    
    dateContainer.appendChild(spanMonth);
    dateContainer.appendChild(spanWeek);

    weeklyMeals(selectedDate);
}

function mealPlannerWeek(input) {
    const inputDate = document.getElementById("weekPicker");

    let date = inputDate.value ? parseLocalDate(inputDate.value) : new Date();

    const currentDay = date.getDay(); // 0 = Sunday
    const diffToMonday = (currentDay === 0 ? -6 : 1 - currentDay);
    date.setDate(date.getDate() + diffToMonday);

    // Move 7 days
    if(input == "next"){
        date.setDate(date.getDate() + 7);
    } else if (input == "prev"){
        date.setDate(date.getDate() - 7);
    }

    // Update input value
    inputDate.value = date.toISOString().split("T")[0];

    mealPlannerDate();
}

// Load meal plan for the week and populate the grid
async function weeklyMeals(currentDate) {
  const plannerGrid = document.getElementsByClassName("planner-grid")[0];
  plannerGrid.innerHTML = "";

  // create header corner
  const corner = document.createElement("div");
  corner.className = "grid-header-corner";
  plannerGrid.appendChild(corner);

  const currentDay = currentDate.getDay(); // 0 = Sunday
  const diffToMonday = (currentDay === 0 ? -6 : 1 - currentDay);
  const monday = new Date(currentDate);
  monday.setDate(currentDate.getDate() + diffToMonday);

  // header row
  for (let i = 0; i < 7; i++) {
    const day = document.createElement("div");

    const dateForDay = new Date(monday);
    dateForDay.setDate(monday.getDate() + i);

    const today = new Date();
    if (
      dateForDay.getDate() === today.getDate() &&
      dateForDay.getMonth() === today.getMonth() &&
      dateForDay.getFullYear() === today.getFullYear()
    ) {
      day.className = "grid-day-header today";
    } else {
      day.className = "grid-day-header";
    }

    const nameDay = document.createElement("span");
    const dateDay = document.createElement("span");
    nameDay.className = "day-name";
    dateDay.className = "day-date";

    nameDay.textContent = dateForDay.toLocaleDateString("en-US", { weekday: "short" });
    dateDay.textContent = dateForDay.toLocaleDateString("en-US", { day: "numeric" });

    day.appendChild(nameDay);
    day.appendChild(dateDay);

    plannerGrid.appendChild(day);
  }

  // get meal plan for the week
  const mondayStr = monday.toISOString().split("T")[0];
  const mealPlanResponse = await fetch(`${API_BASE_URL}/mealPlan/week/${mondayStr}`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });

  const mealPlan = await mealPlanResponse.json();
  let mealPlanItems = [];

  if (mealPlan) {
    const itemsResponse = await fetch(`${API_BASE_URL}/mealPlan/${mealPlan.id}/items`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    mealPlanItems = await itemsResponse.json();
  }

  const MEAL_TYPES = [
    { type: "BREAKFAST", icon: "🍳", label: "Breakfast" },
    { type: "LUNCH", icon: "🥗", label: "Lunch" },
    { type: "DINNER", icon: "🍽️", label: "Dinner" },
    { type: "SNACK", icon: "🍎", label: "Snack" }
  ];

  const WEEKDAY_ENUM = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  const startOfWeek = new Date(monday);

  for (const meal of MEAL_TYPES) {
    const mealTypeLabel = document.createElement("div");
    mealTypeLabel.className = "grid-meal-label";

    const icon = document.createElement("span");
    icon.className = "meal-label-icon";
    icon.textContent = meal.icon;

    const text = document.createElement("span");
    text.textContent = meal.label;

    mealTypeLabel.appendChild(icon);
    mealTypeLabel.appendChild(text);
    plannerGrid.appendChild(mealTypeLabel);

    for (let i = 0; i < 7; i++) {
      const grid = document.createElement("div");
      grid.className = "grid-cell";

      const dateForDay = new Date(startOfWeek);
      dateForDay.setDate(startOfWeek.getDate() + i);
      const dayEnum = WEEKDAY_ENUM[dateForDay.getDay()];

      const item = mealPlanItems.find(e =>
        e.meal_type === meal.type &&
        e.day_of_week === dayEnum
      );

    if (item) {
        try {
          const recipeResponse = await fetch(`${API_BASE_URL}/recipes/${item.recipeId}`, {
            headers: {
              'Authorization': `Bearer ${getToken()}`
            }
          });
          const recipe = await recipeResponse.json();

          const cellFilled = document.createElement("div");
          cellFilled.className = "cell-filled";

          const recipeName = document.createElement("div");
          recipeName.className = "cell-recipe-name";
          recipeName.textContent = recipe.name;

          const recipeMeta = document.createElement("div");
          recipeMeta.className = "cell-recipe-meta";
          recipeMeta.textContent = `⏱️ ${recipe.prep_time} min · ${recipe.difficulty}`;

          const actions = document.createElement("div");
          actions.className = "cell-filled-actions";

          const editBtn = document.createElement("button");
          editBtn.className = "cell-action-btn cell-btn-edit";
          editBtn.type = "button";
          editBtn.textContent = "✏️ Edit";

          const removeBtn = document.createElement("button");
          removeBtn.className = "cell-action-btn cell-btn-remove";
          removeBtn.type = "button";
          removeBtn.textContent = "✕";

          actions.appendChild(editBtn);
          actions.appendChild(removeBtn);

          cellFilled.appendChild(recipeName);
          cellFilled.appendChild(recipeMeta);
          cellFilled.appendChild(actions);

          grid.appendChild(cellFilled);
        } catch (error) {
          console.error("Error loading recipe details:", error);
        }
      } else {
        grid.className = "grid-cell empty";

        const addBtn = document.createElement("button");
        addBtn.type = "button";
        addBtn.className = "cell-add-btn";
        addBtn.innerHTML = `
          <span class="add-icon">＋</span>
          <span>Add ${meal.label}</span>
        `;

        addBtn.addEventListener("click", () => {
          if (!mealPlan) {
            alert("No meal plan exists for this week yet.");
            return;
          }

          saveSelectedMealSlot({
            mealPlanId: mealPlan.id,
            day_of_week: dayEnum,
            meal_type: meal.type
          });

          window.location.href = "add-meal.html";
        });

        grid.appendChild(addBtn);
      }

      plannerGrid.appendChild(grid);
    }
  }
}

// Function to create a new meal plan item
async function createMealPlanItem(mealPlanId, recipeId, day_of_week, meal_type, notes = "") {
  try {
    const response = await fetch(`${API_BASE_URL}/mealPlan/item`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mealPlanId,
        recipeId,
        day_of_week,
        meal_type,
        notes
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create meal plan item');
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function loadRecipesForAddMealPage() {
  try {
    const response = await fetch(`${API_BASE_URL}/recipes`, {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    const recipes = await response.json();
    const container = document.getElementById("addMealRecipesContainer");

    if (!container) return;

    container.innerHTML = "";

    recipes.forEach((recipe) => {
      const card = document.createElement("a");
      card.href = "#";
      card.className = "recipe-card";
      card.dataset.recipeId = recipe.id;

      card.innerHTML = `
        <div class="recipe-image">🍽️</div>
        <div class="recipe-info">
          <h4>${recipe.name}</h4>
          <div class="recipe-details">
            <span>⏱️ ${recipe.prep_time} min</span>
            <span>${recipe.difficulty}</span>
            <span>💰 ${recipe.cost}</span>
          </div>
        </div>
      `;

      container.appendChild(card);
    });
  } catch (error) {
    console.error("Error loading recipes for add meal page:", error);
  }
}

// Initialize add meal page 
async function initAddMealPage() {
  if (!isAuthenticated()) {
    window.location.href = 'login-page.html';
    return;
  }

  const slot = getSelectedMealSlot();

  if (!slot) {
    alert('No meal slot selected.');
    window.location.href = 'meal-planner.html';
    return;
  }

  await loadRecipesForAddMealPage();

    const recipeCards = document.querySelectorAll('.recipe-card[data-recipe-id]');

  recipeCards.forEach(card => {
    const recipeId =
      card.dataset.recipeId ||
      card.getAttribute('data-id') ||
      card.getAttribute('data-recipe');

    if (!recipeId) return;

    card.style.cursor = 'pointer';

    card.addEventListener('click', async (e) => {
    e.preventDefault();
      const result = await createMealPlanItem(
        slot.mealPlanId,
        parseInt(recipeId, 10),
        slot.day_of_week,
        slot.meal_type
      );

      if (result.success) {
        clearSelectedMealSlot();
        alert('Meal added successfully!');
        window.location.href = 'meal-planner.html';
      } else {
        alert(result.error || 'Failed to add meal.');
      }
    });
  });

  const logoutLink = document.querySelector('.nav-link.logout');
  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      clearToken();
      window.location.href = 'login-page.html';
    });
  }
}


//Helper functions to manage selected meal slot in localStorage for editing
function saveSelectedMealSlot(slotData) {
  localStorage.setItem('selectedMealSlot', JSON.stringify(slotData));
}

function getSelectedMealSlot() {
  const raw = localStorage.getItem('selectedMealSlot');
  return raw ? JSON.parse(raw) : null;
}

function clearSelectedMealSlot() {
  localStorage.removeItem('selectedMealSlot');
}

// Initialize meal planner page 
function initMealPlannerPage() {
  if (!isAuthenticated()) {
    window.location.href = 'login-page.html';
    return;
  }

  const weekPicker = document.getElementById('weekPicker');
  if (weekPicker) {
    setTodayDate();

    weekPicker.addEventListener('change', () => {
      mealPlannerDate();
    });
  }

  const weekButtons = document.querySelectorAll('.week-nav-btn');
  if (weekButtons.length >= 2) {
    weekButtons[0].addEventListener('click', () => mealPlannerWeek('prev'));
    weekButtons[1].addEventListener('click', () => mealPlannerWeek('next'));
  }

  const logoutLink = document.querySelector('.nav-link.logout');
  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      clearToken();
      window.location.href = 'login-page.html';
    });
  }
}

// PAGE INITIALIZATION FUNCTIONS

/**
 * Initialize login page
 */
function initLoginPage() {
  const loginForm = document.querySelector('form');
  if (!loginForm) return;

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllErrors();

    // Get form values
    const email = document.querySelector('input[type="email"]').value.trim();
    const password = document.querySelector('input[type="password"]').value;

    // Validate inputs
    if (!email) {
      alert('Please enter your email address');
      return;
    }

    if (!password) {
      alert('Please enter your password');
      return;
    }

    // Get submit button
    const submitButton = loginForm.querySelector('button[type="submit"]');
    setButtonLoading(submitButton, true);

    // Attempt login
    const result = await loginUser(email, password);

    setButtonLoading(submitButton, false);

    if (result.success) {
      // Save token
      saveToken(result.data.token);

      // Redirect to home page
      window.location.href = 'home-page.html';
    } else {
      // Show error
      alert(result.error || 'Login failed. Please check your credentials and try again.');
    }
  });
}

/**
 * Initialize signup page
 */
function initSignupPage() {
  const signupForm = document.getElementById('signupform');
  if (!signupForm) return;

  // Password toggle functionality
  const toggleButtons = document.querySelectorAll('.toggle-password');
  toggleButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetId = button.dataset.target;
      const input = document.getElementById(targetId);

      if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '👁️';
      } else {
        input.type = 'password';
        button.textContent = '👁';
      }
    });
  });

  // Form submission
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllErrors();

    // Get form values
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm_password').value;

    let hasErrors = false;

    // Validate first name
    if (!firstName) {
      showError('firstNameError', 'First name is required');
      hasErrors = true;
    }

    // Validate last name
    if (!lastName) {
      showError('lastNameError', 'Last name is required');
      hasErrors = true;
    }

    // Validate email
    if (!email) {
      showError('emailError', 'Email is required');
      hasErrors = true;
    } else if (!validateEmail(email)) {
      showError('emailError', 'Please enter a valid email address');
      hasErrors = true;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      showError('passwordError', passwordValidation.message);
      hasErrors = true;
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      showError('confirmError', 'Passwords do not match');
      hasErrors = true;
    }

    if (hasErrors) return;

    // Get submit button
    const submitButton = signupForm.querySelector('button[type="submit"]');
    setButtonLoading(submitButton, true);

    // Attempt registration
    const result = await registerUser(firstName, lastName, email, password);

    setButtonLoading(submitButton, false);

    if (result.success) {
      // Show success message
      alert('Registration successful! Please log in.');

      // Redirect to login page
      window.location.href = 'login-page.html';
    } else {
      // Show error
      if (result.error.includes('Email')) {
        showError('emailError', result.error);
      } else {
        alert(result.error || 'Registration failed. Please try again.');
      }
    }
  });
}

/**
 * Initialize home page
 */
function initHomePage() {
  console.log('🏠 INIT_HOME_PAGE CALLED at:', new Date().toISOString());

  // Check if prompt exists
  const prompt = document.getElementById('profilePrompt');
  console.log('Prompt element exists at init:', !!prompt);

  // Check authentication
  if (!isAuthenticated()) {
    window.location.href = 'login-page.html';
    return;
  }

  // Load user profile and display name
  loadUserProfile();

  // Check profile completion
  checkProfileCompletion();

  // Setup logout functionality
  const logoutLink = document.querySelector('.nav-link.logout');
  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      clearToken();
      window.location.href = 'login-page.html';
    });
  }

  // Add form submit handler
  const metricsForm = document.getElementById('healthMetricsForm');
  if (metricsForm) {
    metricsForm.addEventListener('submit', saveHealthMetrics);
  }
}

/**
 * Initialize edit profile page
 */
function initEditProfilePage() {
  // Check authentication
  if (!isAuthenticated()) {
    window.location.href = 'login-page.html';
    return;
  }

  // Load user profile and populate form
  loadUserProfileForEdit();

  // Setup logout functionality
  const logoutLink = document.querySelector('.nav-link.logout');
  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      clearToken();
      window.location.href = 'login-page.html';
    });
  }

  // Setup form submission
  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('Form submitted!')
      clearAllErrors();

      // Collect form data
      const formData = {
        firstName: document.getElementById('firstName')?.value.trim() || '',
        lastName: document.getElementById('lastName')?.value.trim() || '',
        email: document.getElementById('email')?.value.trim() || '',
        age: document.getElementById('editAge')?.value ? parseInt(document.getElementById('editAge').value) : null,
        weight: document.getElementById('editWeight')?.value ? parseFloat(document.getElementById('editWeight').value) : null,
        height: document.getElementById('editHeight')?.value ? parseFloat(document.getElementById('editHeight').value) : null,
        dietPreferences: [],
        allergies: [],
        cookingSkill: document.getElementById('cookingSkill')?.value || '',
        mealPrepTime: document.getElementById('mealPrepTime')?.value || '',
        budgetRange: document.getElementById('budgetRange')?.value || '',
      };

      console.log('Form data collected:', formData);

      // Get selected diet preferences
      const dietCheckboxes = document.querySelectorAll('input[name="diet"]:checked');
      dietCheckboxes.forEach(cb => formData.dietPreferences.push(cb.value));

      // Get selected allergies
      const allergyCheckboxes = document.querySelectorAll('input[name="allergy"]:checked');
      const extraAllergyText = document.getElementById('otherAllergies')?.value.split(',').map(s => s.trim()).filter(s => s.length > 0);
      allergyCheckboxes.forEach(cb => formData.allergies.push(cb.value));
      if (extraAllergyText) {
        extraAllergyText.forEach(element => formData.allergies.push(element));
      }

      // Validate
      let hasErrors = false;

      if (!formData.firstName || !formData.lastName) {
        showError('nameError', 'Name is required');
        hasErrors = true;
      }

      if (!formData.email) {
        showError('emailError', 'Email is required');
        hasErrors = true;
      } else if (!validateEmail(formData.email)) {
        showError('emailError', 'Please enter a valid email address');
        hasErrors = true;
      }

      if (hasErrors) return;

      // Get submit button
      const submitButton = profileForm.querySelector('button[type="submit"]');
      setButtonLoading(submitButton, true);

      // Update profile
      const result = await updateUserProfile(formData);

      setButtonLoading(submitButton, false);

      if (result.success) {
        alert('Profile updated successfully!');
        window.location.href = 'home-page.html';
      } else {
        alert(result.error || 'Failed to update profile. Please try again.');
      }
    });
  }
}

/**
 * Initialize recipes page
 */
function initRecipesPage() {
  console.log('🍽️ INIT_RECIPES_PAGE CALLED');

  // Check authentication
  if (!isAuthenticated()) {
    window.location.href = 'login-page.html';
    return;
  }

  // Load My Recipes
  loadMyRecipes();

  // Load General Recipes
  loadGeneralRecipes();

  // Setup logout functionality
  const logoutLink = document.querySelector('.nav-link.logout');
  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      clearToken();
      window.location.href = 'login-page.html';
    });
  }

  // Setup search functionality
  const searchBtn = document.querySelector('.search-btn');
  const searchInput = document.getElementById('searchInput');

  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', () => {
      console.log('Search button clicked');
      const searchTerm = searchInput.value.trim();
      filterRecipesBySearch(searchTerm);
    });

    searchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        console.log('Enter key pressed');
        const searchTerm = searchInput.value.trim();
        filterRecipesBySearch(searchTerm);
      }
    });
  } else {
    console.log('Search button or input not found');
  }

  // Setup Apply Filters button
  const applyFiltersBtn = document.getElementById('applyFiltersBtn');
  console.log('Apply Filters button found:', applyFiltersBtn);

  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', () => {
      console.log('Apply Filters button clicked');
      filterRecipes();
    });
  } else {
    console.log('Apply Filters button NOT found - check if ID is correct in HTML');
  }

  // Setup Clear Filters button
  const clearFiltersBtn = document.getElementById('clearFiltersBtn');
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      console.log('Clear Filters button clicked');
      // Uncheck all checkboxes
      document.querySelectorAll('.filter-bar input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
      });
      // Show all recipes
      displayFilteredRecipes(allRecipes);
    });
  }
}

/**
 * Initialize create recipe page
 */
function initCreateRecipePage() {
  console.log('📝 INIT_CREATE_RECIPE PAGE');

  // Check authentication
  if (!isAuthenticated()) {
    window.location.href = 'login-page.html';
    return;
  }

  const form = document.getElementById('createRecipeForm');
  if (!form) return;

  // Override the default form submission
  form.addEventListener('submit', saveRecipe);

  // Setup logout
  const logoutLink = document.querySelector('.nav-link.logout');
  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      clearToken();
      window.location.href = 'login-page.html';
    });
  }
}

/**
 * Initialize edit recipe page
 */
async function initEditRecipePage() {
  console.log('✏️ INIT_EDIT_RECIPE PAGE');

  // Check authentication
  if (!isAuthenticated()) {
    window.location.href = 'login-page.html';
    return;
  }

  // Get recipe ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const recipeId = urlParams.get('id');

  if (!recipeId) {
    alert('No recipe ID specified');
    window.location.href = 'recipes.html';
    return;
  }

  // Fetch recipe data
  try {
    const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch recipe');
    }

    const recipe = await response.json();

    // Populate form fields
    populateEditForm(recipe);

  } catch (error) {
    console.error('Error fetching recipe:', error);
    alert('Error loading recipe');
    window.location.href = 'recipes.html';
  }

  // Setup form submission
  const form = document.getElementById('editRecipeForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await updateRecipe(recipeId);
    });
  }

  // Setup logout
  const logoutLink = document.querySelector('.nav-link.logout');
  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      clearToken();
      window.location.href = 'login-page.html';
    });
  }
}


// AUTO-INITIALIZATION ON PAGE LOAD
document.addEventListener('DOMContentLoaded', () => {
  // Detect which page we're on and initialize accordingly
  const path = window.location.pathname;
  const page = path.substring(path.lastIndexOf('/') + 1);

  console.log('Current page:', page);
  console.log('Full path:', path);

  switch (page) {
    case 'login-page.html':
    case 'login':
    case '':
      initLoginPage();
      break;

    case 'sign-up-page.html':
    case 'signup':
      initSignupPage();
      break;

    case 'home-page.html':
    case 'home':
      initHomePage();
      break;

    case 'edit-profile.html':
    case 'profile':
      initEditProfilePage();
      break;

    case 'recipes.html':
      initRecipesPage();
      break;

    case 'create-recipe.html':
      initCreateRecipePage();
      break;

    case 'edit-recipe.html':
      initEditRecipePage();
      break;

    case 'meal-planner.html':
      initMealPlannerPage();
      break;

    case 'add-meal.html':
      initAddMealPage();
      break;

    default:
      console.log('Page not recognized for auto-initialization');
  }
  
});
