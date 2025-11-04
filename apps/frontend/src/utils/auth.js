const API_BASE_URL = 'https://protocolbanks.com/api/v1';

const authUtils = {
  // Register new user
  async register(username, email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const result = await response.json();

      if (result.status === 'success') {
        // Store token
        localStorage.setItem('authToken', result.token);
        // Store user data
        localStorage.setItem('userData', JSON.stringify(result.data));
        
        return {
          success: true,
          user: result.data,
          token: result.token,
        };
      } else {
        return {
          success: false,
          error: result.message || 'Registration failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Network error',
      };
    }
  },

  // Login existing user (supports email or username)
  async login(emailOrUsername, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username: emailOrUsername,  // Backend accepts both email and username via 'username' field
          password 
        }),
      });

      const result = await response.json();

      if (result.status === 'success') {
        // Store token
        localStorage.setItem('authToken', result.token);
        // Store user data
        localStorage.setItem('userData', JSON.stringify(result.data));
        
        return {
          success: true,
          user: result.data,
          token: result.token,
        };
      } else {
        return {
          success: false,
          error: result.message || 'Login failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Network error',
      };
    }
  },

  // Logout
  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  },

  // Check if user is logged in
  isAuthenticated() {
    return !!localStorage.getItem('authToken');
  },

  // Get current user data
  getCurrentUser() {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  },

  // Get auth token
  getToken() {
    return localStorage.getItem('authToken');
  },
};

export default authUtils;
