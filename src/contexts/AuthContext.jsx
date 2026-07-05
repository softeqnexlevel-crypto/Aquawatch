import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

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

const fallbackAuth = {
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

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                if (token) {
                    // ✅ FIXED: Removed duplicate /api
                    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        setUser(data.user);
                    } else {
                        localStorage.removeItem('accessToken');
                        localStorage.removeItem('refreshToken');
                    }
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
            
            // ✅ FIXED: Removed duplicate /api
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
            
            // ✅ FIXED: Removed duplicate /api
            await fetch(`${API_BASE_URL}/api/auth/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ refreshToken })
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setUser(null);
        }
    };

    const canAccess = (page) => {
        if (!user) return false;
        const permissions = ROLE_PERMISSIONS[user.role] || [];
        return permissions.includes(page);
    };

    const hasRole = (role) => {
        return user?.role === role;
    };

    const hasAnyRole = (roles) => {
        return roles.includes(user?.role);
    };

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
        console.warn('useAuth called outside AuthProvider - using fallback');
        return fallbackAuth;
    }
    return context;
};

export default AuthProvider;