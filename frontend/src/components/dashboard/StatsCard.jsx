import React from 'react';
import { motion } from 'framer-motion';

const StatsCard = ({ icon: Icon, value, label, variant = 'lavender', loading = false }) => {
  const formattedValue = typeof value === 'number' && value < 10 ? `0${value}` : `${value}`;

  const variantClass = variant === 'mint' ? 'glass-mint' : 'glass-lavender';
  const iconBg = variant === 'mint' ? 'bg-emerald-600/10 text-emerald-800' : 'bg-indigo-600/10 text-indigo-900';

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.25 } }}
      className={`relative overflow-hidden rounded-[26px] p-6 glass-card ${variantClass} border border-white/80 shadow-glass flex items-center justify-between transition-all`}
    >
      {/* Soft Specular Corner Highlight */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/40 rounded-bl-full pointer-events-none blur-xl" />

      <div className="relative z-10 flex flex-col">
        {loading ? (
          <div className="h-9 w-20 bg-neutral-200/70 rounded-xl animate-pulse" />
        ) : (
          <span className="text-3xl sm:text-4xl font-extrabold text-brand-black tracking-tight brand-title">
            {formattedValue}
          </span>
        )}
        <span className="text-xs sm:text-sm font-semibold text-brand-muted mt-1">
          {label}
        </span>
      </div>

      <div className={`w-13 h-13 rounded-2xl ${iconBg} flex items-center justify-center p-3.5 shadow-sm border border-white/60`}>
        <Icon className="w-6 h-6" />
      </div>
    </motion.div>
  );
};

export default StatsCard;

