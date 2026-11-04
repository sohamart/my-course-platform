import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  Zap,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import LiquidBackground from '../../components/effects/LiquidBackground';
import TeacherContactModal from '../../components/common/TeacherContactModal';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Post-registration welcome popup state
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [registeredStudent, setRegisteredStudent] = useState(null);

  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    setLoading(true);

    try {
      const createdUser = await register(name, email, password);
      showToast(`Welcome to MyCourse, ${createdUser.name}! Your account is ready.`, 'success');
      
      // Store registered details and display the post-registration contact modal
      setRegisteredStudent({
        name: createdUser.name || name,
        email: createdUser.email || email,
      });
      setShowWelcomeModal(true);
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleModalProceed = () => {
    setShowWelcomeModal(false);
    navigate('/dashboard');
  };

  return (
    <LiquidBackground fixedLayout>
      <div className="h-screen w-screen max-h-screen overflow-hidden flex items-center justify-center p-3 sm:p-6 lg:p-8">
        {/* Split Card: Left Hero / Right Form */}
        <div className="w-full max-w-4xl h-[92vh] max-h-[600px] rounded-[32px] glass-card border border-white/80 shadow-2xl flex flex-col md:flex-row overflow-hidden relative">
          
          {/* Left Side: Visual Branding & Trust Panel */}
          <div className="hidden md:flex md:w-[44%] bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 p-8 text-white flex-col justify-between relative overflow-hidden shrink-0">
            {/* Glowing liquid backdrop orbs */}
            <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full bg-brand-lavender/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-56 h-56 rounded-full bg-brand-mint/20 blur-3xl pointer-events-none" />

            {/* Top Logo */}
            <div className="relative z-10">
              <Link to="/" className="inline-flex items-center gap-2.5 group">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-sm group-hover:scale-105 transition-transform">
                  <GraduationCap className="w-6 h-6 text-brand-lavender" />
                </div>
                <div>
                  <span className="text-xl font-extrabold tracking-tight text-white brand-title block">
                    MyCourse
                  </span>
                  <span className="text-[9px] uppercase tracking-widest font-semibold text-neutral-400 block">
                    PERSONAL LEARNING SPACE
                  </span>
                </div>
              </Link>
            </div>

            {/* Middle Feature Highlights */}
            <div className="relative z-10 space-y-4 my-auto">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-brand-mint text-[11px] font-bold">
                <Sparkles className="w-3.5 h-3.5 text-brand-mint" />
                <span>Private Mentor Portal</span>
              </div>

              <h2 className="text-2xl font-extrabold text-white leading-tight">
                Master Skills with Dedicated Guidance.
              </h2>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Enjoy zero-lag S3 streaming, dynamic security watermarking, and curriculum curated directly for you.
              </p>

              {/* Feature Badges */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2.5 text-xs text-neutral-200">
                  <div className="p-1 rounded-lg bg-emerald-500/20 text-brand-mint">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <span>Ultra-Fast S3 HD Video Playback</span>
                </div>

                <div className="flex items-center gap-2.5 text-xs text-neutral-200">
                  <div className="p-1 rounded-lg bg-indigo-500/20 text-brand-lavender">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <span>Dynamic DRM Security Watermarking</span>
                </div>

                <div className="flex items-center gap-2.5 text-xs text-neutral-200">
                  <div className="p-1 rounded-lg bg-cyan-500/20 text-cyan-300">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <span>Direct Teacher Course Assignment</span>
                </div>
              </div>
            </div>

            {/* Bottom Footer Note */}
            <div className="relative z-10 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-neutral-400">
              <span>Student Registration</span>
              <span className="text-brand-mint font-semibold">100% Private</span>
            </div>
          </div>

          {/* Right Side: Compact Registration Form */}
          <div className="w-full md:w-[56%] p-6 sm:p-8 flex flex-col justify-center bg-white/60 backdrop-blur-md overflow-hidden">
            <div className="max-w-md w-full mx-auto space-y-4">
              
              {/* Form Header */}
              <div>
                <div className="md:hidden flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-black flex items-center justify-center text-white">
                    <GraduationCap className="w-4 h-4 text-brand-lavender" />
                  </div>
                  <span className="text-base font-bold text-brand-black brand-title">MyCourse</span>
                </div>

                <h1 className="text-xl sm:text-2xl font-extrabold text-brand-black brand-title">
                  Create Student Account
                </h1>
                <p className="text-xs text-brand-muted mt-0.5">
                  Sign up to access your instructor's private learning curriculum.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-brand-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="e.g. Soham Roy"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/80 border border-neutral-200 text-xs sm:text-sm text-brand-black focus:outline-none focus:bg-white focus:border-brand-black focus:ring-2 focus:ring-brand-black/10 transition shadow-2xs"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-brand-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="student@example.com"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/80 border border-neutral-200 text-xs sm:text-sm text-brand-black focus:outline-none focus:bg-white focus:border-brand-black focus:ring-2 focus:ring-brand-black/10 transition shadow-2xs"
                    />
                  </div>
                </div>

                {/* Password & Confirm Password side by side to save height */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-brand-muted absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Min. 6 chars"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/80 border border-neutral-200 text-xs sm:text-sm text-brand-black focus:outline-none focus:bg-white focus:border-brand-black focus:ring-2 focus:ring-brand-black/10 transition shadow-2xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-800 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-brand-muted absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="Repeat password"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/80 border border-neutral-200 text-xs sm:text-sm text-brand-black focus:outline-none focus:bg-white focus:border-brand-black focus:ring-2 focus:ring-brand-black/10 transition shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Enrollment Notice */}
                <div className="p-2.5 rounded-xl bg-brand-iceblue/40 border border-brand-iceblue/60 text-[11px] text-brand-muted leading-tight">
                  <span className="font-bold text-brand-black">Important:</span> Courses are individually unlocked by your teacher. After registration, contact your instructor to activate your syllabus.
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-brand-black text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 hover:bg-neutral-800 transition active:scale-98 shadow-md cursor-pointer disabled:opacity-50 mt-1"
                >
                  <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
                  <ArrowRight className="w-4 h-4 text-brand-lavender" />
                </button>
              </form>

              {/* Footer Switch */}
              <div className="text-center pt-1">
                <p className="text-xs text-brand-muted">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="font-bold text-brand-black hover:underline transition"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Post-Registration Welcome & Contact Teacher Modal */}
      <TeacherContactModal
        isOpen={showWelcomeModal}
        onClose={handleModalProceed}
        onProceed={handleModalProceed}
        studentName={registeredStudent?.name}
        studentEmail={registeredStudent?.email}
        title={`Welcome, ${registeredStudent?.name || 'Student'}! 🎉`}
        subtitle="Your account is active with 0 enrolled courses"
        proceedLabel="Go to Student Dashboard"
      />
    </LiquidBackground>
  );
};

export default Register;
