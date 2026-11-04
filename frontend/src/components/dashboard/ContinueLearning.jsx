import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Code, ArrowRight, Play, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const ContinueLearning = ({ continueData }) => {
  const navigate = useNavigate();

  // Sensible defaults matching the prompt if no active lesson yet
  const courseTitle = continueData?.courseTitle || 'Full Stack Development';
  const chapter = continueData?.chapter || 'Chapter 04 · React.js';
  const progressPercent = continueData?.progressPercent ?? 75;
  const status = continueData?.status || 'In Progress';
  const courseId = continueData?.courseId;
  const lessonId = continueData?.lessonId;

  const handleResume = () => {
    if (courseId) {
      if (lessonId) {
        navigate(`/learn/${courseId}?lesson=${lessonId}`);
      } else {
        navigate(`/learn/${courseId}`);
      }
    } else {
      navigate('/courses');
    }
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-brand-black brand-title">
          Continue Learning
        </h2>
        <Link
          to="/courses"
          className="text-xs font-semibold text-brand-muted hover:text-brand-black transition flex items-center gap-1"
        >
          View All <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <motion.div
        whileHover={{ y: -3, transition: { duration: 0.25 } }}
        className="relative overflow-hidden rounded-[28px] glass-card p-6 sm:p-8 border border-white/80 shadow-glass"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Course Details with Lavender Glass Icon */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-14 h-14 rounded-2xl glass-lavender border border-white/90 flex items-center justify-center shrink-0 shadow-sm text-indigo-900">
              <Code className="w-7 h-7" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-iceblue text-brand-black border border-white/60">
                  {status}
                </span>
                <span className="text-xs text-brand-muted font-medium">{chapter}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-brand-black brand-title">
                {courseTitle}
              </h3>
            </div>
          </div>

          {/* Progress Indicator & Action Button */}
          <div className="w-full md:w-auto flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6 self-stretch md:self-auto">
            {/* Progress Bar with soft glow */}
            <div className="flex-1 md:w-48 flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs font-semibold text-brand-black">
                <span className="text-brand-muted">Progress</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-black/5 overflow-hidden p-0.5 border border-white/70">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full bg-brand-black shadow-glow-lavender"
                />
              </div>
            </div>

            {/* Black Resume Button */}
            <button
              onClick={handleResume}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-brand-black text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 hover:bg-neutral-800 transition active:scale-95 shadow-md cursor-pointer shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-current text-brand-mint" />
              <span>Resume Learning</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ContinueLearning;

