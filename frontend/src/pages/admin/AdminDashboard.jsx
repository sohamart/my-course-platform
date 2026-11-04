import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  BookOpen,
  KeyRound,
  HardDrive,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import api from '../../services/api';
import LiquidBackground from '../../components/effects/LiquidBackground';
import Header from '../../components/layout/Header';
import AdminSidebar from '../../components/layout/AdminSidebar';
import DatabaseErrorAlert from '../../components/common/DatabaseErrorAlert';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAdminOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/dashboard');
      if (res.data && res.data.success) {
        setData(res.data);
      } else {
        throw new Error(res.data?.message || 'Database connection error');
      }
    } catch (err) {
      console.error('Failed to load admin overview:', err);
      setError(
        err.response?.data?.message ||
          'Not connected to database. Please contact developer.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminOverview();
  }, []);

  const stats = data?.stats;
  const s3Status = data?.s3Status;

  return (
    <LiquidBackground fixedLayout>
      <Header />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-stretch gap-8 overflow-hidden min-h-0">
        <AdminSidebar />

        <main
          data-lenis-prevent
          className="flex-1 min-w-0 h-full overflow-y-auto pr-1 pb-24 space-y-6 scroll-smooth overscroll-contain"
        >
          {/* Database Connection Error Alert */}
          {error && (
            <DatabaseErrorAlert
              message={error}
              onRetry={fetchAdminOverview}
            />
          )}

          {/* Welcome & S3 Status Banner */}
          <div className="rounded-[28px] glass-card p-6 sm:p-8 border border-white/80 shadow-glass flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">
                TEACHER & SYSTEM CONTROL
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-black brand-title mt-0.5">
                Admin Dashboard
              </h1>
              <p className="text-xs text-brand-muted mt-1">
                Manage curriculum, enrollments, student access, and private S3 media assets.
              </p>
            </div>

            {/* S3 Health Pill */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl glass-card border border-white/90 text-xs shadow-sm">
              <span className={`w-2.5 h-2.5 rounded-full ${loading ? 'bg-amber-400' : 'bg-emerald-500'} animate-pulse`} />
              <div className="flex flex-col">
                <span className="font-bold text-brand-black text-[11px]">
                  {loading
                    ? 'Checking S3...'
                    : s3Status?.mode === 'production_aws_s3'
                    ? 'AWS S3 Active'
                    : 'Local S3 Emulation'}
                </span>
                <span className="text-[10px] text-brand-muted">
                  {loading ? 'fetching status' : s3Status?.bucketName || 'private media'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="rounded-2xl glass-card p-5 border border-white/80 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-semibold text-brand-muted">Total Students</span>
              <div className="flex items-baseline justify-between mt-2">
                {loading ? (
                  <div className="h-8 w-16 bg-neutral-200/70 rounded-lg animate-pulse" />
                ) : (
                  <span className="text-2xl sm:text-3xl font-extrabold text-brand-black">
                    {stats?.totalStudents ?? 0}
                  </span>
                )}
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
            </div>

            <div className="rounded-2xl glass-card p-5 border border-white/80 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-semibold text-brand-muted">Courses (Published)</span>
              <div className="flex items-baseline justify-between mt-2">
                {loading ? (
                  <div className="h-8 w-20 bg-neutral-200/70 rounded-lg animate-pulse" />
                ) : (
                  <span className="text-2xl sm:text-3xl font-extrabold text-brand-black">
                    {stats?.publishedCourses ?? 0}/{stats?.totalCourses ?? 0}
                  </span>
                )}
                <BookOpen className="w-5 h-5 text-emerald-600" />
              </div>
            </div>

            <div className="rounded-2xl glass-card p-5 border border-white/80 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-semibold text-brand-muted">Active Access Grants</span>
              <div className="flex items-baseline justify-between mt-2">
                {loading ? (
                  <div className="h-8 w-16 bg-neutral-200/70 rounded-lg animate-pulse" />
                ) : (
                  <span className="text-2xl sm:text-3xl font-extrabold text-brand-black">
                    {stats?.activeEnrollments ?? 0}
                  </span>
                )}
                <KeyRound className="w-5 h-5 text-amber-600" />
              </div>
            </div>

            <div className="rounded-2xl glass-card p-5 border border-white/80 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-semibold text-brand-muted">Storage In Use</span>
              <div className="flex items-baseline justify-between mt-2">
                {loading ? (
                  <div className="h-8 w-24 bg-neutral-200/70 rounded-lg animate-pulse" />
                ) : (
                  <span className="text-2xl sm:text-3xl font-extrabold text-brand-black">
                    {stats?.totalStorageMB ?? '0.00'} MB
                  </span>
                )}
                <HardDrive className="w-5 h-5 text-sky-600" />
              </div>
            </div>
          </div>

          {/* Quick Action Shortcuts */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              to="/admin/courses?action=create"
              className="justify-center px-4 py-2.5 rounded-2xl bg-brand-black text-white text-xs font-semibold flex items-center gap-2 hover:bg-neutral-800 transition active:scale-95 shadow-sm"
            >
              <Plus className="w-4 h-4 text-brand-lavender" /> Create New Course
            </Link>

            <Link
              to="/admin/enrollments"
              className="justify-center px-4 py-2.5 rounded-2xl glass-card border border-white/80 text-brand-black text-xs font-semibold hover:bg-white/70 transition active:scale-95 shadow-sm flex items-center gap-2"
            >
              <KeyRound className="w-4 h-4 text-brand-black" /> Grant Course Access
            </Link>

            <Link
              to="/admin/students"
              className="justify-center px-4 py-2.5 rounded-2xl glass-card border border-white/80 text-brand-black text-xs font-semibold hover:bg-white/70 transition active:scale-95 shadow-sm flex items-center gap-2"
            >
              <Users className="w-4 h-4 text-brand-black" /> View All Students
            </Link>
          </div>

          {/* Dual Tables: Recent Enrollments & Recent Registrations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Enrollments */}
            <div className="rounded-[26px] glass-card p-5 sm:p-6 border border-white/80 shadow-glass">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/60">
                <h3 className="text-sm font-bold text-brand-black">Recent Course Grants</h3>
                <Link to="/admin/enrollments" className="text-xs text-brand-muted hover:text-brand-black">
                  Manage All
                </Link>
              </div>

              <div className="space-y-2.5">
                {loading ? (
                  <div className="space-y-2.5">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="h-12 rounded-xl bg-white/40 animate-pulse border border-white/50" />
                    ))}
                  </div>
                ) : data?.recentEnrollments && data.recentEnrollments.length > 0 ? (
                  data.recentEnrollments.map((enr) => (
                    <div
                      key={enr._id}
                      className="p-3 rounded-xl bg-white/50 border border-white/70 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {enr.studentId?.avatarUrl ? (
                          <img
                            src={enr.studentId.avatarUrl}
                            alt={enr.studentId.name}
                            className="w-7 h-7 rounded-lg object-cover border border-white/80 shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-brand-black text-white flex items-center justify-center font-bold text-[10px] uppercase shrink-0">
                            {(enr.studentId?.name || 'S').slice(0, 2)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-brand-black truncate">{enr.studentId?.name || 'Student'}</p>
                          <p className="text-[11px] text-brand-muted truncate">{enr.courseId?.title}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-brand-muted font-mono shrink-0">
                        {new Date(enr.assignedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                ) : error ? (
                  <p className="text-xs text-rose-600 py-4 text-center font-medium">Database connection error</p>
                ) : (
                  <p className="text-xs text-brand-muted py-4 text-center">No enrollments yet.</p>
                )}
              </div>
            </div>

            {/* Recent Students */}
            <div className="rounded-[26px] glass-card p-5 sm:p-6 border border-white/80 shadow-glass">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/60">
                <h3 className="text-sm font-bold text-brand-black">Recent Registrations</h3>
                <Link to="/admin/students" className="text-xs text-brand-muted hover:text-brand-black">
                  View All
                </Link>
              </div>

              <div className="space-y-2.5">
                {loading ? (
                  <div className="space-y-2.5">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="h-12 rounded-xl bg-white/40 animate-pulse border border-white/50" />
                    ))}
                  </div>
                ) : data?.recentStudents && data.recentStudents.length > 0 ? (
                  data.recentStudents.map((st) => (
                    <div
                      key={st._id}
                      className="p-3 rounded-xl bg-white/50 border border-white/70 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {st.avatarUrl ? (
                          <img
                            src={st.avatarUrl}
                            alt={st.name}
                            className="w-7 h-7 rounded-lg object-cover border border-white/80 shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-brand-black text-white flex items-center justify-center font-bold text-[10px] uppercase shrink-0">
                            {st.name.slice(0, 2)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-brand-black truncate">{st.name}</p>
                          <p className="text-[11px] text-brand-muted truncate">{st.email}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 shrink-0">
                        {st.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  ))
                ) : error ? (
                  <p className="text-xs text-rose-600 py-4 text-center font-medium">Database connection error</p>
                ) : (
                  <p className="text-xs text-brand-muted py-4 text-center">No registered students yet.</p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </LiquidBackground>
  );
};

export default AdminDashboard;

