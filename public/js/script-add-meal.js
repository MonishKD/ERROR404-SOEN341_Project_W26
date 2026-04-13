import { getInitials, createMealPlanItem, logout, fetchAllRecipes, isAuthenticated, getToken, notificationManager } from "./script.js";

const API_BASE_URL = "http://localhost:4002/api";

/**
 * Helper functions
 */
function getSelectedMealSlot() {
  const raw = localStorage.getItem('selectedMealSlot');
  return raw ? JSON.parse(raw) : null;
}
function clearSelectedMealSlot() {
  localStorage.removeItem('selectedMealSlot');
}
function formatDuplicateMealAssignments(duplicates = []) {
  if (!Array.isArray(duplicates) || duplicates.length === 0) {
    return "another slot";
  }
  // Map the duplicate assignments to user-friendly strings and join them with commas
  return duplicates
    .map(({ day_of_week, meal_type }) => {
      const prettyDay = day_of_week
        ? day_of_week.charAt(0) + day_of_week.slice(1).toLowerCase()
        : "Unknown day";
      const prettyMeal = meal_type
        ? meal_type.charAt(0) + meal_type.slice(1).toLowerCase()
        : "Unknown meal";
      return `${prettyDay} ${prettyMeal}`;
    })
    .join(", ");
}
/**
 * Load recipes for add page and make them clickable
 */
async function loadRecipesForAddMealPage() {
  const recipes = await fetchAllRecipes();
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
}
/**
 * Validate selected meal
 */
function validateSelectedMealSlot(slot) {
  const validDays = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY"
  ];

  const validMealTypes = [
    "BREAKFAST",
    "LUNCH",
    "DINNER",
    "SNACK"
  ];

  if (!slot) {
    return { valid: false, message: "No meal slot selected." };
  }

  if (!slot.mealPlanId || Number.isNaN(parseInt(slot.mealPlanId, 10))) {
    return { valid: false, message: "Invalid meal plan selected." };
  }

  if (!slot.day_of_week || !validDays.includes(slot.day_of_week)) {
    return { valid: false, message: "Invalid day selected." };
  }

  if (!slot.meal_type || !validMealTypes.includes(slot.meal_type)) {
    return { valid: false, message: "Invalid meal type selected." };
  }

  return { valid: true };
}
/**
 * Update an item of the meal plan
 */
async function updateMealPlanItem(itemId, recipeId, day_of_week, meal_type, notes = "", allowDuplicate = false) {
  try {
    if (!getToken()) {
      return { success: false, error: "You must be logged in." };
    }

    if (!itemId || Number.isNaN(parseInt(itemId, 10))) {
      return { success: false, error: "Invalid meal assignment ID." };
    }

    if (!recipeId || Number.isNaN(parseInt(recipeId, 10))) {
      return { success: false, error: "Invalid recipe selected." };
    }

    if (!day_of_week || !meal_type) {
      return { success: false, error: "Missing meal assignment details." };
    }

    const response = await fetch(`${API_BASE_URL}/mealPlan/items/${parseInt(itemId, 10)}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
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
        error: data.message || "Failed to update meal assignment.",
        code: data.code,
        duplicates: data.duplicates
      };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error updating meal plan item:", error);
    return { success: false, error: "Something went wrong while updating the meal." };
  }
}

// initialize add meal page
document.addEventListener("DOMContentLoaded", async () => {
    
    if (!isAuthenticated()) {
    window.location.href = '/pages/login-page.html';
    return;
    }

    getInitials();

    const slot = getSelectedMealSlot();
    const slotValidation = validateSelectedMealSlot(slot);
    const header = document.querySelector('.profile-header h1');

    if (!slotValidation.valid) {
    notificationManager.error(slotValidation.message);
    window.location.href = '/pages/meal-planner.html';
    return;
    }

    if (header && slot?.itemId) {
    header.textContent = '✏️ Edit Meal';
    }

    await loadRecipesForAddMealPage();

    const recipeCards = document.querySelectorAll('.recipe-card[data-recipe-id]');

    if (!recipeCards.length) {
    console.warn("No recipe cards found on add-meal page.");
    }

    recipeCards.forEach(card => {
    const recipeId = card.dataset.recipeId;

    if (!recipeId || Number.isNaN(parseInt(recipeId, 10))) {
        return;
    }

    card.style.cursor = 'pointer';

    card.addEventListener('click', async (e) => {
        e.preventDefault();

        card.style.pointerEvents = 'none';

        let result = slot.itemId
        ? await updateMealPlanItem(
            slot.itemId,
            recipeId,
            slot.day_of_week,
            slot.meal_type,
            slot.notes || ""
            )
        : await createMealPlanItem(
            slot.mealPlanId,
            recipeId,
            slot.day_of_week,
            slot.meal_type
            );
        // If the API returns a duplicate recipe error, prompt the user for confirmation to allow duplicates
        if (!result.success && result.code === 'DUPLICATE_RECIPE_IN_WEEK') {
        const duplicateLocations = formatDuplicateMealAssignments(result.duplicates);
        notificationManager.confirm(
            `This recipe is already used this week in ${duplicateLocations}. Do you want to use it again?`,
            async () => {
            // If the user confirms, retry the API call with allowDuplicate set to true
            result = slot.itemId
                ? await updateMealPlanItem(
                    slot.itemId,
                    recipeId,
                    slot.day_of_week,
                    slot.meal_type,
                    slot.notes || "", // for empty notes
                    true
                    )
                : await createMealPlanItem(
                    slot.mealPlanId,
                    recipeId,
                    slot.day_of_week,
                    slot.meal_type,
                    "", // for empty notes
                    true
                    );

            if (result.success) {
                clearSelectedMealSlot();
                notificationManager.success(slot.itemId ? 'Meal updated successfully!' : 'Meal added successfully!');
                setTimeout(() => {
                    window.location.href = '/pages/meal-planner.html';
                }, 800);
            } else {
                card.style.pointerEvents = 'auto';
                notificationManager.error(result.error || (slot.itemId ? 'Failed to update meal.' : 'Failed to add meal.'));
            }
            }
        );
        } else if (result.success) {
        clearSelectedMealSlot();
        notificationManager.success(slot.itemId ? 'Meal updated successfully!' : 'Meal added successfully!');
        setTimeout(() => {
            window.location.href = '/pages/meal-planner.html';
        }, 800);
        } else {
        card.style.pointerEvents = 'auto';
        notificationManager.error(result.error || (slot.itemId ? 'Failed to update meal.' : 'Failed to add meal.'));
        }
    });
    });

    // logout functionality
    logout();
});