import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Sparkles, BookOpen, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WaterDroplets from '../effects/WaterDroplets';

const WelcomeHero = ({ userName = 'Soham' }) => {
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      subtitle: 'WELCOME BACK',
      title: `Hello, ${userName}! 👋`,
      description: "Let's make today productive.",
      cta: 'Explore Courses',
      action: () => navigate('/courses'),
    },
    {
      subtitle: 'LEARNING GOALS',
      title: 'Keep Up The Momentum 🚀',
      description: 'Your next lesson in React.js is ready for you.',
      cta: 'Resume Lesson',
      action: () => navigate('/courses'),
    },
    {
      subtitle: 'PRIVATE ARCHITECTURE',
      title: 'Secure Cloud Streaming 🔒',
      description: 'Direct S3 presigned asset streaming with private access.',
      cta: 'View Progress',
      action: () => navigate('/progress'),
    },
  ];

  const current = slides[activeSlide];

  return (
    <div className="relative overflow-hidden rounded-[30px] glass-card p-7 sm:p-10 border border-white/80 shadow-glass">
      {/* Background soft reflections & liquid waves */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Soft Lavender Glow */}
        <div className="absolute -top-12 -left-12 w-64 h-64 rounded-full bg-brand-lavender/60 blur-3xl" />
        {/* Soft Ice Blue Glow */}
        <div className="absolute -bottom-12 -right-12 w-64 h-64 rounded-full bg-brand-iceblue/60 blur-3xl" />
        {/* Subtle Water Droplets on hero */}
        <WaterDroplets count={4} />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="max-w-xl">
          <motion.div
            key={current.subtitle}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-2"
          >
            <span className="text-[11px] font-bold tracking-widest text-brand-muted uppercase">
              {current.subtitle}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-brand-black" />
            <span className="text-[11px] font-medium text-brand-muted flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" /> MyCourse PLMS
            </span>
          </motion.div>

          <motion.h1
            key={current.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-2xl sm:text-4xl font-extrabold text-brand-black tracking-tight brand-title"
          >
            {current.title}
          </motion.h1>

          <motion.p
            key={current.description}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="text-sm sm:text-base text-brand-muted mt-2 font-normal leading-relaxed"
          >
            {current.description}
          </motion.p>

          {/* CTA Button */}
          <div className="mt-6 flex items-center gap-4">
            <button
              onClick={current.action}
              className="px-6 py-3 rounded-2xl bg-brand-black text-white text-xs sm:text-sm font-semibold flex items-center gap-2.5 shadow-md hover:bg-neutral-800 transition active:scale-95 cursor-pointer"
            >
              <span>{current.cta}</span>
              <ArrowUpRight className="w-4 h-4 text-brand-lavender" />
            </button>
          </div>
        </div>

        {/* Carousel Indicators */}
        <div className="flex md:flex-col items-center gap-2 self-center md:self-auto">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              className={`transition-all rounded-full ${
                activeSlide === idx
                  ? 'w-7 md:w-2 h-2 md:h-7 bg-brand-black'
                  : 'w-2 h-2 bg-brand-black/20 hover:bg-brand-black/40'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default WelcomeHero;

