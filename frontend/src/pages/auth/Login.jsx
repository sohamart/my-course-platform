import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Lock, Mail, ArrowRight, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import LiquidBackground from '../../components/effects/LiquidBackground';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login(email, password);
      showToast(`Welcome back, ${user.name}!`, 'success');
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fillAdminCreds = () => {
    setEmail('admin@mycourse.local');
    setPassword('AdminSecurePassword123!');
  };

  const fillStudentCreds = () => {
    setEmail('soham@mycourse.local');
    setPassword('Password123!');
  };

  return (
    <LiquidBackground>
      <div className="flex-1 flex flex-col justify-center items-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo & Subtitle */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-2xl bg-brand-black flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
                <GraduationCap className="w-7 h-7 text-brand-lavender" />
              </div>
              <div className="text-left">
                <span className="text-2xl font-bold tracking-tight text-brand-black brand-title block">
                  MyCourse
                </span>
                <span className="text-[10px] uppercase tracking-widest font-semibold text-brand-muted block">
                  YOUR PERSONAL LEARNING SPACE
                </span>
              </div>
            </Link>
            <h2 className="text-xl font-bold text-brand-black brand-title mt-6">
              Sign In to Your Space
            </h2>
            <p className="text-xs text-brand-muted mt-1">
              Enter your authorized credentials to access your courses.
            </p>
          </div>

          {/* Glass Login Card */}
          <div className="rounded-[30px] glass-card p-7 sm:p-8 border border-white/80 shadow-glass">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-black mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-brand-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl glass-card border border-white/80 text-xs sm:text-sm text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-black/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-black mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-brand-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl glass-card border border-white/80 text-xs sm:text-sm text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-black/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-2xl bg-brand-black text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 hover:bg-neutral-800 transition active:scale-98 shadow-md cursor-pointer disabled:opacity-50 mt-2"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4 text-brand-lavender" />
              </button>
            </form>

            {/* Quick Dev Demo Fill Buttons */}
            <div className="mt-6 pt-5 border-t border-white/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted block mb-2 text-center">
                Quick Demo Access
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={fillStudentCreds}
                  className="px-3 py-2 rounded-xl glass-card border border-white/80 text-[11px] font-semibold text-brand-black hover:bg-white/70 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  Student Demo
                </button>
                <button
                  type="button"
                  onClick={fillAdminCreds}
                  className="px-3 py-2 rounded-xl glass-card border border-white/80 text-[11px] font-semibold text-brand-black hover:bg-white/70 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Admin Demo
                </button>
              </div>
            </div>

            {/* Registration Link */}
            <div className="mt-6 text-center">
              <p className="text-xs text-brand-muted">
                New student?{' '}
                <Link
                  to="/register"
                  className="font-bold text-brand-black hover:underline transition"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </LiquidBackground>
  );
};

export default Login;

