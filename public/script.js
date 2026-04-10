// script.js
// Frontend-Backend Integration for MealMajor
// Handles: Login, Signup, Form Validation, Token Management, Profile Loading, Recipes


// CONFIGURATION
const API_BASE_URL = 'http://localhost:4002/api';
const TOKEN_KEY = 'mealmajor_token';

// UTILITY FUNCTIONS
/**
 * Store authentication token in localStorage
 */
export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}
/**
 * Retrieve authentication token from localStorage
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
/**
 * Remove authentication token (logout)
 */
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}
/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return !!getToken();
}
/**
 * Display error message in a form field
 */
export function showError(elementId, message) {
  const errorElement = document.getElementById(elementId);
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
}
/**
 * Clear all error messages on a page
 */
export function clearAllErrors() {
  const errorElements = document.querySelectorAll('.error');
  errorElements.forEach(el => {
    el.textContent = '';
    el.style.display = 'none';
  });
}
/**
 * Show loading state on button
 */
export function setButtonLoading(button, isLoading) {
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
/**
 * Get initials of the user for avatar display in navbar
 */
export async function getInitials() {
  // If not authenticated, skip
  if (!isAuthenticated()) return;
  
  const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });

  const user = await response.json();
  const avatar = document.getElementById("avatarNav");
  if (avatar && user.firstName && user.lastName) {
    avatar.textContent = user.firstName[0] + user.lastName[0];
    return avatar.textContent;
  }
}
/**
 * Validate email format
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
/**
 * logout function to clear token and redirect to login page
 */
export function logout() {
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
 * Get user profile
 */
export async function getUserProfile() {
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
 * Check profile completion status
 */
export async function checkProfileCompletion() {
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
 * fetch ratings for a recipe
 */
export async function fetchRecipeRatings(recipeId) {
  try {
    const response = await fetch(`${API_BASE_URL}/recipeRatings/${recipeId}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });

    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Error fetching recipe ratings:", error);
    return [];
  }
}
/**
 * Fetch average rating for a recipe
 */
export async function fetchAverageRating(recipeId) {
  try {
    const response = await fetch(`${API_BASE_URL}/averageRating/${recipeId}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });

    if (!response.ok) return 0;
    const avg = await response.json();
    return Number(avg) || 0;
  } catch (error) {
    console.error("Error fetching average rating:", error);
    return 0;
  }
}

export function renderStars(avgRating) {
  const rounded = Math.round(avgRating);
  return '★'.repeat(rounded) + '☆'.repeat(5 - rounded);
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
 * Function to create a new meal plan item
 */
export async function createMealPlanItem(mealPlanId, recipeId, day_of_week, meal_type, notes = "", allowDuplicate = false) {
  try {
    if (!getToken()) {
      return { success: false, error: "You must be logged in." };
    }

    if (!mealPlanId || Number.isNaN(parseInt(mealPlanId, 10))) {
      return { success: false, error: "Invalid meal plan ID." };
    }

    if (!recipeId || Number.isNaN(parseInt(recipeId, 10))) {
      return { success: false, error: "Invalid recipe selected." };
    }

    if (!day_of_week || !meal_type) {
      return { success: false, error: "Missing meal assignment details." };
    }

    const response = await fetch(`${API_BASE_URL}/mealPlan/item`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mealPlanId: parseInt(mealPlanId, 10),
        recipeId: parseInt(recipeId, 10),
        day_of_week,
        meal_type,
        notes,
        allowDuplicate
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to create meal plan item.",
        code: data.code,
        duplicates: data.duplicates
      };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error creating meal plan item:", error);
    return { success: false, error: "Something went wrong while assigning the meal." };
  }
}

// FETCHING DATA FUNCTIONS
/**
 * Fetch recipe data by ID
 */
export async function fetchRecipeData(recipeId) {
    try {
    const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}`, {
      method: 'GET',  
      headers: {
        'Authorization': `Bearer ${getToken()}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch recipe');
    }

    const recipe = await response.json();

    return recipe;
    } catch (error) {
        console.error('Error fetching recipe:', error);
    }
}
/**
 * Fetch all recipes
 */
export async function fetchAllRecipes() {
  try {
    const response = await fetch(`${API_BASE_URL}/recipes`, {
      method: 'GET',  
      headers: {
        'Authorization': `Bearer ${getToken()}`
        }
    });

    const recipes = await response.json();
    return recipes;
  } catch (error) {
    console.error('Error fetching all recipes:', error);
  }
}