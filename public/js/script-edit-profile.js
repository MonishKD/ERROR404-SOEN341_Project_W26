
import { getToken, clearToken, clearAllErrors, setButtonLoading, isAuthenticated, getInitials, showError, validateEmail, getUserProfile, logout, notificationManager } from "./script.js";
const API_BASE_URL = 'http://localhost:4002/api';

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
      window.location.href = '/pages/login-page.html';
    }
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

// initialization
document.addEventListener('DOMContentLoaded', () => {
// Check authentication
    if (!isAuthenticated()) {
    window.location.href = '/pages/login-page.html';
    return;
    }
     
    getInitials();

    // Load user profile and populate form
    loadUserProfileForEdit();

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
        notificationManager.success('Profile updated successfully!');
        // Wait 800ms before redirecting so user can see the notification
        setTimeout(() => {
          window.location.href = '/pages/home-page.html';
        }, 800);
        } else {
        notificationManager.error(result.error || 'Failed to update profile. Please try again.');
        }
    });
    }

    //logout functionality
    logout();
});