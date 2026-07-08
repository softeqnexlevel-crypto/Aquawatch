import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const API_BASE = 'http://localhost:4000';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    async function checkAuth() {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/api/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
            } else {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
            }
        } catch (e) {
            console.error('Auth check failed:', e);
        }
        setLoading(false);
    }

    async function login(email, password) {
        try {
            const res = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!res.ok) {
                const err = await res.json();
                return { success: false, error: err.error };
            }

            const data = await res.json();
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            setUser(data.user);
            return { success: true, user: data.user };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async function logout() {
        const token = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (token) {
            fetch(`${API_BASE}/api/auth/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ refreshToken })
            }).catch(() => {});
        }
        
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
    }

    function canAccess(page) {
        if (!user) return false;
        const perms = {
            admin: ["dashboard", "analytics", "reports", "maintenance", "chemical", "borehole", "settings", "user-management"],
            operator: ["dashboard", "maintenance", "reports"],
            client: ["dashboard", "analytics"]
        };
        return (perms[user.role] || []).includes(page);
    }

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            logout,
            canAccess,
            isAuthenticated: !!user,
            hasRole: (role) => user?.role === role,
            hasAnyRole: (roles) => roles.includes(user?.role)
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}

export default AuthProvider;