// script-recipe.js
import { getToken, clearToken, isAuthenticated, getUserProfile, getInitials, logout, fetchRecipeRatings, fetchAverageRating, renderStars, fetchRecipeData } from "./script.js";
const API_BASE_URL = 'http://localhost:4002/api';
let allRecipes = []; // Store all recipes for filtering
/**
 * Filter recipes by search term
 */
async function filterRecipesBySearch(searchTerm) {
  console.log('Searching for:', searchTerm);

  const generalGrid = document.querySelector('.section:last-child .recipe-cards-grid');
  if (!generalGrid) return;

  // If search is empty, show all recipes
  if (!searchTerm || searchTerm === '') {
    await displayFilteredRecipes(allRecipes);
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
    await displayFilteredRecipes(filtered);
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
    await displayFilteredRecipes(allRecipes);
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
  await displayFilteredRecipes(filtered);
}
/**
 * Display filtered recipes in the general grid
 */
async function displayFilteredRecipes(recipes) {
  const generalGrid = document.querySelector('.section:last-child .recipe-cards-grid');
  if (!generalGrid) return;

  generalGrid.innerHTML = '';

  if (recipes.length === 0) {
    generalGrid.innerHTML = '<p class="no-results">No recipes match your filters</p>';
    return;
  }

  for (const recipe of recipes) {
    const card = await createPublicRecipeCard(recipe);
    generalGrid.appendChild(card);
  }
}

// recipe functions

/**
 * Load owner's recipes
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
async function editRecipe(id) {
  console.log('Edit recipe:', id);
  window.location.href = `edit-recipe.html?id=${id}`;
}
/**
 * Delete a recipe by ID
 */
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
      } else {
        alert('Failed to delete recipe');
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
      alert('Error deleting recipe');
    }
  }
}
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

// explore section functions

/**
 * Load all public recipes
 */
