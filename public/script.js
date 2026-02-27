// script.js
// Frontend-Backend Integration for MealMajor
// Handles: Login, Signup, Form Validation, Token Management, Profile Loading


// CONFIGURATION
const API_BASE_URL = 'http://localhost:4000/api';
const TOKEN_KEY = 'mealmajor_token';


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

/**
 * Validate full name (not empty, at least 2 characters)
 */
function validateFullName(name) {
  if (!name || name.trim().length < 2) {
    return { valid: false, message: 'Please enter a valid full name' };
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

// Add these new functions to your script.js

// Check profile completion status
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

// Show profile prompt
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

// Close prompt
function closePrompt() {
  const prompt = document.getElementById('profilePrompt');
  if (prompt) {
    prompt.classList.add('hidden');
  }
}

// Show success toast
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

// Save health metrics
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

// Update initHomePage function
function initHomePage() {
  console.log('🏠 INIT_HOME_PAGE CALLED at:', new Date().toISOString());
  console.log('Current URL:', window.location.href);
  console.log('Document readyState:', document.readyState);

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
 * Filter recipes based on preferences setup in edit profile
 */
async function suggestedRecipes() {
  // get preferences from user profile
  const user = await get(`${API_BASE_URL}/api/profile`);

  const cookingSkill = user.cookingSkill;
  const mealPrepTime = user.mealPrepTime;
  const budgetRange = user.budgetRange;
  const userAllergies = user.allergies;
  const userDiets = user.dietPreferences;

  const recipes = await get(`${API_BASE_URL}/recipes`);

  // Remove recipes that have allergies the user has
  const safeRecipes = recipes.filter(recipe => {
    return !recipe.allergies.some(a => userAllergies.includes(a)); // allergies not in database
  });

  const filteredRecipes = safeRecipes.map(recipe => {
    let matches = 0;

    // Filter by cooking skill
    if (cookingSkill == "beginner" && recipe.difficulty == "Easy") matches++; // difficulty not in database
    if (cookingSkill == "intermediate" && recipe.difficulty == "Medium") matches++;
    if (cookingSkill == "advanced" && recipe.difficulty == "Hard") matches++;
    if (cookingSkill == "expert" && recipe.difficulty == "Hard") matches++;

    // Filter by meal prep time
    if (mealPrepTime == "quick" && recipe.prep_time <= 15) matches++;
    if (mealPrepTime == "moderate" && recipe.prep_time > 15 && recipe.prep_time <= 30) matches++;
    if (mealPrepTime == "extended" && recipe.prep_time > 30 && recipe.prep_time <= 60) matches++;
    if (mealPrepTime == "elaborate" && recipe.prep_time > 60) matches++;
    if (mealPrepTime == "any") matches++;
    // Filter by budget
    if (budgetRange) {
      if (budgetRange === "low" && recipe.cost <= 10) matches++;
      if (budgetRange === "medium" && recipe.cost > 10 && recipe.cost <= 20) matches++;
      if (budgetRange === "high" && recipe.cost > 20) matches++;
    }
    // Filter by diet
    if (recipe.diet && userDiets.length > 0) {
      const dietMatch = userDiets.includes(recipe.diet); // diet not in database
      if (dietMatch) matches++;
    }

    return { ...recipe, matches };
  });

  // Sort recipes by the number of matches
  filteredRecipes.sort((a, b) => b.matches - a.matches);

  displaySuggestedRecipes(filteredRecipes.slice(0, 4)); // return top 4 suggestions
}
// Helper function to parse recipe card data
function parseRecipeCard(card) {
  const title = card.querySelector('.recipe-card-title')?.textContent?.trim().toLowerCase() || '';
  const timeText = card.querySelector('.recipe-card-meta span')?.textContent || '';
  // Extract number from time text (e.g., "30 min" -> 30)
  const timeMatch = timeText.match(/\d+/);
  const prepTime = timeMatch ? parseInt(timeMatch[0], 10) : 0;

// Determine difficulty based on tags
  let difficulty = '';
  if (card.querySelector('.tag-easy')) difficulty = 'easy';
  else if (card.querySelector('.tag-medium')) difficulty = 'medium';
  else if (card.querySelector('.tag-hard')) difficulty = 'hard';
// Determine cost based on tags
  let cost = '';
  const costText = card.querySelector('.tag-cost')?.textContent?.toLowerCase() || '';
  if (costText.includes('high')) cost = 'high';
  else if (costText.includes('medium')) cost = 'medium';
  else if (costText.includes('low')) cost = 'low';

  // Extract dietary information from the second span in the meta section (if it exists)
  const dietaryText = card.querySelectorAll('.recipe-card-meta span')[1]?.textContent?.toLowerCase() || '';

  // Return an object with all the extracted information
  return { title, prepTime, difficulty, cost, dietaryText };
}
// Helper function to check if a recipe matches the selected time filters
function matchesTimeFilter(prepTime, selectedTimeFilters) {
  if (selectedTimeFilters.length === 0) return true;

// Check if prep time matches any of the selected time filters (15 min, 15-30 min, 30-60 min, 60+ min)
  return selectedTimeFilters.some((timeFilter) => {
    if (timeFilter === 'under-15') return prepTime < 15;
    if (timeFilter === '15-30') return prepTime >= 15 && prepTime < 30;
    if (timeFilter === '30-60') return prepTime >= 30 && prepTime < 60;
    if (timeFilter === '60plus') return prepTime >= 60;
    return false;
  });
}
// Main function to apply all filters to the recipe cards
function applyRecipeFilters() {
  const cards = Array.from(document.querySelectorAll('#generalRecipesGrid .recipe-card-full'));
  if (cards.length === 0) return;
// Used arrow functions and map to simplify code for getting selected filters
// This creates arrays of selected values for each filter category (time, difficulty, cost, dietary) by querying the checked checkboxes and mapping them to their values
  const selectedTimeFilters = Array.from(document.querySelectorAll('input[name="time"]:checked')).map((input) => input.value);
  const selectedDifficultyFilters = Array.from(document.querySelectorAll('input[name="difficulty"]:checked')).map((input) => input.value);
  const selectedCostFilters = Array.from(document.querySelectorAll('input[name="cost"]:checked')).map((input) => input.value);
  const selectedDietaryFilters = Array.from(document.querySelectorAll('input[name="dietary"]:checked')).map((input) => input.value);
  const searchText = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();

  let visibleCount = 0;
// Iterate through each recipe card, parse its data, and check if it matches the search text and selected filters. The matchesTimeFilter function is used to check if the recipe's prep time matches any of the selected time filters. The card is shown or hidden based on whether it matches all criteria, and a count of visible cards is maintained to update the status message and show/hide the "no results" message accordingly.
  cards.forEach((card) => {
    const recipe = parseRecipeCard(card);
    const matchesSearch = !searchText || recipe.title.includes(searchText);
    const matchesTime = matchesTimeFilter(recipe.prepTime, selectedTimeFilters);
    const matchesDifficulty = selectedDifficultyFilters.length === 0 || selectedDifficultyFilters.includes(recipe.difficulty);
    const matchesCost = selectedCostFilters.length === 0 || selectedCostFilters.includes(recipe.cost);
    const matchesDietary = selectedDietaryFilters.length === 0 || selectedDietaryFilters.some((dietFilter) => recipe.dietaryText.includes(dietFilter));

    const matches = matchesSearch && matchesTime && matchesDifficulty && matchesCost && matchesDietary;
    card.style.display = matches ? '' : 'none';
    if (matches) visibleCount += 1;
  });
// Update status message with the count of visible recipes and show/hide the "no results" message based on whether any recipes are visible after filtering.
  const statusElement = document.getElementById('filterStatus');
  if (statusElement) {
    statusElement.textContent = `${visibleCount} recipe${visibleCount === 1 ? '' : 's'} shown`;
  }

  const noResultsMessage = document.getElementById('noRecipesMessage');
  if (noResultsMessage) {
    noResultsMessage.hidden = visibleCount !== 0;
  }
}
// Initialization function for recipes page
function initRecipesPage() {
  if (!isAuthenticated()) {
    window.location.href = 'login-page.html';
    return;
  }

  const logoutLink = document.querySelector('.nav-link.logout');
  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      clearToken();
      window.location.href = 'login-page.html';
    });
  }
// Add event listeners to filter checkboxes and search input to call applyRecipeFilters whenever a filter is changed or search text is entered. This ensures that the recipe list updates in real-time as the user interacts with the filters and search bar.
  const filterInputs = document.querySelectorAll('.filter-bar input[type="checkbox"]');
  filterInputs.forEach((input) => {
    input.addEventListener('change', applyRecipeFilters);
  });

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', applyRecipeFilters);
  }

  const searchButton = document.querySelector('.search-btn');
  if (searchButton) {
    searchButton.addEventListener('click', applyRecipeFilters);
  }
