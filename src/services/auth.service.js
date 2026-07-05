// frontend/src/services/auth.service.js
//
// FIX NOTE: `this.refreshToken = null` in the constructor was an instance
// property with the SAME name as the `refreshToken()` method further down.
// Instance properties shadow prototype methods in JS, so any call to
// `authService.refreshToken()` threw "authService.refreshToken is not a
// function". Renamed the field to `this._refreshToken`.
//
// NOTE: This service currently isn't wired up anywhere — AuthContext.jsx does
// its own fetch calls instead. If you're not planning to use this class-based
// client, consider deleting this file to avoid maintaining two auth clients.
// Fixed here in case you want to switch to it.

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

class AuthService {
    constructor() {
        this.accessToken = null;
        this._refreshToken = null; // renamed from `refreshToken` — was shadowing the method below
        this.user = null;
    }

    /**
     * Initialize auth from localStorage
     */
    init() {
        this.accessToken = localStorage.getItem('accessToken');
        this._refreshToken = localStorage.getItem('refreshToken');

        if (this.accessToken) {
            this.setAuthHeader(this.accessToken);
        }
    }

    /**
     * Set auth header for API calls
     */
    setAuthHeader(token) {
        this.accessToken = token;
        localStorage.setItem('accessToken', token);
    }

    /**
     * Login
     */
    async login(email, password) {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Login failed');
        }

        const data = await response.json();
        this.setAuthHeader(data.accessToken);
        this._refreshToken = data.refreshToken;
        localStorage.setItem('refreshToken', data.refreshToken);
        this.user = data.user;

        return data;
    }

    /**
     * Logout
     */
    async logout() {
        try {
            await this.apiCall('/auth/logout', {
                method: 'POST',
                body: JSON.stringify({ refreshToken: this._refreshToken })
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearTokens();
        }
    }

    /**
     * Refresh token (this can now actually be called — it's no longer
     * shadowed by an instance property of the same name)
     */
    async refreshToken() {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
            throw new Error('No refresh token');
        }

        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
        });

        if (!response.ok) {
            this.clearTokens();
            throw new Error('Token refresh failed');
        }

        const data = await response.json();
        this.setAuthHeader(data.accessToken);
        this._refreshToken = data.refreshToken;
        localStorage.setItem('refreshToken', data.refreshToken);

        return data;
    }

    /**
     * Get current user
     */
    async getCurrentUser() {
        const response = await this.apiCall('/auth/me');
        if (!response.ok) {
            throw new Error('Failed to get user');
        }
        const data = await response.json();
        this.user = data.user;
        return data;
    }

    /**
     * Change password
     */
    async changePassword(currentPassword, newPassword) {
        const response = await this.apiCall('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to change password');
        }

        return response.json();
    }

    /**
     * Get all users (admin only)
     */
    async getAllUsers() {
        const response = await this.apiCall('/auth/users');
        if (!response.ok) {
            throw new Error('Failed to get users');
        }
        return response.json();
    }

    /**
     * Update user (admin only)
     */
    async updateUser(userId, updates) {
        const response = await this.apiCall(`/auth/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update user');
        }

        return response.json();
    }

    /**
     * Delete user (admin only)
     */
    async deleteUser(userId) {
        const response = await this.apiCall(`/auth/users/${userId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete user');
        }

        return response.json();
    }

    /**
     * API call with automatic token refresh
     */
    async apiCall(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.accessToken) {
            headers['Authorization'] = `Bearer ${this.accessToken}`;
        }

        let response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });

        // If token expired, try refresh
        if (response.status === 401) {
            try {
                await this.refreshToken();
                // Retry with new token
                headers['Authorization'] = `Bearer ${this.accessToken}`;
                response = await fetch(`${API_BASE_URL}${endpoint}`, {
                    ...options,
                    headers
                });
            } catch (error) {
                this.clearTokens();
                throw error;
            }
        }

        return response;
    }

    /**
     * Clear tokens
     */
    clearTokens() {
        this.accessToken = null;
        this._refreshToken = null;
        this.user = null;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.accessToken && !!this.user;
    }

    /**
     * Check if user has role
     */
    hasRole(role) {
        return this.user?.role === role;
    }

    /**
     * Check if user has any of the roles
     */
    hasAnyRole(roles) {
        return roles.includes(this.user?.role);
    }
}

export const authService = new AuthService();