async function loadExploreRecipes() {
  console.log("🌍 Loading explore recipes...");

  const grid = document.getElementById("generalRecipesGrid");
  if (!grid) return;

  try {
    const response = await fetch(`${API_BASE_URL}/recipes/explore`, {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    if (!response.ok) throw new Error("Failed to fetch explore recipes");

    const recipes = await response.json();

    console.log("Explore recipes:", recipes.length);

    allRecipes = recipes;
    grid.innerHTML = "";

    for (const recipe of recipes) {
      const card = await createPublicRecipeCard(recipe);
      grid.appendChild(card);
    }

  } catch (error) {
    console.error("Error loading explore recipes:", error);
  }
}

/**
 * Create recipe card element
 */
function createRecipeCard(recipe, isMyRecipe = false) {
  const details = document.createElement('details');
  details.className = 'recipe-card-full';

  // Determine difficulty class
  let difficultyClass = 'tag-easy';
  if ((recipe.difficulty || '').toLowerCase() === 'medium') difficultyClass = 'tag-medium';
  if ((recipe.difficulty || '').toLowerCase() === 'hard') difficultyClass = 'tag-hard';

  // Cost display
  let costDisplay = '💰 Low';
  if ((recipe.cost || '').toLowerCase() === 'medium') costDisplay = '💰💰 Medium';
  if ((recipe.cost || '').toLowerCase() === 'high') costDisplay = '💰💰💰 High';

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
        <button class="btn-edit-recipe">Edit</button>
        <button class="btn-delete-recipe">Delete</button>
      </div>
    `;
  } else {
    actionButtons = `
      <button class="btn-save-recipe">+ Save to My Recipes</button>
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

  const editBtn = details.querySelector('.btn-edit-recipe');
  const deleteBtn = details.querySelector('.btn-delete-recipe');
  const saveBtn = details.querySelector('.btn-save-recipe');

  if (editBtn) editBtn.addEventListener('click', () => editRecipe(recipe.id));
  if (deleteBtn) deleteBtn.addEventListener('click', () => deleteRecipe(recipe.id));
  if (saveBtn) saveBtn.addEventListener('click', () => saveRecipeToMyCollection(recipe.id));

  return details;
}

async function createPublicRecipeCard(recipe) {
  const details = document.createElement('details');
  details.className = 'recipe-card-full public-recipe-card';
  details.dataset.recipeId = recipe.id;

  const avgRating = await fetchAverageRating(recipe.id);
  const ratings = await fetchRecipeRatings(recipe.id);
  const comments = ratings.filter(r => r.comment && r.comment.trim() !== "");
  //const video = await fetchRecipeVideo(recipe.id);

  let difficultyClass = 'tag-easy';
  const difficultyValue = (recipe.difficulty || 'Easy');
  if (difficultyValue.toLowerCase() === 'medium') difficultyClass = 'tag-medium';
  if (difficultyValue.toLowerCase() === 'hard') difficultyClass = 'tag-hard';

  let costDisplay = '💰 Low';
  if ((recipe.cost || '').toLowerCase() === 'medium') costDisplay = '💰💰 Medium';
  if ((recipe.cost || '').toLowerCase() === 'high') costDisplay = '💰💰💰 High';

  const dietaryDisplay = recipe.dietary_tags && recipe.dietary_tags.length > 0
    ? recipe.dietary_tags.join(' · ')
    : '';

  const ownerName = recipe.owner?.email
    ? `@${recipe.owner.email.split('@')[0]}`
    : '@user';

  const ownerInitials = recipe.owner
    ? `${(recipe.owner.firstName || '?')[0]}${(recipe.owner.lastName || '?')[0]}`
    : '??';

  const firstVideo = Array.isArray(recipe.videos) && recipe.videos.length > 0
  ? recipe.videos[0]
  : null;

  const videoLink = firstVideo?.videoUrl || null;

  const videoHTML = videoLink
    ? `
      <a href="${videoLink}" target="_blank" class="video-link">
        ▶ Watch Video
      </a>
    `
    : `
      <p>No video available.</p>
    `;

  const commentsHTML = comments.length
    ? comments.map(comment => `
        <div class="comment-item">
          <div class="comment-avatar">${comment.user?.firstName[0]}${comment.user?.lastName[0]}</div>
          <div class="comment-body">
            <div class="comment-header">
              <span class="comment-username">@${comment.user?.email ? comment.user.email.split('@')[0] : 'user'}</span>
              <span class="comment-time">${new Date(comment.updated_at || comment.created_at).toLocaleDateString()}</span>
            </div>
            <p class="comment-text">${comment.comment}</p>
          </div>
        </div>
      `).join('')
    : '<p>No comments yet.</p>';

  details.innerHTML = `
    <summary class="recipe-card-top">
      <span class="recipe-card-emoji">${recipe.emoji || '🍽️'}</span>
      <div class="recipe-card-summary">
        <div class="recipe-card-tags">
          <span class="tag ${difficultyClass}">${difficultyValue}</span>
          <span class="tag tag-cost">${costDisplay}</span>
          ${dietaryDisplay ? `<span class="tag tag-diet">${dietaryDisplay}</span>` : ''}
        </div>
        <h3 class="recipe-card-title">${recipe.name}</h3>
        <div class="recipe-card-meta">
          <span>⏱️ ${recipe.prep_time ?? '-'} min</span>
        </div>
        <div class="recipe-card-author-row">
          <div class="recipe-author-avatar">${ownerInitials}</div>
          <span class="recipe-author-name">${ownerName}</span>
          <div class="recipe-star-rating">${renderStars(avgRating)}</div>
          <span class="recipe-rating-count">(${ratings.length})</span>
        </div>
      </div>
      <span class="recipe-card-chevron">▼</span>
    </summary>

    <div class="recipe-card-details">
      <div class="recipe-video">
        <h4>🎥 Video</h4>
        ${videoHTML}
      </div>

      <div class="recipe-card-ingredients">
        <strong>🛒 Ingredients</strong><br>
        ${(recipe.ingredients || []).join(' · ')}
      </div>

      <div class="recipe-card-steps">
        <strong>📋 Steps</strong>
        <ol>
          ${(recipe.prep_steps || []).map(step => `<li>${step}</li>`).join('')}
        </ol>
      </div>

      <div class="recipe-comments">
        <h4 class="comments-heading">💬 Comments <span class="comments-count">${comments.length}</span></h4>
        <div class="comments-list">${commentsHTML}</div>
      </div>

      <div class="recipe-rate-comment">
        <h4>⭐ Rate & 💬 Comment</h4>
        <div class="stars-input">
          <input type="radio" id="star5-${recipe.id}" name="rating-${recipe.id}" value="5"><label for="star5-${recipe.id}">★</label>
          <input type="radio" id="star4-${recipe.id}" name="rating-${recipe.id}" value="4"><label for="star4-${recipe.id}">★</label>
          <input type="radio" id="star3-${recipe.id}" name="rating-${recipe.id}" value="3"><label for="star3-${recipe.id}">★</label>
          <input type="radio" id="star2-${recipe.id}" name="rating-${recipe.id}" value="2"><label for="star2-${recipe.id}">★</label>
          <input type="radio" id="star1-${recipe.id}" name="rating-${recipe.id}" value="1"><label for="star1-${recipe.id}">★</label>
        </div>
        <textarea class="comment-input" id="comment-${recipe.id}" placeholder="Add a comment..." rows="2"></textarea>
        <button class="btn-submit-comment" data-recipe-id="${recipe.id}">Submit</button>
      </div>

      <button class="btn-save-recipe" data-save-recipe-id="${recipe.id}">+ Save to My Recipes</button>
    </div>
  `;

  const submitBtn = details.querySelector('.btn-submit-comment');
  submitBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    const selectedRating = details.querySelector(`input[name="rating-${recipe.id}"]:checked`);
    const commentText = details.querySelector(`#comment-${recipe.id}`).value.trim();

    if (!selectedRating) {
      alert("Please select a rating.");
      return;
    }

    const result = await submitRecipeRatingAndComment(
      recipe.id,
      selectedRating ? parseInt(selectedRating.value, 10) : null,
      commentText
    );

    if (result.success) {
      alert("Comment/rating submitted!");
      await loadExploreRecipes();
    } else {
      alert(result.error || "Failed to submit.");
    }
  });

  const saveBtn = details.querySelector('[data-save-recipe-id]');
  saveBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    await saveRecipeToMyCollection(recipe.id);
  });

  return details;
}

