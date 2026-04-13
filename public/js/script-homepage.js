// home-page script

import { getToken, clearToken, isAuthenticated, getUserProfile, checkProfileCompletion, getInitials, logout, fetchAllRecipes, notificationManager } from "./script.js";
const API_BASE_URL = 'http://localhost:4002/api';

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
      window.location.href = '/pages/login-page.html';
    }
  }
}

/**
 * displays number of meal plans
 */
async function displayMealPlanCount() {
    const response = await fetch(`${API_BASE_URL}/mealPlan/owner`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${getToken()}`
            }
    });
    const mealPlans = await response.json();

    const mealPlanCountElement = document.getElementById("mealsPlannedCount");
    mealPlanCountElement.textContent = mealPlans.length; 
}

/**
 * displays number of public recipes
 */
async function displayPublicRecipeCount() {
    
    const userRecipes = await fetchAllRecipes();
    const publicRecipes = userRecipes.filter(e => e.is_private == false);

    const recipePostedElement = document.getElementById("recipesPostedCount");
    recipePostedElement.textContent = publicRecipes.length;
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
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        age: parseInt(age),
        weight: parseFloat(weight),
        height: parseFloat(height)
      })
    });

    if (response.ok) {
      closePrompt();
      notificationManager.success('Great! Your profile is now complete! 🎉');

      // Update UI to show completion
      const welcomeCard = document.querySelector('.welcome-card p');
      if (welcomeCard) {
        welcomeCard.innerHTML = 'Your profile is complete! Enjoy personalized recommendations. ✨';
      }
    } else {
      const error = await response.json();
      notificationManager.error('Error: ' + error.message);
    }
  } catch (error) {
    console.error('Error saving health metrics:', error);
    notificationManager.error('Failed to save. Please try again.');
  }
}

async function homePageMealPlan() {
    const container = document.getElementById('homeMealPlanSection');
    
    try {
        const today = new Date();
        const startWeek = new Date(today);
        startWeek.setDate(today.getDate() - today.getDay());

        const formatDate = (date) => date.toISOString().split('T')[0];

        console.log('�️ Today:', formatDate(today), '| Day of week:', today.getDay());
        console.log('📅 Fetching meal plan for week starting:', formatDate(startWeek));

        // First, fetch ALL meal plans for the user to see what exists
        const allPlansResponse = await fetch(`${API_BASE_URL}/mealPlan/owner`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        const allPlans = await allPlansResponse.json();
        console.log('📊 All user meal plans:', allPlans);

        // Find meal plan that contains today's date
        let mealPlan = null;
        if (allPlans && Array.isArray(allPlans)) {
            mealPlan = allPlans.find(plan => {
                const planStart = new Date(plan.week_start_date);
                const planEnd = new Date(plan.week_end_date);
                console.log(`Checking plan ${plan.id}: ${formatDate(planStart)} to ${formatDate(planEnd)}`);
                return today >= planStart && today <= planEnd;
            });
        }
        
        if (mealPlan) {
            console.log('✅ Found meal plan containing today:', mealPlan);
        } else {
            console.log('⚠️ No meal plan found for today. Using most recent:', allPlans?.[0]);
            mealPlan = allPlans?.[0]; // Fallback to most recent
        }
        
        let items = [];
        if (mealPlan && mealPlan.id) {
            console.log('📦 Fetching items for meal plan ID:', mealPlan.id);
            const responseItems = await fetch(`${API_BASE_URL}/mealPlan/${mealPlan.id}/items`, {
                headers: {
                    'Authorization': `Bearer ${getToken()}`
                }
            });

            if (!responseItems.ok) {
                console.error('Failed to fetch items:', responseItems.status);
                items = [];
            } else {
                items = await responseItems.json();
                console.log('🍽️ Items fetched:', items);
            }
        }

        // Fetch all recipes to map recipeId to recipe names
        console.log('🔄 Fetching all recipes...');
        const allRecipes = await fetchAllRecipes();
        console.log('📚 Recipes fetched:', allRecipes?.length || 0);
        
        const recipeMap = {};
        if (allRecipes && Array.isArray(allRecipes)) {
            allRecipes.forEach(recipe => {
                recipeMap[recipe.id] = recipe.name;
            });
            console.log('🗺️ Recipe map created with', Object.keys(recipeMap).length, 'recipes');
        }

        const dayMap = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
        const mealTypes = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];

        const getDayName = (date) => date.toLocaleDateString('en-US', { weekday: 'long' });

        let html = `
            <h2>This Week's Meal Plan</h2>
            <div class="meals-grid">
        `;

        // Next 3 days starting today
        for (let i = 0; i < 3; i++) {
            const currentDate = new Date(today);
            currentDate.setDate(today.getDate() + i);

            const dayEnum = dayMap[currentDate.getDay()];
            const dayName = getDayName(currentDate);

            html += `<div class="meal-card">
                        <div class="meal-day">${dayName}</div>`;

            for (const type of mealTypes) {
                const label = type.charAt(0) + type.slice(1).toLowerCase();

                // find the item directly
                const item = items.find(
                    i => i.day_of_week === dayEnum && i.meal_type === type
                );

                if (item) {
                    const recipeName = recipeMap[item.recipeId] || "Unnamed Meal";
                    console.log(`✅ Found ${dayEnum} ${type}:`, recipeName);
                    html += `
                        <div class="meal-item">
                            <span class="meal-type">${label}</span>
                            <span class="meal-name">${recipeName}</span>
                        </div>
                    `;
                } else {
                    html += `
                        <a href="/pages/meal-planner.html" class="meal-item empty">
                            <span class="meal-type">${label}</span>
                            <span class="meal-name">+ Add ${label}</span>
                        </a>
                    `;
                }
            }

            html += `</div>`;
        }

        html += `
            </div>
            <a href="/pages/meal-planner.html" class="view-full-plan">View Full Weekly Plan →</a>
        `;

        console.log('✨ Rendering meal plan HTML');
        container.innerHTML = html;
    } catch (error) {
        console.error('❌ Error loading meal plan:', error);
        console.error('Stack trace:', error.stack);
        container.innerHTML = `
            <h2>This Week's Meal Plan</h2>
            <p style="color: #666; padding: 20px; text-align: center;">Unable to load meal plan. Check browser console for details.</p>
        `;
    }
}

async function showSuggestions() {
    const container = document.getElementById('homeRecipeSuggestions');
    const titleContainer = document.createElement('h2');
    titleContainer.textContent = "Suggested Recipes For You";
    container.appendChild(titleContainer);

    const responseRecipes = await fetch(`${API_BASE_URL}/recipes/explore`, {
      method: 'GET',
      headers: {
            'Authorization': `Bearer ${getToken()}`
          }
    });

  const publicRecipes = await responseRecipes.json();
  const randomRecipes = publicRecipes.sort(() => 0.5 - Math.random()).slice(0, 3);

  const recipesGrid = document.createElement('div');
  recipesGrid.classList.add('recipes-grid');
  let html = '';

  for (const recipe of randomRecipes) {
    html += `
      <a href="/pages/recipes.html" class="recipe-card">
        <div class="recipe-image">🍽️</div>
        <div class="recipe-info">
            <h4>${recipe.name}</h4>
            <div class="recipe-details">
                <span>⏱️${recipe.prep_time} mins</span>
                <span>💰${recipe.cost}</span>
            </div>
        </div>
    </a>
    `
  }
  recipesGrid.innerHTML = html;
  container.appendChild(recipesGrid);

  const button = document.createElement('a');
  button.href = 'recipes.html';
  button.classList.add('view-full-plan');
  button.textContent = 'View All Recipes →';
  container.appendChild(button);
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

document.addEventListener("DOMContentLoaded", () => {
    getInitials();

    console.log('🏠 INIT_HOME_PAGE CALLED at:', new Date().toISOString());

    // Check if prompt exists
    const prompt = document.getElementById('profilePrompt');
    console.log('Prompt element exists at init:', !!prompt);

    // Check authentication
    if (!isAuthenticated()) {
    window.location.href = '/pages/login-page.html';
    return;
    }

    // Load user profile and display name
    loadUserProfile();

    // Check profile completion
    checkProfileCompletion();

    // Add form submit handler
    const metricsForm = document.getElementById('healthMetricsForm');
    if (metricsForm) {
    metricsForm.addEventListener('submit', saveHealthMetrics);
    }

    displayMealPlanCount();
    displayPublicRecipeCount();
    homePageMealPlan();
    showSuggestions();

    logout();
});