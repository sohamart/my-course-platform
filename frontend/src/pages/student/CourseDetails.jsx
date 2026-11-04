import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Clock,
  Play,
  CheckCircle2,
  FileText,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  ShieldAlert,
} from 'lucide-react';
import api from '../../services/api';
import LiquidBackground from '../../components/effects/LiquidBackground';
import Header from '../../components/layout/Header';
import BottomNavigation from '../../components/layout/BottomNavigation';
import CourseThumbnail from '../../components/common/CourseThumbnail';

const CourseDetails = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedChapters, setExpandedChapters] = useState({});

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await api.get(`/student/courses/${courseId}`);
        if (res.data && res.data.success) {
          const data = res.data.course;
          setCourse(data);

          // Expand all chapters by default
          const exp = {};
          (data.chapters || []).forEach((c, idx) => {
            exp[idx] = true;
          });
          setExpandedChapters(exp);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Access denied or course not found.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  const toggleChapter = (index) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleStartLearning = () => {
    navigate(`/learn/${courseId}`);
  };

  if (loading) {
    return (
      <LiquidBackground>
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-12 animate-pulse">
          <div className="h-64 rounded-[30px] glass-card mb-6" />
          <div className="h-96 rounded-[30px] glass-card" />
        </div>
      </LiquidBackground>
    );
  }

  if (error || !course) {
    return (
      <LiquidBackground>
        <Header />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="p-8 rounded-[30px] glass-card border border-rose-200 shadow-glass">
            <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-brand-black">Course Access Restricted</h2>
            <p className="text-xs text-brand-muted mt-2 leading-relaxed">
              {error || 'You do not have authorization to view this course. Please contact the administrator to request access.'}
            </p>
            <Link
              to="/courses"
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-black text-white text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" /> Back to My Courses
            </Link>
          </div>
        </div>
      </LiquidBackground>
    );
  }

  return (
    <LiquidBackground>
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28">
        {/* Back Link */}
        <Link
          to="/courses"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-muted hover:text-brand-black transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Courses
        </Link>

        {/* Hero Course Overview Card */}
        <div className="rounded-[30px] glass-card p-6 sm:p-10 border border-white/80 shadow-glass mb-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Thumbnail */}
            <div className="w-full md:w-80 h-52 rounded-2xl overflow-hidden shrink-0 border border-white/80 shadow-sm">
              <CourseThumbnail
                src={course.thumbnailUrl}
                title={course.title}
                category={course.category}
                alt={course.title}
                className="w-full h-full"
              />
            </div>

            {/* Details */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full glass-card border border-white/80 text-brand-black">
                  {course.category}
                </span>
                <span className="text-xs text-brand-muted font-semibold flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" /> {course.lessonsCount} Lessons
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-black brand-title">
                {course.title}
              </h1>

              <p className="text-xs sm:text-sm text-brand-muted mt-2.5 leading-relaxed">
                {course.detailedDescription || course.shortDescription}
              </p>

              {/* Progress Summary */}
              <div className="mt-6 pt-4 border-t border-white/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 max-w-xs">
                  <div className="flex justify-between text-xs font-semibold text-brand-black mb-1.5">
                    <span className="text-brand-muted">Your Completion</span>
                    <span>{course.progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-black/5 overflow-hidden p-0.5 border border-white/70">
                    <div
                      style={{ width: `${course.progressPercent}%` }}
                      className="h-full rounded-full bg-brand-black shadow-glow-lavender transition-all"
                    />
                  </div>
                </div>

                <button
                  onClick={handleStartLearning}
                  className="px-6 py-3 rounded-2xl bg-brand-black text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 hover:bg-neutral-800 transition active:scale-95 shadow-md cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current text-brand-mint" />
                  <span>{course.progressPercent > 0 ? 'Resume Learning' : 'Start Course'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Course Syllabus / Chapters */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-brand-black brand-title">Course Syllabus</h2>
            <span className="text-xs font-semibold text-brand-muted">
              {course.completedCount} of {course.lessonsCount} Completed
            </span>
          </div>

          {(course.chapters || []).map((ch, chIdx) => {
            const isExpanded = !!expandedChapters[chIdx];

            return (
              <div
                key={chIdx}
                className="rounded-2xl glass-card border border-white/80 overflow-hidden shadow-sm"
              >
                {/* Chapter Accordion Header */}
                <button
                  onClick={() => toggleChapter(chIdx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-white/40 transition text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg glass-lavender flex items-center justify-center text-xs font-bold text-brand-black">
                      {chIdx + 1}
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-brand-black">
                        {ch.name}
                      </h3>
                      <span className="text-[11px] text-brand-muted">
                        {ch.lessons.length} module{ch.lessons.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-brand-muted" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-brand-muted" />
                  )}
                </button>

                {/* Chapter Lessons List */}
                {isExpanded && (
                  <div className="p-3 sm:p-4 pt-0 space-y-2">
                    {ch.lessons.map((lesson) => (
                      <div
                        key={lesson._id}
                        onClick={() => navigate(`/learn/${courseId}?lesson=${lesson._id}`)}
                        className="p-3.5 rounded-xl bg-white/40 hover:bg-white/80 border border-white/70 flex items-center justify-between gap-3 cursor-pointer transition group"
                      >
                        <div className="flex items-center gap-3">
                          {lesson.isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-brand-black/30 group-hover:border-brand-black shrink-0" />
                          )}
                          <div>
                            <p className="text-xs sm:text-sm font-semibold text-brand-black group-hover:text-indigo-950 transition">
                              {lesson.title}
                            </p>
                            {lesson.notesCount > 0 && (
                              <span className="text-[10px] text-brand-muted flex items-center gap-1 mt-0.5">
                                <FileText className="w-3 h-3" /> Includes {lesson.notesCount} PDF resource(s)
                              </span>
                            )}
                          </div>
                        </div>

                        <span className="text-[11px] font-semibold text-brand-muted shrink-0 flex items-center gap-1 group-hover:text-brand-black transition">
                          <Play className="w-3 h-3 fill-current" /> Watch
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      <BottomNavigation />
    </LiquidBackground>
  );
};

export default CourseDetails;

