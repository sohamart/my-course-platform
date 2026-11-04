import React from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  FileText,
  Lock,
  Layers,
  Sparkles,
  Play,
} from 'lucide-react';
import LiquidBackground from '../../components/effects/LiquidBackground';
import WaterDroplets from '../../components/effects/WaterDroplets';

const LandingPage = () => {
  return (
    <LiquidBackground>
      {/* Navigation */}
      <nav className="sticky top-0 z-40 w-full glass-header px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-brand-black flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5 text-brand-lavender" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-brand-black brand-title">
                MyCourse
              </span>
              <span className="text-[9px] uppercase tracking-widest font-semibold text-brand-muted">
                YOUR PERSONAL LEARNING SPACE
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-brand-black hover:bg-white/60 transition"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-2xl bg-brand-black text-white text-xs font-semibold hover:bg-neutral-800 transition shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-16 pb-20 max-w-6xl mx-auto text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-card border border-white/90 text-xs font-semibold text-brand-black mb-6 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Next-Generation Liquid Glass LMS</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-brand-black tracking-tight brand-title max-w-4xl leading-[1.08]">
          Your Personal <span className="underline decoration-brand-lavender decoration-wavy decoration-2">Learning</span> Space.
        </h1>

        <p className="mt-6 text-sm sm:text-lg text-brand-muted max-w-2xl leading-relaxed">
          A private, invitation-only learning management platform. High-definition video lectures and protected in-browser PDF notes streamed privately via AWS S3 presigned URLs.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
          <Link
            to="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-brand-black text-white text-sm font-semibold flex items-center justify-center gap-2.5 hover:bg-neutral-800 transition shadow-lg active:scale-95"
          >
            <span>Enter Your Learning Space</span>
            <ArrowRight className="w-4 h-4 text-brand-lavender" />
          </Link>
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl glass-card border border-white/90 text-brand-black text-sm font-semibold hover:bg-white/70 transition shadow-sm"
          >
            Register as Student
          </Link>
        </div>

        {/* Floating Hero Preview Card */}
        <div className="relative mt-14 w-full max-w-4xl rounded-[32px] glass-card p-6 sm:p-10 border border-white/90 shadow-glass overflow-hidden text-left">
          <WaterDroplets count={4} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-brand-mint text-brand-black">
                Featured Curriculum
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-brand-black brand-title">
                Full Stack Web Development & Cloud Architecture
              </h3>
              <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
                4 comprehensive modules covering reactive frontend design, secure Node.js APIs, AWS S3 presigned streaming, and zero-trust course enrollment authorization.
              </p>
              <div className="pt-2 flex items-center gap-3 text-xs font-semibold text-brand-black">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/60">
                  <Play className="w-3.5 h-3.5 text-brand-black" /> 4 Video Lessons
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/60">
                  <FileText className="w-3.5 h-3.5 text-brand-black" /> In-App PDF Notes
                </span>
              </div>
            </div>

            <div className="flex flex-col justify-center rounded-2xl glass-lavender p-5 border border-white/90">
              <span className="text-xs font-semibold text-brand-muted">Private Access</span>
              <span className="text-2xl font-black text-brand-black mt-1">100% Secured</span>
              <p className="text-[11px] text-brand-muted mt-2 leading-snug">
                Zero public self-enrollment. Admin grants manual access to authorized students only.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-[11px] font-bold uppercase tracking-widest text-brand-muted">
            ARCHITECTURE & SECURITY
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-black brand-title mt-1">
            Engineered For Absolute Privacy
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-[28px] glass-card p-6 sm:p-7 border border-white/80 shadow-glass">
            <div className="w-12 h-12 rounded-2xl glass-lavender flex items-center justify-center text-indigo-900 mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-brand-black">Private AWS S3 Storage</h3>
            <p className="text-xs text-brand-muted mt-2 leading-relaxed">
              Videos and documents remain private in S3. Short-lived cryptographically signed URLs expire automatically after playback.
            </p>
          </div>

          <div className="rounded-[28px] glass-card p-6 sm:p-7 border border-white/80 shadow-glass">
            <div className="w-12 h-12 rounded-2xl glass-mint flex items-center justify-center text-emerald-900 mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-brand-black">Manual Access Grants</h3>
            <p className="text-xs text-brand-muted mt-2 leading-relaxed">
              Students cannot purchase or self-enroll. Every course request is checked through database enrollment authorization middleware.
            </p>
          </div>

          <div className="rounded-[28px] glass-card p-6 sm:p-7 border border-white/80 shadow-glass">
            <div className="w-12 h-12 rounded-2xl glass-iceblue flex items-center justify-center text-sky-900 mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-brand-black">Protected PDF Reader</h3>
            <p className="text-xs text-brand-muted mt-2 leading-relaxed">
              In-app document viewer with inline zoom, page navigation, and standard download toolbars suppressed.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/60 py-8 px-4 text-center text-xs text-brand-muted">
        <p>© 2026 MyCourse — Your Personal Learning Space. Built with Apple Liquid Glass & AWS S3.</p>
      </footer>
    </LiquidBackground>
  );
};

export default LandingPage;

