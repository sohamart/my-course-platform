import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CourseThumbnail from '../common/CourseThumbnail';

const CourseCard = ({ course }) => {
  const navigate = useNavigate();

  const progressPercent = course.progressPercent || 0;
  const isCompleted = progressPercent === 100;

  const handleOpenCourse = () => {
    navigate(`/courses/${course._id}`);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'Flexible';
    const hours = (seconds / 3600).toFixed(1);
    return `${hours} hrs`;
  };

  return (
    <motion.div
      whileHover={{ y: -5, transition: { duration: 0.25 } }}
      className="rounded-[28px] glass-card overflow-hidden border border-white/80 shadow-glass flex flex-col justify-between transition-all group"
    >
      <div>
        {/* Card Header / Thumbnail Area */}
        <div className="relative h-48 w-full overflow-hidden">
          <CourseThumbnail
            src={course.thumbnailUrl}
            title={course.title}
            category={course.category}
            alt={course.title}
            hideTopBar={true}
            className="w-full h-full group-hover:scale-105 transition-transform duration-500"
          />

          {/* Category Pill */}
          <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full glass-card border border-white/90 text-brand-black shadow-sm z-20">
            {course.category}
          </span>

          {/* Completed Pill - Prominently Highlighted with Strong Contrast on Any Cover */}
          {isCompleted && (
            <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-lg shadow-emerald-500/40 border border-emerald-300/60 ring-2 ring-emerald-400/20 backdrop-blur-md transition-transform group-hover:scale-105">
              <CheckCircle2 className="w-3.5 h-3.5 text-white stroke-[2.8]" />
              <span className="drop-shadow-sm">Completed</span>
            </div>
          )}
        </div>

        {/* Course Info */}
        <div className="p-6">
          <h3 className="text-base sm:text-lg font-bold text-brand-black line-clamp-1 group-hover:text-neutral-900 transition-colors brand-title">
            {course.title}
          </h3>
          <p className="text-xs text-brand-muted mt-1.5 line-clamp-2 leading-relaxed">
            {course.shortDescription}
          </p>

          {/* Meta details */}
          <div className="flex items-center gap-4 mt-4 text-[11px] font-semibold text-brand-muted">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              {course.lessonsCount || 0} Lessons
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatDuration(course.totalDuration)}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-4 pt-3 border-t border-white/60">
            <div className="flex justify-between items-center text-[11px] font-semibold text-brand-black mb-1.5">
              <span className="text-brand-muted">Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-black/5 overflow-hidden p-0.5 border border-white/70">
              <div
                style={{ width: `${progressPercent}%` }}
                className={`h-full rounded-full transition-all duration-500 ${
                  isCompleted ? 'bg-emerald-500' : 'bg-brand-black shadow-glow-lavender'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="px-6 pb-6 pt-2">
        <button
          onClick={handleOpenCourse}
          className="w-full py-2.5 px-4 rounded-xl bg-brand-black text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-neutral-800 transition active:scale-98 shadow-sm cursor-pointer"
        >
          <span>{progressPercent > 0 ? 'Continue Course' : 'Start Course'}</span>
          <ArrowRight className="w-3.5 h-3.5 text-brand-lavender" />
        </button>
      </div>
    </motion.div>
  );
};

export default CourseCard;