// Clear filters button and added event listener to reset all filters and search input, then reapply filters to show all recipes.
  const clearFiltersButton = document.getElementById('clearFiltersBtn');
  if (clearFiltersButton) {
    clearFiltersButton.addEventListener('click', () => {
      document.querySelectorAll('.filter-bar input[type="checkbox"]').forEach((checkbox) => {
        checkbox.checked = false;
      });
      if (searchInput) searchInput.value = '';
      applyRecipeFilters();
    });
  }

  applyRecipeFilters();
}


// Function to display recipes dynamically
function displaySuggestedRecipes(recipes) {
  const grid = document.querySelector('.recipes-grid');

  // Clear previous content
  grid.innerHTML = '';

  recipes.forEach(recipe => {
    // Link to recipe
    const card = document.createElement('a');
    card.href = 'recipes.html';  // need to modify ?
    card.classList.add('recipe-card');

    // emoji placeholder for recipe image
    const imageDiv = document.createElement('div');
    imageDiv.classList.add('recipe-image');
    imageDiv.textContent = '🍽️';

    // create recipe info container
    const infoDiv = document.createElement('div');
    infoDiv.classList.add('recipe-info');

    // title
    const title = document.createElement('h4');
    title.textContent = recipe.name;

    // recipe details container
    const detailsDiv = document.createElement('div');
    detailsDiv.classList.add('recipe-details');

    // time
    const timeSpan = document.createElement('span');
    timeSpan.textContent = `⏱️ ${recipe.prep_time} min`;

    // cost
    const costSpan = document.createElement('span');
    let costLabel = '';
    if (recipe.cost <= 10) costLabel = '💰 Low';
    else if (recipe.cost <= 20) costLabel = '💰💰 Medium';
    else costLabel = '💰💰💰 High';
    costSpan.textContent = costLabel;

    // add time and cost to details
    detailsDiv.appendChild(timeSpan);
    detailsDiv.appendChild(costSpan);

    // add title and details to info
    infoDiv.appendChild(title);
    infoDiv.appendChild(detailsDiv);

    // add image and info to card
    card.appendChild(imageDiv);
    card.appendChild(infoDiv);

    // add card to grid
    grid.appendChild(card);
  });
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


// PAGE-SPECIFIC INITIALIZATION
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
// function initHomePage() {
//   // Check authentication
//   if (!isAuthenticated()) {
//     window.location.href = 'login-page.html';
//     return;
//   }

//   // Load user profile and display name
//   loadUserProfile();

//   // Setup logout functionality
//   const logoutLink = document.querySelector('.nav-link.logout');
//   if (logoutLink) {
//     logoutLink.addEventListener('click', (e) => {
//       e.preventDefault();
//       clearToken();
//       window.location.href = 'login-page.html';
//     });
//   }
// }

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

      console.log('Form data collected:', formData); // Debug log

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
 * Load user profile and display on home page
 */
async function loadUserProfile() {
  const result = await getUserProfile();

  if (result.success) {
    // Update name display
    const firstNameElement = document.getElementById('firstName'); //Name of user
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
    console.log('Profile loaded:', profile); // Debug log

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
      if(customAllergies.length > 0) {
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

    default:
      console.log('Page not recognized for auto-initialization');
  }
});

// Fetch recipes from backend with optional search query
async function fetchRecipes(query = "") {
  const token = getToken();
  if (!token) {
    window.location.href = "login-page.html";
    return [];
  }

  // Build URL with optional search query
  const url = new URL(`${API_BASE_URL}/recipes`);
  if (query.trim()) {
    url.searchParams.set("q", query.trim());
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (res.status === 401) {
    clearToken();
    window.location.href = "login-page.html";
    return [];
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to load recipes");
  }

  return await res.json();
}
function getDifficulty(prepTime) {
  if (prepTime <= 15) return { label: "Easy", class: "easy" };
  if (prepTime <= 45) return { label: "Medium", class: "medium" };
  return { label: "Hard", class: "hard" };
}

function getCostLevel(cost) {
  const c = Number(cost);
  if (cost < 6) return "💰 Low";
  if (cost <= 15) return "💰💰 Medium";
  return "💰💰💰 High";
}

function formatDietary(recipe) {
  const text = (recipe.ingredients + " " + recipe.prep_steps).toLowerCase();

  let tags = [];
  if (text.includes("vegan")) tags.push("🌱 Vegan");
  if (text.includes("vegetarian")) tags.push("🥗 Vegetarian");
  if (text.includes("gluten-free")) tags.push("🌾 Gluten-Free");
  if (text.includes("dairy-free")) tags.push("🥛 Dairy-Free");
  if (text.includes("halal")) tags.push("🕌 Halal");

  return tags.length ? `<span>${tags.join(" • ")}</span>` : "";
} 


//Render recipes into the page
f// Render "My Recipes" using the SAME card layout as General Recipes
function renderRecipes(recipes) {
  const grid = document.getElementById("myRecipesGrid");
  const empty = document.getElementById("myRecipesEmpty");
  if (!grid) return;

  grid.innerHTML = "";

  if (!recipes || recipes.length === 0) {
    if (empty) empty.style.display = "flex";
    return;
  }
  if (empty) empty.style.display = "none";

  recipes.forEach(r => {
    const difficulty = getDifficulty(r.prep_time);   // you already have this
    const costLevel = getCostLevel(r.cost);          // you already have this
    const tagsHtml = buildTagsHtml(difficulty, costLevel);
    const metaDietaryHtml = formatDietaryText(r);    // new helper below

    const details = document.createElement("details");
    details.className = "recipe-card-full";

    details.innerHTML = `
      <summary class="recipe-card-top">
        <div class="recipe-card-emoji">${pickEmoji(r.name, r.ingredients)}</div>

        <div class="recipe-card-summary">
          <div class="recipe-card-tags">
            ${tagsHtml}
          </div>

          <h3 class="recipe-card-title">${escapeHtml(r.name)}</h3>

          <div class="recipe-card-meta">
            <span>⏱️ ${r.prep_time} min</span>
            ${metaDietaryHtml ? `<span>${metaDietaryHtml}</span>` : ""}
          </div>
        </div>

        <span class="recipe-card-chevron">▼</span>
      </summary>

      <div class="recipe-card-details">
        <div class="recipe-card-ingredients">
          <strong>Ingredients:</strong> ${escapeHtml(r.ingredients || "—")}
        </div>

        <div class="recipe-card-steps">
          <strong>Steps:</strong>
          ${renderSteps(r.prep_steps)}
        </div>

        <div class="recipe-card-actions">
          <a class="btn-edit-recipe" href="edit-recipe.html?id=${encodeURIComponent(r.id)}">✏️ Edit</a>
          <button class="btn-delete-recipe" data-id="${r.id}">🗑️ Delete</button>
        </div>
      </div>
    `;

    grid.appendChild(details);
  });

  // Hook delete buttons (if you already have delete logic, call it here instead)
  grid.querySelectorAll(".btn-delete-recipe").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const id = btn.getAttribute("data-id");
      if (!id) return;

      const ok = confirm("Delete this recipe?");
      if (!ok) return;

      // TODO: replace with your real delete endpoint call
      // await deleteRecipe(id);

      // For now remove from DOM instantly:
      btn.closest("details")?.remove();
    });
  });
}

