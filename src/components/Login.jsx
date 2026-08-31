/**
 * Login.jsx
 * =====================================================
 * Login page with email/password, OAuth, and 1-Click Demo Logins
 * =====================================================
 */

import React, { useState } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  LogIn,
  AlertCircle,
  Loader2,
  Chrome,
  Github,
  Shield,
  Wrench,
  Activity,
  Sparkles,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useGlobalStore } from '../store/useGlobalStore';
import { login as localLogin, getAllUsers } from '../utils/auth';

const DEMO_ACCOUNTS = [
  {
    id: 'admin',
    username: 'admin',
    email: 'admin@mavi.io',
    password: '123',
    name: 'System Admin',
    role: 'ADMINISTRATOR',
    badge: 'Akses Penuh',
    icon: Shield,
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
    borderColor: '#ddd6fe',
    description: 'MES, PLM, Dashboard, Work Orders, Settings',
    targetRoute: '/',
  },
  {
    id: 'engineer',
    username: 'engineer',
    email: 'engineer@mavi.io',
    password: '123',
    name: 'Mfg Engineer',
    role: 'APPLICATION_ENGINEER',
    badge: 'Builder & QC',
    icon: Wrench,
    color: '#3b82f6',
    bgColor: '#eff6ff',
    borderColor: '#bfdbfe',
    description: 'App Builder, Metrology, Automation Flows',
    targetRoute: '/',
  },
  {
    id: 'operator',
    username: 'operator',
    email: 'operator@mavi.io',
    password: '123',
    name: 'Station Operator',
    role: 'STATION_OPERATOR',
    badge: 'Shopfloor Live',
    icon: Activity,
    color: '#f59e0b',
    bgColor: '#fffbeb',
    borderColor: '#fde68a',
    description: 'Live Terminal, Digital Drawing QC Checksheet',
    targetRoute: '/terminal',
  },
];

