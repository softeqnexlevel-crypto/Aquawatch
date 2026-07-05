// frontend/src/components/Login.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

// ==================== MAIN LOGIN COMPONENT ====================
export const Login = ({ onLoginSuccess, onClose, isModal = false }) => {
    const { login, error, loading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await login(email, password);
        if (result.success && onLoginSuccess) {
            onLoginSuccess(result.user);
        }
    };

    return (
        <div style={isModal ? modalStyles.overlay : pageStyles.container}>
            <div style={isModal ? modalStyles.modal : pageStyles.card}>
                {isModal && (
                    <button 
                        onClick={onClose}
                        style={modalStyles.closeButton}
                    >
                        ×
                    </button>
                )}
                
                <div style={pageStyles.header}>
                    <h1 style={pageStyles.title}>Water Management</h1>
                    <p style={pageStyles.subtitle}>Sign in to your account</p>
                </div>

                {error && (
                    <div style={pageStyles.error}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={pageStyles.field}>
                        <label style={pageStyles.label}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@aquaops.co.ke"
                            style={pageStyles.input}
                            required
                        />
                    </div>

                    <div style={pageStyles.field}>
                        <label style={pageStyles.label}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            style={pageStyles.input}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={pageStyles.button}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div style={pageStyles.footer}>
                    <div style={pageStyles.demoAccounts}>
                        <strong>Demo Accounts:</strong>
                        <div style={pageStyles.demoList}>
                            admin@aquaops.co.ke / admin123 (Admin)<br />
                            operator@aquaops.co.ke / operator123 (Operator)<br />
                            client@aquaops.co.ke / client123 (Client)
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ==================== LOGIN MODAL ====================
export const LoginModal = ({ open, onClose, onSuccess }) => {
    if (!open) return null;
    
    return (
        <Login 
            isModal={true} 
            onClose={onClose} 
            onLoginSuccess={onSuccess} 
        />
    );
};

// ==================== STYLES ====================
const pageStyles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#0f172a',
        padding: '20px'
    },
    card: {
        background: 'var(--card)',
        padding: '40px',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        width: '400px',
        maxWidth: '100%',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
    },
    header: {
        marginBottom: '24px'
    },
    title: {
        fontSize: '24px',
        fontWeight: 700,
        color: 'var(--foreground)',
        marginBottom: '8px'
    },
    subtitle: {
        color: 'var(--muted-foreground)',
        fontSize: '14px'
    },
    error: {
        background: 'rgba(239,68,68,0.1)',
        border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: '6px',
        padding: '10px 14px',
        color: '#ef4444',
        marginBottom: '16px',
        fontSize: '13px'
    },
    field: {
        marginBottom: '16px'
    },
    label: {
        display: 'block',
        fontSize: '11px',
        fontWeight: 600,
        color: 'var(--muted-foreground)',
        marginBottom: '6px',
        textTransform: 'uppercase',
        letterSpacing: '0.08em'
    },
    input: {
        width: '100%',
        padding: '10px 14px',
        background: 'var(--secondary)',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        color: 'var(--foreground)',
        fontSize: '14px',
        outline: 'none',
        transition: 'border-color 0.2s',
        boxSizing: 'border-box'
    },
    button: {
        width: '100%',
        padding: '12px',
        background: '#0ea5e9',
        color: '#020810',
        border: 'none',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
        opacity: 1,
        transition: 'opacity 0.2s, transform 0.1s',
        marginTop: '8px'
    },
    footer: {
        marginTop: '20px',
        borderTop: '1px solid var(--border)',
        paddingTop: '16px'
    },
    demoAccounts: {
        fontSize: '12px',
        color: 'var(--muted-foreground)',
        textAlign: 'center'
    },
    demoList: {
        fontSize: '11px',
        lineHeight: '1.6',
        marginTop: '4px'
    }
};

const modalStyles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
        padding: '20px'
    },
    modal: {
        background: 'var(--card)',
        padding: '40px',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        width: '400px',
        maxWidth: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        animation: 'slideUp 0.3s ease'
    },
    closeButton: {
        position: 'absolute',
        top: '12px',
        right: '16px',
        background: 'none',
        border: 'none',
        fontSize: '24px',
        color: 'var(--muted-foreground)',
        cursor: 'pointer',
        padding: '4px 8px',
        borderRadius: '4px',
        transition: 'background 0.2s'
    }
};

export default Login;