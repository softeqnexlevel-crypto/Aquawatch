// frontend/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ==================== ROLE PERMISSIONS ====================
const ROLE_PERMISSIONS = {
  admin: [
    "dashboard", "analytics", "reports", "maintenance",
    "chemical", "borehole", "settings", "user-management"
  ],
  operator: [
    "dashboard", "maintenance", "reports"
  ],
  client: [
    "dashboard", "analytics"
  ],
};

const AuthContext = createContext(null);

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
// NO /api prefix here - it's added in the fetch calls

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Initialize auth on mount
    useEffect(() => {
        const initAuth = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) {
                    setLoading(false);
                    return;
                }

                // ✅ FIXED: Correct API path (no duplicate /api)
                const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setUser(data.user);
                } else if (response.status === 401) {
                    // Try to refresh the token
                    const refreshToken = localStorage.getItem('refreshToken');
                    if (refreshToken) {
                        try {
                            const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ refreshToken })
                            });

                            if (refreshResponse.ok) {
                                const refreshData = await refreshResponse.json();
                                localStorage.setItem('accessToken', refreshData.accessToken);
                                localStorage.setItem('refreshToken', refreshData.refreshToken);
                                
                                // Retry with new token
                                const retryResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
                                    headers: {
                                        'Authorization': `Bearer ${refreshData.accessToken}`
                                    }
                                });
                                
                                if (retryResponse.ok) {
                                    const retryData = await retryResponse.json();
                                    setUser(retryData.user);
                                } else {
                                    // Clear invalid tokens
                                    localStorage.removeItem('accessToken');
                                    localStorage.removeItem('refreshToken');
                                }
                            } else {
                                localStorage.removeItem('accessToken');
                                localStorage.removeItem('refreshToken');
                            }
                        } catch (refreshError) {
                            console.error('Token refresh failed:', refreshError);
                            localStorage.removeItem('accessToken');
                            localStorage.removeItem('refreshToken');
                        }
                    }
                } else {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                }
            } catch (error) {
                console.error('Auth init error:', error);
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = async (email, password) => {
        try {
            setError(null);
            
            // ✅ FIXED: Correct API path
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Login failed');
            }

            const data = await response.json();
            
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            
            setUser(data.user);
            return { success: true, user: data.user };
        } catch (error) {
            setError(error.message);
            return { success: false, error: error.message };
        }
    };

    const logout = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const refreshToken = localStorage.getItem('refreshToken');
            
            if (token) {
                // ✅ FIXED: Correct API path
                await fetch(`${API_BASE_URL}/api/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ refreshToken })
                }).catch(err => console.warn('Logout API call failed:', err));
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setUser(null);
        }
    };

    const canAccess = useCallback((page) => {
        if (!user) return false;
        const permissions = ROLE_PERMISSIONS[user.role] || [];
        return permissions.includes(page);
    }, [user]);

    const hasRole = useCallback((role) => {
        return user?.role === role;
    }, [user]);

    const hasAnyRole = useCallback((roles) => {
        return roles.includes(user?.role);
    }, [user]);

    const isAuthenticated = !!user;

    const value = {
        user,
        loading,
        error,
        login,
        logout,
        canAccess,
        hasRole,
        hasAnyRole,
        isAuthenticated
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        console.warn('useAuth called outside AuthProvider');
        return {
            user: null,
            loading: false,
            error: null,
            login: async () => ({ success: false, error: 'Auth not initialized' }),
            logout: async () => {},
            canAccess: () => false,
            hasRole: () => false,
            hasAnyRole: () => false,
            isAuthenticated: false
        };
    }
    return context;
};

export default AuthProvider;