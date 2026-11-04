import React, { useEffect, useState } from 'react';
import { BarChart2, CheckCircle2, Clock, BookOpen, Trophy } from 'lucide-react';
import api from '../../services/api';
import LiquidBackground from '../../components/effects/LiquidBackground';
import Header from '../../components/layout/Header';
import StatsCard from '../../components/dashboard/StatsCard';
import BottomNavigation from '../../components/layout/BottomNavigation';
import DatabaseErrorAlert from '../../components/common/DatabaseErrorAlert';

const Progress = () => {
  const [progressList, setProgressList] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProgress = async () => {
    setLoading(true);
    setError(null);
    try {
      const [progRes, dashRes] = await Promise.all([
        api.get('/student/progress'),
        api.get('/student/dashboard'),
      ]);

      if (progRes.data && progRes.data.success) {
        setProgressList(progRes.data.progress || []);
      }
      if (dashRes.data && dashRes.data.success) {
        setDashboardData(dashRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load progress:', err);
      setError(
        err.response?.data?.message ||
          'Not connected to database. Please contact developer.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  return (
    <LiquidBackground>
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28">
        {/* Database Connection Error Alert */}
        {error && (
          <div className="mb-6">
            <DatabaseErrorAlert message={error} onRetry={fetchProgress} />
          </div>
        )}

        <div className="mb-8">
          <span className="text-[11px] font-bold uppercase tracking-widest text-brand-muted">
            STUDY METRICS
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-black brand-title mt-0.5">
            Learning Progress
          </h1>
          <p className="text-xs sm:text-sm text-brand-muted mt-1 max-w-2xl">
            Detailed breakdown of your completed modules, time invested, and mastery across assigned courses.
          </p>
        </div>

        {/* High level stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <StatsCard
            icon={Trophy}
            value={dashboardData?.completedLessonsCount ?? 0}
            label="Total Lessons Done"
            variant="mint"
            loading={loading}
          />
          <StatsCard
            icon={BookOpen}
            value={dashboardData?.activeCoursesCount ?? 0}
            label="Enrolled Courses"
            variant="lavender"
            loading={loading}
          />
          <StatsCard
            icon={Clock}
            value={dashboardData?.totalWatchHours ?? '0.0'}
            label="Hours Invested"
            variant="iceblue"
            loading={loading}
          />
        </div>

        {/* Course-by-course Progress Breakdown */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-brand-black brand-title mb-3">
            Course Completion Breakdown
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-28 rounded-2xl glass-card animate-pulse" />
              ))}
            </div>
          ) : progressList.length > 0 ? (
            progressList.map((item) => (
              <div
                key={item.courseId}
                className="rounded-2xl glass-card p-5 sm:p-6 border border-white/80 shadow-glass flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-lavender text-brand-black">
                      {item.category}
                    </span>
                    <span className="text-xs text-brand-muted font-medium">
                      {item.completedLessons} of {item.totalLessons} Lessons Done
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-brand-black">{item.courseTitle}</h3>
                </div>

                <div className="w-full sm:w-64 flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-xs font-semibold text-brand-black">
                    <span className="text-brand-muted">Completion</span>
                    <span>{item.percent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-black/5 overflow-hidden p-0.5 border border-white/70">
                    <div
                      style={{ width: `${item.percent}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.percent === 100
                          ? 'bg-emerald-500'
                          : 'bg-brand-black shadow-glow-lavender'
                      }`}
                    />
                  </div>
                </div>
              </div>
            ))
          ) : error ? (
            <div className="p-8 rounded-2xl glass-card text-center text-rose-600 text-xs font-semibold">
              Could not load progress records due to database connection issue.
            </div>
          ) : (
            <div className="p-10 rounded-2xl glass-card text-center text-brand-muted text-xs">
              No course progress recorded yet.
            </div>
          )}
        </div>
      </main>

      <BottomNavigation />
    </LiquidBackground>
  );
};

export default Progress;

