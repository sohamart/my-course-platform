import React, { useEffect, useState } from 'react';
import { BookOpen, Trophy, Compass, Sparkles, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import LiquidBackground from '../../components/effects/LiquidBackground';
import Header from '../../components/layout/Header';
import WelcomeHero from '../../components/dashboard/WelcomeHero';
import StatsCard from '../../components/dashboard/StatsCard';
import ContinueLearning from '../../components/dashboard/ContinueLearning';
import CourseCard from '../../components/dashboard/CourseCard';
import BottomNavigation from '../../components/layout/BottomNavigation';
import DatabaseErrorAlert from '../../components/common/DatabaseErrorAlert';
import TeacherContactModal from '../../components/common/TeacherContactModal';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, coursesRes] = await Promise.all([
        api.get('/student/dashboard'),
        api.get('/student/courses'),
      ]);

      if (dashRes.data && dashRes.data.success) {
        setDashboardData(dashRes.data.data);
      }
      if (coursesRes.data && coursesRes.data.success) {
        setCourses(coursesRes.data.courses || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError(
        err.response?.data?.message ||
          'Not connected to database. Please contact developer.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const activeCoursesCount = dashboardData?.activeCoursesCount ?? 0;
  const completedLessonsCount = dashboardData?.completedLessonsCount ?? 0;

  return (
    <LiquidBackground>
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 space-y-6">
        {/* Database Connection Error Alert */}
        {error && (
          <DatabaseErrorAlert message={error} onRetry={fetchDashboard} />
        )}

        {/* Welcome Hero */}
        <WelcomeHero userName={user?.name?.split(' ')[0] || 'Learner'} />

        {/* Statistics Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <StatsCard
            icon={BookOpen}
            value={activeCoursesCount}
            label="Active Courses"
            variant="lavender"
            loading={loading}
          />
          <StatsCard
            icon={Trophy}
            value={completedLessonsCount}
            label="Lessons Done"
            variant="mint"
            loading={loading}
          />
        </div>

        {/* Continue Learning Section */}
        {!error && (
          <ContinueLearning continueData={dashboardData?.continueLearning} />
        )}

        {/* My Assigned Courses Section */}
        <div className="pt-4">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-brand-black brand-title">
                My Assigned Courses
              </h2>
              <p className="text-xs text-brand-muted mt-0.5">
                Curated curriculum granted specifically for your personal learning.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-72 rounded-[28px] glass-card animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="p-8 rounded-[28px] glass-card border border-rose-200 text-center">
              <p className="text-xs font-semibold text-rose-700">
                Could not load curriculum due to database connection issue.
              </p>
            </div>
          ) : courses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>
          ) : (
            <div className="p-10 rounded-[28px] glass-card border border-white/80 text-center space-y-4">
              <Compass className="w-10 h-10 text-brand-muted mx-auto" />
              <div>
                <h3 className="text-base font-bold text-brand-black">No Courses Assigned Yet</h3>
                <p className="text-xs text-brand-muted mt-1 max-w-sm mx-auto">
                  You currently have 0 active courses. Courses in this private portal are assigned directly by your teacher.
                </p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => setShowContactModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-black text-white text-xs font-bold hover:bg-neutral-800 transition active:scale-95 shadow-md cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-brand-lavender" />
                  <span>Contact Teacher to Unlock Courses</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <BottomNavigation />

      {/* Teacher Contact Modal for 0 courses */}
      <TeacherContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        studentName={user?.name}
        studentEmail={user?.email}
        title="Contact Your Teacher"
        subtitle="Request access to your personal courses"
        proceedLabel="Close"
      />
    </LiquidBackground>
  );
};

export default Dashboard;

