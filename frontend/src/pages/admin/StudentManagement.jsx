import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, KeyRound, ShieldAlert, CheckCircle2, UserX, UserCheck } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import LiquidBackground from '../../components/effects/LiquidBackground';
import Header from '../../components/layout/Header';
import AdminSidebar from '../../components/layout/AdminSidebar';
import DatabaseErrorAlert from '../../components/common/DatabaseErrorAlert';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchStudents();
  }, [statusFilter]);

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = '/admin/students';
      if (statusFilter !== 'all') {
        url += `?status=${statusFilter}`;
      }
      const res = await api.get(url);
      if (res.data && res.data.success) {
        setStudents(res.data.students || []);
      } else {
        throw new Error(res.data?.message || 'Database connection error');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Not connected to database. Please contact developer.'
      );
      showToast('Database connection failed. Please contact developer.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (student) => {
    try {
      const res = await api.put(`/admin/students/${student._id}/status`);
      if (res.data && res.data.success) {
        showToast(res.data.message, 'success');
        fetchStudents();
      }
    } catch (err) {
      showToast('Failed to update student status.', 'error');
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <LiquidBackground fixedLayout>
      <Header />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-stretch gap-8 overflow-hidden min-h-0">
        <AdminSidebar />

        <main
          data-lenis-prevent
          className="flex-1 min-w-0 h-full overflow-y-auto pr-1 pb-24 space-y-6 scroll-smooth overscroll-contain"
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">
              STUDENT ROSTER
            </span>
            <h1 className="text-2xl font-extrabold text-brand-black brand-title mt-0.5">
              Student Management
            </h1>
            <p className="text-xs text-brand-muted mt-0.5">
              Review registered students, monitor assigned courses, and manage account statuses.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-brand-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by student name or email..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl glass-card border border-white/80 text-xs sm:text-sm text-brand-black focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              {['all', 'active', 'inactive'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                    statusFilter === st
                      ? 'bg-brand-black text-white shadow-sm'
                      : 'glass-card border border-white/80 text-brand-muted hover:text-brand-black'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Students Table */}
          <div className="rounded-[28px] glass-card overflow-hidden border border-white/80 shadow-glass">
            {loading ? (
              <div className="p-8 space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-14 rounded-xl glass-card animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <div className="p-6">
                <DatabaseErrorAlert message={error} onRetry={fetchStudents} />
              </div>
            ) : filteredStudents.length > 0 ? (
              <>
                {/* Mobile View: Responsive Student Cards */}
                <div className="md:hidden divide-y divide-white/60">
                  {filteredStudents.map((st) => (
                    <div key={st._id} className="p-4 sm:p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {st.avatarUrl ? (
                            <img
                              src={st.avatarUrl}
                              alt={st.name}
                              className="w-9 h-9 rounded-xl object-cover border border-white/80 shadow-xs shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-brand-black text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs shrink-0">
                              {st.name.slice(0, 2)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-brand-black text-sm">{st.name}</p>
                            <p className="text-[11px] text-brand-muted truncate">{st.email}</p>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                            st.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {st.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {/* Courses */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-brand-muted">
                          {st.activeCoursesCount} Course(s) Assigned:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {st.courses?.length > 0 ? (
                            st.courses.map((c) => (
                              <span
                                key={c.courseId}
                                className="text-[10px] px-2.5 py-0.5 rounded-full bg-brand-lavender text-brand-black"
                              >
                                {c.title}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-brand-muted italic">No courses granted yet</span>
                          )}
                        </div>
                      </div>

                      {/* Mobile Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/60">
                        <span className="text-[10px] text-brand-muted font-mono">
                          Joined {new Date(st.createdAt).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/admin/enrollments?studentId=${st._id}`}
                            className="px-3 py-1.5 rounded-xl bg-brand-black text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-neutral-800 transition active:scale-95"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-brand-mint" />
                            Grant
                          </Link>
                          <button
                            onClick={() => handleToggleStatus(st)}
                            className={`p-1.5 rounded-xl border transition active:scale-95 ${
                              st.isActive
                                ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                                : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                            }`}
                            title={st.isActive ? 'Deactivate Student' : 'Activate Student'}
                          >
                            {st.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop & Tablet Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/60 border-b border-white/80 text-[11px] font-bold uppercase text-brand-muted tracking-wider">
                      <tr>
                        <th className="p-4 pl-6">Student</th>
                        <th className="p-4">Assigned Courses</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Registered Date</th>
                        <th className="p-4 pr-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/60">
                      {filteredStudents.map((st) => (
                        <tr key={st._id} className="hover:bg-white/40 transition">
                          <td className="p-4 pl-6">
                            <div className="flex items-center gap-3">
                              {st.avatarUrl ? (
                                <img
                                  src={st.avatarUrl}
                                  alt={st.name}
                                  className="w-8 h-8 rounded-xl object-cover border border-white/80 shadow-xs shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-xl bg-brand-black text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                  {st.name.slice(0, 2)}
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-brand-black">{st.name}</p>
                                <p className="text-[11px] text-brand-muted">{st.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="flex flex-col gap-1">
                              <span className="font-semibold text-brand-black">
                                {st.activeCoursesCount} course(s) assigned
                              </span>
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {st.courses?.map((c) => (
                                  <span
                                    key={c.courseId}
                                    className="text-[9.5px] px-2 py-0.5 rounded-full bg-brand-lavender text-brand-black truncate max-w-[140px]"
                                  >
                                    {c.title}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                st.isActive
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {st.isActive ? 'Active' : 'Deactivated'}
                            </span>
                          </td>

                          <td className="p-4 font-mono text-brand-muted text-[11px]">
                            {new Date(st.createdAt).toLocaleDateString()}
                          </td>

                          <td className="p-4 pr-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                to={`/admin/enrollments?studentId=${st._id}`}
                                className="px-3 py-1.5 rounded-xl bg-brand-black text-white text-xs font-semibold flex items-center gap-1 hover:bg-neutral-800 transition"
                              >
                                <KeyRound className="w-3.5 h-3.5 text-brand-lavender" />
                                Grant Access
                              </Link>

                              <button
                                onClick={() => handleToggleStatus(st)}
                                className={`p-1.5 rounded-xl border transition ${
                                  st.isActive
                                    ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                                    : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                }`}
                                title={st.isActive ? 'Deactivate Student' : 'Activate Student'}
                              >
                                {st.isActive ? (
                                  <UserX className="w-4 h-4" />
                                ) : (
                                  <UserCheck className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-brand-muted text-xs">
                No students match the criteria.
              </div>
            )}
          </div>
        </main>
      </div>
    </LiquidBackground>
  );
};

export default StudentManagement;

