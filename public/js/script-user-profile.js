// script-user-profile.js - Handles user profile page interactions and data fetching

import { getInitials, getUserProfile, isAuthenticated, getToken, fetchAverageRating, fetchRecipeRatings, renderStars, fetchAllRecipes, logout, notificationManager } from "./script.js";
const API_BASE_URL = "http://localhost:4002/api";
const MAX_SIZE_MB = 50; // max video upload size

let publicRecipes = [];
let privateRecipes = [];
async function refreshRecipes() {
  const userRecipes = await fetchAllRecipes();
  publicRecipes = userRecipes.filter(e => e.is_private == false);
  privateRecipes = userRecipes.filter(e => e.is_private == true);
}
/**
 * Display user profile information and stats
 */
async function showUserProfile() {
  const container = document.getElementById("userProfileHero");
  container.innerHTML = "";

  const result = await getUserProfile();
  const user = result.data;

  if (!user) {
    console.error('Failed to load user profile:', result);
    return;
  }

  container.innerHTML = `
    <div class="avatar-circle avatar-large">${user.firstName[0]}${user.lastName[0]}</div>
      <div class="user-hero-info">
        <h1 class="user-display-name">${user.firstName + " " + user.lastName}</h1>
        <p class="user-handle">@${user.email.substring(0, user.email.lastIndexOf('@'))}</p>
        <div class="user-hero-stats">
          <div class="hero-stat">
              <span class="hero-stat-num">${publicRecipes.length}</span>
              <span class="hero-stat-label">Public Recipes</span>
          </div>
          <div class="hero-stat">
              <span class="hero-stat-num">${privateRecipes.length}</span>
              <span class="hero-stat-label">Private Recipes</span>
          </div>
        </div>
      </div>
    </div>
  `;
}
/**
 * Show public recipes of the owner
 */
async function showPublicRecipes() {
  const container = document.getElementById("tab-public");
  container.innerHTML = "";

  for (const e of publicRecipes) {
    //ratings
    const avg = await fetchAverageRating(e.id);
    // Build stars string
    const stars = renderStars(avg);
    //number of ratings
    const ratings = await fetchRecipeRatings(e.id);
    let numberOfRatings = ratings.length;
    if(!numberOfRatings){
      numberOfRatings = 0;
    }
    //comments
    const comments = ratings.filter(r => r.comment && r.comment.trim() !== "");
    const commentsHTML = comments.map(r => `
      <div class="comment-item">
        <div class="comment-avatar">
          ${r.user?.firstName ? r.user.firstName[0] : "?"}
        </div>
        <div class="comment-body">
          <div class="comment-header">
            <span class="comment-username">
              @${r.user?.email ? r.user.email.substring(0, r.user.email.lastIndexOf('@')) : "unknown"}
            </span>
            <span class="comment-time">${new Date(r.updated_at).toLocaleDateString()}</span>
          </div>
          <p class="comment-text">${r.comment}</p>
        </div>
      </div>
    `).join("");

    //video
    const firstVideo = Array.isArray(e.videos) && e.videos.length > 0
      ? e.videos[0]
      : null;

    const videoLink = firstVideo?.videoUrl || null;

    let videoHTML = videoLink
      ? `
        <a href="${videoLink}" target="_blank" class="video-link">
          ▶️ Watch Video
        </a>
      `
      : `
        <p>No video available.</p>
      `;

    const recipeCard = document.createElement("div");
    recipeCard.className = "recipe-card-full";

    recipeCard.innerHTML = `
        <details>
          <summary class="recipe-card-top">
            <span class="recipe-card-emoji">🍽️</span>
            <div class="recipe-card-summary">
                <h3 class="recipe-card-title">${e.name}</h3>
                <div class="recipe-card-tags">
                    <span class="tag tag-${e.difficulty.toLowerCase()}">${e.difficulty}</span>
                    <span class="tag tag-cost">💰 ${e.cost}</span>
                </div>
                <div class="recipe-card-meta">
                    <span>⏱️ ${e.prep_time} min</span>
                      <span class="recipe-rating">
                          <span class="stars-display">${stars}</span>
                          <span class="rating-score">${avg.toFixed(1)}</span>
                          <span class="rating-count">(${numberOfRatings} ratings)</span>
                      </span>
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
                <strong>Ingredients:</strong><br>
                ${e.ingredients.join(' · ')}
            </div>
            <div class="recipe-card-steps">
                <strong>Steps:</strong>
                <ol>
                    ${e.prep_steps.map(step => `<li>${step}</li>`).join('')}
                </ol>
            </div>

            <p class="rate-prompt">Your recipe's ratings</p>
            <div class="recipe-rating">
                <span class="stars-display">${stars}</span>
                <span class="rating-score">${avg.toFixed(1)}</span>
                <span class="rating-count">(${numberOfRatings} ratings)</span>
            </div>

            <div class="recipe-comments">
              <h4 class="comments-heading">
                💬 Comments <span class="comments-count">${comments.length}</span>
              </h4>

              <div class="comments-list">
                ${commentsHTML || "<p>No comments yet.</p>"}
              </div>
            </div>

            <div class="video-upload-form">
                <label class="video-upload-label">
                    🎥 Add a video or a link to a URL
                    <input type="file" id="videoInput-${e.id}" name="video" accept="video/*">
                </label>
                <div class="video-url-section">
                  <input type="text" id="urlInput-${e.id}" placeholder="Paste video URL (YouTube, etc.)">
                </div>
                <button type="button" class="btn-secondary">Upload</button>
            </div>

            <div class="recipe-card-actions">
                <button type="button" class="btn-make-public">🌍 Make Private</button>
            </div>
          </div>
        </details>

    `;
    container.appendChild(recipeCard);

    recipeCard.querySelector('.btn-make-public').addEventListener('click', () => changePrivacy(e.id, true));
    recipeCard.querySelector('.btn-secondary').addEventListener('click', () => uploadVideo(e.id));};
}
/**
 * Display private recipes of the owner
 */
