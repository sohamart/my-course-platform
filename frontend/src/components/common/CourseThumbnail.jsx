import React, { useState } from 'react';
import {
  Code,
  Cloud,
  ShieldCheck,
  Cpu,
  BookOpen,
  Sparkles,
  Layers,
  GraduationCap,
} from 'lucide-react';

/**
 * Select a thematic Lucide icon based on course title & category
 */
const getCourseIcon = (title = '', category = '') => {
  const text = `${title} ${category}`.toLowerCase();
  if (text.includes('cloud') || text.includes('aws') || text.includes('s3') || text.includes('devops')) {
    return Cloud;
  }
  if (text.includes('security') || text.includes('pen-test') || text.includes('hack') || text.includes('cyber')) {
    return ShieldCheck;
  }
  if (text.includes('react') || text.includes('full stack') || text.includes('web') || text.includes('frontend') || text.includes('code')) {
    return Code;
  }
  if (text.includes('ai') || text.includes('machine learning') || text.includes('data') || text.includes('python')) {
    return Cpu;
  }
  return BookOpen;
};

/**
 * Deterministic pastel gradient palette matching the 5-color identity
 */
const getCourseGradient = (title = '') => {
  const gradients = [
    {
      bg: 'from-brand-lavender/80 via-indigo-100/60 to-brand-iceblue/80',
      badgeBg: 'bg-brand-black text-brand-lavender',
      iconBg: 'bg-white/80 text-indigo-900 border-indigo-200/60',
    },
    {
      bg: 'from-brand-mint/80 via-emerald-100/60 to-brand-iceblue/80',
      badgeBg: 'bg-brand-black text-brand-mint',
      iconBg: 'bg-white/80 text-emerald-900 border-emerald-200/60',
    },
    {
      bg: 'from-brand-iceblue/90 via-sky-100/70 to-brand-lavender/70',
      badgeBg: 'bg-brand-black text-sky-200',
      iconBg: 'bg-white/80 text-sky-950 border-sky-200/60',
    },
    {
      bg: 'from-amber-100/80 via-orange-50/60 to-brand-lavender/70',
      badgeBg: 'bg-brand-black text-amber-200',
      iconBg: 'bg-white/80 text-amber-950 border-amber-200/60',
    },
  ];

  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};

/**
 * Clean 2-3 letter monogram for the badge (filtering filler words)
 */
const getCourseInitials = (title = '') => {
  if (!title) return 'MC';
  const cleanTitle = title.replace(/[^a-zA-Z0-9\s]/g, ' ');
  const words = cleanTitle
    .split(/\s+/)
    .filter((w) => !['for', 'and', '&', 'the', 'in', 'of', 'to', 'a', 'an'].includes(w.toLowerCase()));

  if (words.length === 0) return 'MC';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

const CourseThumbnail = ({
  src,
  alt = 'Course thumbnail',
  title = '',
  category = '',
  className = '',
  compact = false,
  hideTopBar = false,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const Icon = getCourseIcon(title, category);
  const initials = getCourseInitials(title);
  const theme = getCourseGradient(title);

  const shouldRenderImage = src && src.trim() !== '' && !hasError;

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${theme.bg} select-none ${className}`}
    >
      {/* 1. Dynamic Branded Graphic Cover (when no S3 thumbnail or on load error) */}
      {!shouldRenderImage ? (
        <div className="w-full h-full p-2.5 sm:p-3 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle water-droplet / specular highlight */}
          <div className="absolute top-1 right-1 w-16 h-16 rounded-full bg-white/40 blur-xl pointer-events-none" />
          <div className="absolute -bottom-2 -left-2 w-16 h-16 rounded-full bg-brand-lavender/50 blur-xl pointer-events-none" />

          {/* Top Row: Category tag & Monogram badge (hidden if container provides its own badges) */}
          {!hideTopBar ? (
            <div className="flex items-center justify-between z-10 w-full gap-1">
              <span className="text-[9px] uppercase font-bold tracking-wider text-brand-muted truncate max-w-[120px]">
                {category || 'Curriculum'}
              </span>
              <div
                className={`px-1.5 py-0.5 rounded-lg ${theme.badgeBg} font-mono font-bold text-[9px] tracking-wider shrink-0 shadow-sm`}
              >
                {initials}
              </div>
            </div>
          ) : (
            <div className="h-6" /> // Clean spacing for external floating badges
          )}

          {/* Center Graphic */}
          <div className="my-auto flex flex-col items-center justify-center text-center z-10">
            <div
              className={`rounded-xl ${theme.iconBg} border flex items-center justify-center shadow-sm ${
                compact ? 'w-8 h-8' : 'w-10 h-10 mb-1'
              }`}
            >
              <Icon className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
            </div>

            {!compact && (
              <p className="text-[11px] font-extrabold text-brand-black line-clamp-1 px-1 brand-title leading-snug">
                {title}
              </p>
            )}
          </div>

          {/* Bottom Certified Bar (for non-compact sizes) */}
          {!compact && (
            <div className="flex items-center justify-between z-10 pt-1 border-t border-white/50 text-[8.5px] font-semibold text-brand-muted uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-indigo-500" /> MyCourse
              </span>
              <span>Certified</span>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* 2. Loading Shimmer Animation while S3 image is downloading */}
          {!isLoaded && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-r from-brand-lavender/40 via-white/70 to-brand-iceblue/40 animate-pulse">
              <div className="w-8 h-8 rounded-xl glass-card flex items-center justify-center text-brand-muted shadow-sm mb-1">
                <Icon className="w-4 h-4 animate-bounce" />
              </div>
              <span className="text-[9px] uppercase font-bold tracking-widest text-brand-muted">
                Loading...
              </span>
            </div>
          )}

          {/* 3. Real S3 Image with Smooth Fade-in */}
          <img
            src={src}
            alt={alt || title}
            loading="lazy"
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            className={`w-full h-full object-cover transition-opacity duration-500 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </>
      )}
    </div>
  );
};

export default CourseThumbnail;