/* ---------------- Helpers ---------------- */

function buildTagsHtml(difficulty, costLevel) {
  // difficulty is like { label: "Easy", class: "tag-easy" } OR you can adapt this mapping
  // costLevel might be "Low"/"Medium"/"High" from your existing function
  const diffClass = difficultyTagClass(difficulty.label);
  const costText = costToEmoji(costLevel);

  return `
    <span class="tag ${diffClass}">${escapeHtml(difficulty.label)}</span>
    <span class="tag tag-cost">${escapeHtml(costText)}</span>
  `;
}

function difficultyTagClass(label) {
  const v = (label || "").toLowerCase();
  if (v.includes("easy")) return "tag-easy";
  if (v.includes("hard")) return "tag-hard";
  return "tag-medium";
}

function costToEmoji(costLevel) {
  const v = (costLevel || "").toLowerCase();
  if (v.includes("low")) return "💰 Low";
  if (v.includes("high")) return "💰💰💰 High";
  return "💰💰 Medium";
}

function formatDietaryText(r) {
  // Pull dietary keywords from ingredients/steps since you don't have a column yet
  const text = `${r.ingredients || ""} ${r.prep_steps || ""}`.toLowerCase();

  const tags = [];
  if (text.includes("gluten-free")) tags.push("🌾 Gluten-Free");
  if (text.includes("dairy-free")) tags.push("🥛 Dairy-Free");
  if (text.includes("nut-free")) tags.push("🥜 Nut-Free");
  if (text.includes("vegan")) tags.push("🌱 Vegan");
  if (text.includes("vegetarian")) tags.push("🥗 Vegetarian");
  if (text.includes("halal")) tags.push("🕌 Halal");

  return tags.join(" · ");
}

