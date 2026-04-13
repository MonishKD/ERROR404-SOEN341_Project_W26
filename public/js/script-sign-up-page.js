import { clearAllErrors, setButtonLoading, validateEmail, showError } from "./script.js";
const API_BASE_URL = 'http://localhost:4002/api';

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

// initialization
document.addEventListener('DOMContentLoaded', () => {
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
        window.location.href = '/pages/login-page.html';
        } else {
        // Show error
        if (result.error.includes('Email')) {
            showError('emailError', result.error);
        } else {
            alert(result.error || 'Registration failed. Please try again.');
        }
        }
    });
});