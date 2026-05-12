'use client';

import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import './Auth.css';

interface PasswordRuleProps {
  label: string;
  valid: boolean;
}

const PasswordRule = ({ label, valid }: PasswordRuleProps) => (
  <li className={`pw-rule ${valid ? 'pw-rule--valid' : ''}`}>
    <i className={`fa-solid ${valid ? 'fa-check' : 'fa-xmark'}`}></i> {label}
  </li>
);

const Auth = () => {
  const { login } = useAppContext();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Password rules
  const rules = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };
  const allRulesPass = Object.values(rules).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate password rules on signup
    if (!isLogin && !allRulesPass) {
      setError('Please ensure your password meets all the requirements below.');
      return;
    }

    setLoading(true);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    const body = isLogin ? { email, password } : { name, email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.ok) {
        if (isLogin) {
          // Login: go directly to dashboard with real user data
          login(data.user);
        } else {
          // Signup: show success popup, then go to login page
          setShowSuccess(true);
          setTimeout(() => {
            setShowSuccess(false);
            setIsLogin(true);
            setPassword('');
            setName('');
          }, 2500);
        }
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setPassword('');
    setName('');
  };

  return (
    <div id="auth-view" className="view active-view animate-fade-in" data-testid="auth-view">

      {/* Success Popup */}
      {showSuccess && (
        <div className="success-overlay">
          <div className="success-popup animate-fade-in">
            <div className="success-icon">
              <i className="fa-solid fa-circle-check"></i>
            </div>
            <h3>Account Created!</h3>
            <p>Welcome to CricBook. Redirecting you to login...</p>
          </div>
        </div>
      )}

      <div className="auth-container glass">
        <div className="auth-logo">
          <i className="fa-solid fa-cricket-bat-ball"></i> CricBook
        </div>
        <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        <p>{isLogin ? 'Login to book your next match.' : 'Join the ultimate cricket community.'}</p>

        {error && <div className="auth-error"><i className="fa-solid fa-triangle-exclamation"></i> {error}</div>}

        <form onSubmit={handleSubmit} data-testid="auth-form">
          {!isLogin && (
            <div className="input-group">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                required
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          )}
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="player@example.com"
              required
              data-testid="email-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              required
              data-testid="password-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
            />
            {/* Password rules — show only on signup when focused or has input */}
            {!isLogin && (password.length > 0 || passwordFocused) && (
              <ul className="pw-rules">
                <PasswordRule label="At least 8 characters" valid={rules.minLength} />
                <PasswordRule label="One uppercase letter (A-Z)" valid={rules.hasUpper} />
                <PasswordRule label="One lowercase letter (a-z)" valid={rules.hasLower} />
                <PasswordRule label="One number (0-9)" valid={rules.hasNumber} />
                <PasswordRule label="One special character (!@#$...)" valid={rules.hasSpecial} />
              </ul>
            )}
          </div>
          <button
            type="submit"
            className={`btn btn-primary w-100 ${loading ? 'btn-loading' : ''}`}
            data-testid="submit-btn"
            disabled={loading}
          >
            {loading ? <><i className="fa-solid fa-spinner fa-spin"></i> Processing...</> : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>
        <div className="auth-toggle">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <span onClick={switchMode} data-testid="auth-toggle-btn">
            {isLogin ? 'Sign up' : 'Login'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Auth;