function renderSteps(prepSteps) {
  if (!prepSteps) return "<p>—</p>";

  // If steps are separated by newline OR ; OR .
  const parts = prepSteps
    .split(/\n|;|\.\s+/)
    .map(s => s.trim())
    .filter(Boolean);

  if (parts.length <= 1) {
    return `<p>${escapeHtml(prepSteps)}</p>`;
  }

  return `
    <ol>
      ${parts.map(s => `<li>${escapeHtml(s)}</li>`).join("")}
    </ol>
  `;
}

function pickEmoji(name = "", ingredients = "") {
  const t = `${name} ${ingredients}`.toLowerCase();

  if (t.includes("wrap")) return "🌯";
  if (t.includes("pasta")) return "🍝";
  if (t.includes("rice")) return "🍚";
  if (t.includes("shrimp")) return "🍤";
  if (t.includes("salmon")) return "🐟";
  if (t.includes("chili")) return "🌶️";
  if (t.includes("shawarma")) return "🥙";
  if (t.includes("bowl")) return "🍲";
  if (t.includes("dessert")) return "🍰";
  if (t.includes("smoothie")) return "🥤";

  if (t.includes("salad")) return "🥗";
  if (t.includes("chicken")) return "🍗";
  if (t.includes("oat")) return "🥣";
  if (t.includes("pancake")) return "🥞";
  if (t.includes("banana")) return "🍌";
  if (t.includes("beef")) return "🥩";
  if (t.includes("stew")) return "🍲";

  return "🍽️";
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Initialize recipes page with search functionality + filters
async function initRecipesPage() {
  const input = document.getElementById("searchInput");
  const button = document.getElementById("searchBtn");

  // get selected filters from checkboxes
  const getSelectedFilters = () => {
    const selected = (name) =>
      Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(
        (el) => el.value
      );

    return {
      time: selected("time"),
      difficulty: selected("difficulty"),
      cost: selected("cost"),
      dietary: selected("dietary"),
    };
  };

   // loadRecipes  supports query + filters
  const loadRecipes = async (query = "") => {
    try {
      const token = getToken();
      if (!token) {
        window.location.href = "login-page.html";
        return;
      }

      const { time, difficulty, cost, dietary } = getSelectedFilters();

      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());

      // If your backend expects SINGLE value per filter, use the first selected:
      if (time[0]) params.set("time", time[0]);
      if (difficulty[0]) params.set("difficulty", difficulty[0]);
      if (cost[0]) params.set("cost", cost[0]);
      if (dietary[0]) params.set("dietary", dietary[0]);

      const res = await fetch(`${API_BASE_URL}/recipes?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        clearToken();
        window.location.href = "login-page.html";
        return;
      }

      if (!res.ok) throw new Error("Failed to load recipes");

      const recipes = await res.json();
      renderRecipes(recipes);
    } catch (e) {
      console.error(e);
      alert(e.message || "Could not load recipes. Check backend is running.");
    }
  };

  // Load all recipes initially
  await loadRecipes("");

  // Search button click
  if (button && input) {
    button.addEventListener("click", () => {
      loadRecipes(input.value);
    });

    // Press Enter to search
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        loadRecipes(input.value);
      }
    });
  }
  // whenever any filter checkbox changes, reload recipes
  const filterInputs = document.querySelectorAll(
      'input[name="time"], input[name="difficulty"], input[name="cost"], input[name="dietary"]'
    );

    filterInputs.forEach((el) => {
      el.addEventListener("change", () => {
        loadRecipes(input?.value || "");
      });
    });
}