export default function Login({ onLoginSuccess }) {
  const { login: supabaseLogin, loginWithOAuth, loading: authLoading, error: authError, clearError, isAuthenticated } = useAuth();
  const setUser = useGlobalStore((state) => state.setUser);
  const globalUser = useGlobalStore((state) => state.user);
  const navigate = useNavigate();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(null);
  const [activeDemoId, setActiveDemoId] = useState(null);
  const [activeTab, setActiveTab] = useState('demo'); // 'demo' | 'email'

  // If already authenticated, redirect
  if (isAuthenticated || !!globalUser) {
    return <Navigate to="/" replace />;
  }

  // 1-Click Demo Login Handler
  const handleQuickDemoLogin = (account) => {
    setActiveDemoId(account.id);
    setIsSubmitting(true);
    setFormError('');
    clearError?.();

    setTimeout(() => {
      try {
        // Try local login utility first
        const loggedUser = localLogin(account.username, account.password) || {
          id: `usr-${account.id}`,
          username: account.username,
          name: account.name,
          email: account.email,
          role: account.role,
          assignedStation: account.role === 'STATION_OPERATOR' ? 'STATION-01' : 'ALL',
          assignedApp: 'ALL',
        };

        // Save session locally
        localStorage.setItem('mandor_mes_auth_session', JSON.stringify(loggedUser));
        setUser(loggedUser);

        if (onLoginSuccess) {
          onLoginSuccess(loggedUser);
        } else {
          navigate(account.targetRoute);
        }
      } catch (err) {
        console.error('Failed to log in demo user:', err);
        setFormError('Gagal memuat akun demo. Silakan coba lagi.');
      } finally {
        setIsSubmitting(false);
        setActiveDemoId(null);
      }
    }, 300);
  };

  // Validate form
  const validateForm = () => {
    if (!email) {
      setFormError('Email atau username wajib diisi');
      return false;
    }
    if (!password) {
      setFormError('Password wajib diisi');
      return false;
    }
    setFormError('');
    return true;
  };

  // Handle email/password login with intelligent fallback
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    clearError?.();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // 1. Check if user credentials match local/demo users
      const cleanInput = email.trim().toLowerCase();
      const localUsers = getAllUsers();
      const matchedLocal = localUsers.find(
        (u) =>
          (u.username?.toLowerCase() === cleanInput ||
            u.email?.toLowerCase() === cleanInput ||
            cleanInput.startsWith(u.username?.toLowerCase())) &&
          u.password === password
      );

      if (matchedLocal) {
        const safeUser = localLogin(matchedLocal.username, password);
        if (safeUser) {
          setUser(safeUser);
          if (onLoginSuccess) {
            onLoginSuccess(safeUser);
          } else {
            const isOp = safeUser.role === 'STATION_OPERATOR' || safeUser.role === 'OPERATOR';
            navigate(isOp ? '/terminal' : '/');
          }
          setIsSubmitting(false);
          return;
        }
      }

      // 2. Otherwise try Supabase Auth
      if (cleanInput.includes('@') && supabaseLogin) {
        const result = await supabaseLogin(cleanInput, password);
        if (result?.success) {
          setIsSubmitting(false);
          return;
        }
      }

      // If both fail:
      setFormError('Kredensial tidak valid atau server Supabase offline. Anda dapat menggunakan 1-Click Demo Login di bawah.');
    } catch (err) {
      console.error('[Login] Error:', err);
      // Fallback: try local login
      const cleanInput = email.trim().toLowerCase();
      const safeUser = localLogin(cleanInput, password);
      if (safeUser) {
        setUser(safeUser);
        if (onLoginSuccess) onLoginSuccess(safeUser);
        else navigate('/');
        return;
      }
      setFormError('Login gagal. Silakan gunakan 1-Click Demo Login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle OAuth login
  const handleOAuthLogin = async (provider) => {
    setOauthLoading(provider);
    clearError?.();

    try {
      const result = await loginWithOAuth(provider);
      if (result.success && result.url) {
        window.location.href = result.url;
      }
    } catch (err) {
      setFormError('Koneksi OAuth tidak tersedia.');
    } finally {
      setOauthLoading(null);
    }
  };

  const loading = isSubmitting || authLoading;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a',
        backgroundImage: 'radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.15) 0px, transparent 50%)',
        padding: '24px',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: '#1e293b',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
          padding: '36px 32px',
          color: '#f8fafc',
        }}
      >
        {/* Logo / Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              boxShadow: '0 8px 16px -4px rgba(99, 102, 241, 0.4)',
            }}
          >
            <Sparkles size={28} color="#fff" />
          </div>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: '700',
              color: '#f8fafc',
              margin: '0 0 6px',
              letterSpacing: '-0.02em',
            }}
          >
            MAVICORE MES
          </h1>
          <p
            style={{
              fontSize: '13px',
              color: '#94a3b8',
              margin: 0,
            }}
          >
            Smart Factory & Quality Metrology Platform
          </p>
        </div>

        {/* Tab Selector: 1-Click Demo vs Manual Sign In */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#0f172a',
            borderRadius: '10px',
            padding: '4px',
            marginBottom: '24px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('demo')}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: activeTab === 'demo' ? '600' : '500',
              backgroundColor: activeTab === 'demo' ? '#6366f1' : 'transparent',
              color: activeTab === 'demo' ? '#ffffff' : '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            <UserCheck size={16} />
            1-Click Demo Login
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('email')}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: activeTab === 'email' ? '600' : '500',
              backgroundColor: activeTab === 'email' ? '#6366f1' : 'transparent',
              color: activeTab === 'email' ? '#ffffff' : '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            <Mail size={16} />
            Email / Password
          </button>
        </div>

        {/* Error Notification */}
        {(formError || authError) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 14px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              marginBottom: '20px',
              color: '#fca5a5',
              fontSize: '13px',
              lineHeight: '1.4',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
            <div>{formError || authError}</div>
          </div>
        )}

        {/* TAB 1: 1-Click Demo Profiles */}
        {activeTab === 'demo' && (
          <div>
            <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Pilih Role untuk Masuk Instan
              </span>
              <span style={{ fontSize: '11px', color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '12px' }}>
                ✓ Siap Digunakan
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {DEMO_ACCOUNTS.map((acc) => {
                const Icon = acc.icon;
                const isSelected = activeDemoId === acc.id;

                return (
                  <button
                    key={acc.id}
                    type="button"
                    disabled={loading}
                    onClick={() => handleQuickDemoLogin(acc)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.2)' : '#0f172a',
                      border: `1px solid ${isSelected ? acc.color : 'rgba(255, 255, 255, 0.08)'}`,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.currentTarget.style.borderColor = acc.color;
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loading) {
                        e.currentTarget.style.borderColor = isSelected ? acc.color : 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        backgroundColor: `${acc.color}20`,
                        border: `1px solid ${acc.color}40`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={20} color={acc.color} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <span style={{ fontWeight: '600', fontSize: '14px', color: '#f8fafc' }}>
                          {acc.name}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            padding: '1px 7px',
                            borderRadius: '6px',
                            backgroundColor: `${acc.color}25`,
                            color: acc.color,
                          }}
                        >
                          {acc.badge}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {acc.description}
                      </p>
                    </div>

                    <div style={{ flexShrink: 0 }}>
                      {isSelected ? (
                        <Loader2 size={18} color={acc.color} style={{ animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <span style={{ fontSize: '12px', fontWeight: '600', color: acc.color }}>
                          Masuk →
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: Standard Email / Password Form */}
        {activeTab === 'email' && (
          <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                Email atau Username
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin, engineer, atau email"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '8px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (contoh: 123)"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '10px 38px 10px 38px',
                    borderRadius: '8px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    padding: '4px',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: loading ? '#475569' : '#6366f1',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Sedang masuk...
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  Masuk Sekarang
                </>
              )}
            </button>
          </form>
        )}

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />
          <span style={{ fontSize: '12px', color: '#64748b' }}>atau</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />
        </div>

        {/* OAuth Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => handleOAuthLogin('google')}
            disabled={loading || oauthLoading}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              color: '#f8fafc',
            }}
          >
            <Chrome size={16} />
            Google
          </button>

          <button
            type="button"
            onClick={() => handleOAuthLogin('github')}
            disabled={loading || oauthLoading}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              color: '#f8fafc',
            }}
          >
            <Github size={16} />
            GitHub
          </button>
        </div>

        {/* Sign Up Link */}
        <p style={{ textAlign: 'center', margin: 0, fontSize: '13px', color: '#94a3b8' }}>
          Belum punya akun cloud?{' '}
          <Link to="/register" style={{ color: '#818cf8', fontWeight: '600', textDecoration: 'none' }}>
            Daftar Sign Up
          </Link>
        </p>

        {/* Global animation style */}
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
