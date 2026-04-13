import { saveToken, setButtonLoading, clearAllErrors, notificationManager } from "./script.js";
const API_BASE_URL = 'http://localhost:4002/api';

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

// initialization
document.addEventListener('DOMContentLoaded', () => {
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
        notificationManager.error('Please enter your email address');
        return;
    }

    if (!password) {
        notificationManager.error('Please enter your password');
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
        globalThis.location.href = '/pages/home-page.html';
    } else {
        // Show error
        notificationManager.error(result.error || 'Login failed. Please check your credentials and try again.');
    }
    });
});