// Save a recipe from explore to My Recipes by copying its data and creating a new recipe owned by the user
async function saveRecipeToMyCollection(recipeId) {
  try {

    const recipe = await fetchRecipeData(recipeId);

    const recipeData = {
      name: recipe.name,
      ingredients: recipe.ingredients || [],
      prep_time: recipe.prep_time,
      prep_steps: recipe.prep_steps || [],
      cost: recipe.cost,
      difficulty: recipe.difficulty,
      dietary_tags: recipe.dietary_tags || [],
      allergens: recipe.allergens || []
    };

    const createResponse = await fetch(`${API_BASE_URL}/recipes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getToken()}`
      },
      body: JSON.stringify(recipeData)
    });

    const createData = await createResponse.json();

    if (!createResponse.ok) {
      throw new Error(createData.message || "Failed to save recipe");
    }

    alert("Recipe saved to My Recipes!");
    loadMyRecipes();
  } catch (error) {
    console.error("Error saving recipe to collection:", error);
    alert(error.message || "Failed to save recipe");
  }
}

/**
 *  Submit recipe rating and comment
 * */
async function submitRecipeRatingAndComment(recipeId, rating, comment) {
  try {
    const response = await fetch(`${API_BASE_URL}/recipeRatings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        recipeId,
        rating,
        comment
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to submit rating/comment");
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error submitting rating/comment:", error);
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
// initialize page function
document.addEventListener('DOMContentLoaded', () => {
  console.log('🍽️ INIT_RECIPES_PAGE CALLED');

  // Check authentication
  if (!isAuthenticated()) {
    window.location.href = 'login-page.html';
    return;
  }
  getInitials();
  // Load My Recipes
  loadMyRecipes();

  // Load Explore Recipes
  loadExploreRecipes();

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
    clearFiltersBtn.addEventListener('click', async () => {
      console.log('Clear Filters button clicked');
      document.querySelectorAll('.filter-bar input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
      });
      await displayFilteredRecipes(allRecipes);
    });
  }

  //logout functionality
  logout();
});