async function showPrivateRecipes() {
  const container = document.getElementById("tab-private");
  container.innerHTML = "";

  const note = document.createElement("p");
  note.className = "private-note";
  note.textContent = "🔒 Only you can see these recipes. They are automatically added after creating a recipe."
  container.appendChild(note);

  for (const e of privateRecipes){
    const recipeCard = document.createElement("div");
    recipeCard.className = "recipe-card-full";
    
    recipeCard.innerHTML = `
        <details>
          <summary class="recipe-card-top">
            <span class="recipe-card-emoji">🍽️</span>
            <div class="recipe-card-summary">
                <h3 class="recipe-card-title">${e.name}</h3>
                <div class="recipe-card-tags">
                    <span class="tag tag-${e.difficulty.toLowerCase()}">${e.difficulty}</span>
                    <span class="tag tag-cost">💰 ${e.cost}</span>
                    <span class="tag tag-private">🔒 Private</span>
                </div>
                <div class="recipe-card-meta">
                    <span>⏱️ ${e.prep_time} min</span>
                </div>
            </div>
            <span class="recipe-card-chevron">▼</span>
        </summary>
        <div class="recipe-card-details">
            <div class="recipe-card-ingredients">
                <strong>Ingredients:</strong><br>
                ${e.ingredients.join(' · ')}
            </div>
            <div class="recipe-card-steps">
                <strong>Steps:</strong>
                <ol>
                    ${e.prep_steps.map(step => `<li>${step}</li>`).join('')}
                </ol>
            </div>
            <div class="recipe-card-actions">
                <a href="/pages/edit-recipe.html?id=${e.id}" class="btn-edit-recipe">✏️ Edit</a>
                <button type="button" class="btn-delete-recipe">🗑️ Delete</button>
                <button type="button" class="btn-make-public">🌍 Make Public</button>
            </div>
          </div>
        </details>

    `;
    container.appendChild(recipeCard);

    recipeCard.querySelector('.btn-delete-recipe').addEventListener('click', () => deleteRecipe(e.id));
    recipeCard.querySelector('.btn-make-public').addEventListener('click', () => changePrivacy(e.id, false));};
}
/**
 * Upload a video for a specific recipe
 */
async function uploadVideo(id) {
  const fileInput = document.getElementById(`videoInput-${id}`);
  const urlInput = document.getElementById(`urlInput-${id}`);
  const file = fileInput.files[0];
  const url = urlInput.value.trim();
  if (!file && !url) {
    notificationManager.error("Please select a video first.");
    return;
  }
  const recipeId = id;

  if (file) {
    const sizeMB = file.size / (1024 * 1024);

    if (sizeMB > MAX_SIZE_MB) {
      notificationManager.error("File is too large! Max is 50MB.");
      return;
    }
  
    const formData = new FormData();
    formData.append("video", file);
  
    try {
      const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}/video/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`
        },
        body: formData
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }
  
      notificationManager.success("Video uploaded successfully!");
      await refreshRecipes();
      await showPublicRecipes();
  
    } catch (error) {
      console.error("Upload error:", error);
      notificationManager.error(error.message || "Error uploading video");
    }
  }

  if (url) {

    try {
      const parsed = new URL(url);
      if (!(parsed.protocol === "http:" || parsed.protocol === "https:")) {
        notificationManager.error("Invalid url");
        return;
      }
    } catch (err) {
      console.error("Invalid URL:", err);
      notificationManager.error("Invalid url");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}/video/url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify({ videoUrl: url })
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }
  
      notificationManager.success("Video URL saved!");
      await refreshRecipes();
      await showPublicRecipes();
  
    } catch (error) {
      console.error("Upload error:", error);
      notificationManager.error(error.message || "Error uploading video");
    }
  }

};

/**
 * Change the privacy of a recipe
 */
async function changePrivacy(recipeId, privacy) {
  try {
    const response = await fetch(`${API_BASE_URL}/recipes/privacy/${recipeId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ is_private: privacy })
    });

    if (!response.ok) {
      throw new Error("Failed to update privacy");
    }

    await refreshRecipes();

    showPublicRecipes();
    showPrivateRecipes();
    showUserProfile();
  } catch (error) {
    console.error("Error changing privacy:", error);
    notificationManager.error("Failed to update privacy.");
  }
}

// initialize user profile page
document.addEventListener("DOMContentLoaded", async () => {
    // Check authentication
    if (!isAuthenticated()) {
      globalThis.location.href = '/pages/login-page.html';
      return;
    }

    await refreshRecipes();

    getInitials();
    
    showUserProfile()
    showPublicRecipes();
    showPrivateRecipes();

    // logout functionality
    logout();
});