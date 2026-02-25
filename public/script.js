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

    default:
      console.log('Page not recognized for auto-initialization');
  }
});
