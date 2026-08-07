import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import api from '../api/axios';
import { parseApiError } from '../api/errorUtils';
import PageTransition from '../components/PageTransition';

const Signup = () => {
  const [role, setRole] = useState('customer');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('M');
  const [birthDate, setBirthDate] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.post('accounts/google-login/', {
        credential: credentialResponse.credential,
        role: role
      });
      localStorage.setItem('access', res.data.access);
      localStorage.setItem('refresh', res.data.refresh);
      localStorage.setItem('active_role', role);
      navigate(role === 'provider' ? '/provider' : '/customer');
    } catch (err) {
      let errorMsg = 'Google sign-in failed. Please try again.';
      if (err.response && err.response.data) {
        if (typeof err.response.data === 'string') {
          errorMsg = `Server error (${err.response.status}): ${err.response.data.slice(0, 100)}...`;
        } else if (err.response.data.detail) {
          errorMsg = err.response.data.detail;
        } else if (err.response.data.error) {
          errorMsg = err.response.data.error;
        }
      } else if (err.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };



  const handleGoogleError = () => {
    setError('Google Authentication failed. Please try again.');
  };


  const calculateAge = (birthDateStr) => {
    const today = new Date();
    const dob = new Date(birthDateStr);
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    return age;
  };

  const [showVerifyStep, setShowVerifyStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verifyMessage, setVerifyMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setVerifyMessage('');
    setShowVerifyStep(false);

    if (role === 'provider' && birthDate) {
      if (calculateAge(birthDate) < 18) {
        setError('Service Professionals must be at least 18 years old.');
        return;
      }
    }

    setIsLoading(true);
    try {
      await api.post('accounts/register/', { 
        role,
        username, 
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        gender,
        birth_date: birthDate
      });
      setShowVerifyStep(true);
      setVerifyMessage(`A 6-digit verification code was sent to ${email} (valid for 2 minutes).`);
    } catch (err) {
      setVerifyMessage('');
      setShowVerifyStep(false);
      setError(parseApiError(err, 'Registration failed. Please check your details and try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setError('');
    setIsVerifying(true);
    try {
      await api.post('accounts/verify-email/', { username, code: otpCode });
      setVerifyMessage('Email verified! Logging you in...');

      // Auto-login the user with their credentials
      const loginRes = await api.post('accounts/token/', { username, password });
      localStorage.setItem('access', loginRes.data.access);
      localStorage.setItem('refresh', loginRes.data.refresh);
      localStorage.setItem('active_role', role);

      setTimeout(() => {
        navigate(role === 'provider' ? '/provider' : '/customer');
      }, 1000);
    } catch (err) {
      setError(parseApiError(err, 'Invalid verification code. Please try again.'));
    } finally {
      setIsVerifying(false);
    }
  };


  const handleResendCode = async () => {
    setError('');
    try {
      await api.post('accounts/resend-verification/', { username });
      setVerifyMessage('A new 6-digit code has been sent to your email.');
    } catch (err) {
      setError(parseApiError(err, 'Failed to resend verification code.'));
    }
  };

  return (
    <PageTransition>
      <div className="relative min-h-screen w-screen flex items-center justify-center overflow-hidden p-4 md:p-8 font-sans"
        style={{ background: 'linear-gradient(135deg, #0B0F19 0%, #0F1523 50%, #0B0F19 100%)' }}>

      {/* Animated Background Orbs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[55vw] h-[55vw] rounded-full blur-[130px] opacity-30"
          style={{ background: 'radial-gradient(circle, #4F46E5, transparent)' }} />
        <div className="absolute bottom-[-15%] right-[-15%] w-[60vw] h-[60vw] rounded-full blur-[140px] opacity-20"
          style={{ background: 'radial-gradient(circle, #7C3AED, transparent)' }} />
        <div className="absolute top-[30%] right-[20%] w-[30vw] h-[30vw] rounded-full blur-[110px] opacity-15"
          style={{ background: 'radial-gradient(circle, #6366F1, transparent)' }} />
        {/* Subtle grid overlay */}
        <div className="absolute inset-0"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      {/* Main Authentication Container */}
      <div className="relative z-10 w-full max-w-[580px] flex flex-col gap-6 my-8"
        style={{
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '28px',
          padding: '36px 32px',
          boxShadow: '0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.15), inset 0 1px 0 rgba(255,255,255,0.08)'
        }}>
        {/* Top accent line */}
        <div className="absolute top-0 left-8 right-8 h-[1px] rounded-full"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.8), rgba(139,92,246,0.6), transparent)' }} />

        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg mb-1"
            style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', boxShadow: '0 8px 24px rgba(79,70,229,0.4)' }}>
            <span className="material-symbols-outlined text-3xl">person_add</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: '#F1F5F9', fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }}>ServiceHub</h1>
          <p className="text-xs font-medium" style={{ color: '#64748B' }}>
            {showVerifyStep ? 'Verify Email Address' : 'Create your account to get started'}
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl text-center text-xs font-semibold animate-[fadeIn_0.2s_ease-out]"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#F87171', border: '1px solid rgba(239,68,68,0.25)' }}>
            ⚠️ {error}
          </div>
        )}

        {showVerifyStep ? (
          <form onSubmit={handleVerifyEmail} className="flex flex-col gap-6">
            {verifyMessage && (
              <div className="p-3.5 rounded-2xl text-center text-xs font-semibold animate-[fadeIn_0.2s_ease-out]"
                style={{ background: 'rgba(16,185,129,0.1)', color: '#34D399', border: '1px solid rgba(16,185,129,0.25)' }}>
                ✅ {verifyMessage}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <label htmlFor="otpCode" className="text-xs font-bold text-center uppercase tracking-wider" style={{ color: '#94A3B8' }}>
                Enter 6-Digit Verification Code
              </label>
              <input
                type="text"
                id="otpCode"
                maxLength="6"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                required
                placeholder="123456"
                className="w-full rounded-2xl border py-4 text-center font-mono text-2xl tracking-[0.5em] font-extrabold placeholder:text-slate-600 focus:outline-none transition-all shadow-inner"
                style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.12)', color: '#F1F5F9' }}
              />
            </div>

            <button
              type="submit"
              disabled={isVerifying || otpCode.length !== 6}
              className="w-full rounded-2xl py-3.5 px-6 font-extrabold text-sm text-white shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}
            >
              {isVerifying ? 'Verifying...' : 'VERIFY EMAIL'}
            </button>

            <div className="flex justify-between items-center text-xs pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', color: '#64748B' }}>
              <button
                type="button"
                onClick={handleResendCode}
                className="font-bold hover:underline cursor-pointer"
                style={{ color: '#818CF8' }}
              >
                Resend Code
              </button>
              <button
                type="button"
                onClick={() => setShowVerifyStep(false)}
                className="hover:underline cursor-pointer font-medium transition-colors"
                style={{ color: '#475569' }}
              >
                Back to Registration
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="flex flex-col gap-5">
            {/* Role Selector Toggle */}
            <div className="flex gap-2 p-1.5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <button 
                type="button" 
                className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  role === 'customer' 
                    ? 'text-white shadow-md' 
                    : 'hover:text-white/80'
                }`}
                style={role === 'customer' ? { background: 'linear-gradient(135deg,rgba(99,102,241,0.85),rgba(139,92,246,0.6))' } : { color: '#64748B' }}
                onClick={() => { setRole('customer'); setError(''); }}
              >
                <span className="material-symbols-outlined text-base">person</span>
                <span>Customer</span>
              </button>
              <button 
                type="button" 
                className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  role === 'provider' 
                    ? 'text-white shadow-md' 
                    : 'hover:text-white/80'
                }`}
                style={role === 'provider' ? { background: 'linear-gradient(135deg,rgba(99,102,241,0.85),rgba(139,92,246,0.6))' } : { color: '#64748B' }}
                onClick={() => { setRole('provider'); setError(''); }}
              >
                <span className="material-symbols-outlined text-base">work</span>
                <span>Service Professional</span>
              </button>
            </div>

            {/* Form Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider pl-1" style={{ color: '#94A3B8' }}>First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  placeholder="John"
                  className="w-full rounded-2xl border py-3 px-4 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.12)', color: '#F1F5F9' }}
                />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider pl-1" style={{ color: '#94A3B8' }}>Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  placeholder="Doe"
                  className="w-full rounded-2xl border py-3 px-4 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.12)', color: '#F1F5F9' }}
                />
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider pl-1" style={{ color: '#94A3B8' }}>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Choose a unique username"
                  className="w-full rounded-2xl border py-3 px-4 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.12)', color: '#F1F5F9' }}
                />
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider pl-1" style={{ color: '#94A3B8' }}>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border py-3 px-4 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.12)', color: '#F1F5F9' }}
                />
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider pl-1" style={{ color: '#94A3B8' }}>Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Choose a strong password"
                    className="w-full rounded-2xl border py-3 pl-4 pr-11 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.12)', color: '#F1F5F9' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
                    style={{ color: '#475569' }}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider pl-1" style={{ color: '#94A3B8' }}>Phone Number</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  placeholder="+91 98765 43210"
                  className="w-full rounded-2xl border py-3 px-4 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.12)', color: '#F1F5F9' }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider pl-1" style={{ color: '#94A3B8' }}>Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  required
                  className="w-full rounded-2xl border py-3 px-4 text-sm focus:outline-none focus:ring-2 transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.12)', color: '#F1F5F9', colorScheme: 'dark' }}
                >
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider pl-1" style={{ color: '#94A3B8' }}>Birth Date</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  required
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full rounded-2xl border py-3 px-4 text-sm focus:outline-none focus:ring-2 transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.12)', color: '#F1F5F9', colorScheme: 'dark' }}
                />
              </div>
            </div>

            {/* CTA Action */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 rounded-2xl py-3.5 px-6 font-extrabold text-sm text-white shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', boxShadow: '0 4px 20px rgba(79,70,229,0.4)' }}
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                  Creating Account...
                </>
              ) : (
                <>
                  <span>CREATE ACCOUNT</span>
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </>
              )}
            </button>

            <div className="relative my-1 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
              </div>
              <span className="relative px-3 text-[11px] font-bold uppercase tracking-wider" style={{ background: 'rgba(15,23,42,0.75)', color: '#475569' }}>
                OR
              </span>
            </div>

            <div className="flex justify-center w-full min-h-[44px]">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                shape="pill"
                theme="filled_black"
                size="large"
                width="376"
                text="signup_with"
              />
            </div>
          </form>

        )}

        {/* Footer Links */}
        <div className="text-center pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-xs" style={{ color: '#64748B' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-extrabold hover:underline" style={{ color: '#818CF8' }}>
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  </PageTransition>
);
};

export default Signup;
