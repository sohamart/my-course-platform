import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { KeyRound, ShieldAlert, CheckCircle2, User, BookOpen, Trash2, Shield, Plus } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import LiquidBackground from '../../components/effects/LiquidBackground';
import Header from '../../components/layout/Header';
import AdminSidebar from '../../components/layout/AdminSidebar';
import DatabaseErrorAlert from '../../components/common/DatabaseErrorAlert';

const EnrollmentManagement = () => {
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State
  const [selectedStudentId, setSelectedStudentId] = useState(searchParams.get('studentId') || '');
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [stRes, cRes, enrRes] = await Promise.all([
        api.get('/admin/students'),
        api.get('/admin/courses'),
        api.get('/admin/enrollments'),
      ]);

      if (stRes.data && stRes.data.success) {
        setStudents(stRes.data.students || []);
        if (!selectedStudentId && stRes.data.students?.length > 0) {
          setSelectedStudentId(stRes.data.students[0]._id);
        }
      }
      if (cRes.data && cRes.data.success) {
        setCourses(cRes.data.courses || []);
      }
      if (enrRes.data && enrRes.data.success) {
        setEnrollments(enrRes.data.enrollments || []);
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

  const handleCourseCheckbox = (courseId) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  };

  const handleGrantAccess = async (e) => {
    e.preventDefault();
    if (!selectedStudentId) {
      showToast('Please select a student.', 'warning');
      return;
    }
    if (selectedCourseIds.length === 0) {
      showToast('Please select at least one course.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/admin/enrollments', {
        studentId: selectedStudentId,
        courseIds: selectedCourseIds,
      });

      if (res.data && res.data.success) {
        showToast(res.data.message, 'success');
        setSelectedCourseIds([]);
        // Refresh enrollments & students
        const enrRes = await api.get('/admin/enrollments');
        if (enrRes.data && enrRes.data.success) {
          setEnrollments(enrRes.data.enrollments);
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to grant course access.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeAccess = async (enrollmentId) => {
    try {
      const res = await api.delete(`/admin/enrollments/${enrollmentId}`);
      if (res.data && res.data.success) {
        showToast('Course access revoked immediately.', 'success');
        setEnrollments((prev) =>
          prev.map((e) => (e._id === enrollmentId ? { ...e, status: 'revoked' } : e))
        );
      }
    } catch (err) {
      showToast('Failed to revoke access.', 'error');
    }
  };

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
              ACCESS CONTROL GATEWAY
            </span>
            <h1 className="text-2xl font-extrabold text-brand-black brand-title mt-0.5">
              Course Enrollment System
            </h1>
            <p className="text-xs text-brand-muted mt-0.5">
              Manually authorize specific students to access specific course tracks.
            </p>
          </div>

          {/* Database Connection Error Alert */}
          {error && (
            <DatabaseErrorAlert message={error} onRetry={loadData} />
          )}

          {/* Workflow Card: 1. Select Student -> 2. Select Courses -> 3. Grant Access */}
          <div className="rounded-[28px] glass-card p-6 sm:p-8 border border-white/80 shadow-glass">
            <h2 className="text-base font-bold text-brand-black flex items-center gap-2 mb-4">
              <KeyRound className="w-5 h-5 text-indigo-700" />
              Manual Course Access Grant
            </h2>

            <form onSubmit={handleGrantAccess} className="space-y-5">
              {/* Step 1: Select Student */}
              <div>
                <label className="block text-xs font-semibold text-brand-black mb-1.5">
                  1. Select Student
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full sm:w-96 px-4 py-2.5 rounded-2xl glass-card border border-white/80 text-xs sm:text-sm text-brand-black focus:outline-none"
                >
                  <option value="">-- Choose registered student --</option>
                  {students.map((st) => (
                    <option key={st._id} value={st._id}>
                      {st.name} ({st.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Select Courses */}
              <div>
                <label className="block text-xs font-semibold text-brand-black mb-2">
                  2. Select Course(s) to Authorize
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {courses.map((c) => {
                    const isSelected = selectedCourseIds.includes(c._id);
                    return (
                      <div
                        key={c._id}
                        onClick={() => handleCourseCheckbox(c._id)}
                        className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center gap-3 select-none ${
                          isSelected
                            ? 'glass-lavender border-indigo-300 shadow-sm'
                            : 'glass-card border-white/80 hover:bg-white/60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // handled by parent div
                          className="w-4 h-4 rounded text-brand-black accent-brand-black pointer-events-none"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-brand-black truncate">{c.title}</p>
                          <span className="text-[10px] text-brand-muted font-medium">
                            {c.category} · {c.lessonsCount || 0} lessons
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Click Grant Access */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto justify-center px-6 py-3 rounded-2xl bg-brand-black text-white text-xs sm:text-sm font-semibold flex items-center gap-2 hover:bg-neutral-800 transition active:scale-95 shadow-md cursor-pointer disabled:opacity-50"
                >
                  <KeyRound className="w-4 h-4 text-brand-mint" />
                  <span>
                    {submitting
                      ? 'Granting Authorization...'
                      : `Grant Access (${selectedCourseIds.length} Selected)`}
                  </span>
                </button>
                <span className="text-xs text-brand-muted">
                  Student immediately gains streaming permission.
                </span>
              </div>
            </form>
          </div>

          {/* Active Enrollments History Table */}
          <div className="rounded-[28px] glass-card overflow-hidden border border-white/80 shadow-glass">
            <div className="p-5 sm:p-6 border-b border-white/60 flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold text-brand-black">
                Active & Past Course Enrollments
              </h3>
              <span className="text-xs text-brand-muted font-semibold">
                {enrollments.filter((e) => e.status === 'active').length} active records
              </span>
            </div>

            {loading ? (
              <div className="p-8 space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-12 rounded-xl glass-card animate-pulse" />
                ))}
              </div>
            ) : enrollments.length > 0 ? (
              <>
                {/* Mobile Enrollments View */}
                <div className="md:hidden divide-y divide-white/60">
                  {enrollments.map((enr) => (
                    <div key={enr._id} className="p-4 sm:p-5 space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {enr.studentId?.avatarUrl ? (
                            <img
                              src={enr.studentId.avatarUrl}
                              alt={enr.studentId.name}
                              className="w-8 h-8 rounded-lg object-cover border border-white/80 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-brand-black text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                              {(enr.studentId?.name || 'S').slice(0, 2)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-brand-black text-sm truncate">
                              {enr.studentId?.name || 'Deleted Student'}
                            </p>
                            <p className="text-[11px] text-brand-muted truncate">{enr.studentId?.email}</p>
                          </div>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                            enr.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {enr.status}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white/60 border border-white/80 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-brand-black">{enr.courseId?.title}</p>
                          <span className="text-[10px] text-brand-muted">{enr.courseId?.category}</span>
                        </div>
                        <span className="text-[10px] text-brand-muted font-mono">
                          {new Date(enr.assignedAt).toLocaleDateString()}
                        </span>
                      </div>

                      {enr.status === 'active' && (
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => handleRevokeAccess(enr._id)}
                            className="w-full sm:w-auto px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition active:scale-95"
                          >
                            Revoke Access
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Desktop & Tablet Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/60 border-b border-white/80 text-[11px] font-bold uppercase text-brand-muted tracking-wider">
                      <tr>
                        <th className="p-4 pl-6">Student</th>
                        <th className="p-4">Course</th>
                        <th className="p-4">Grant Date</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 pr-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/60">
                      {enrollments.map((enr) => (
                        <tr key={enr._id} className="hover:bg-white/40 transition">
                          <td className="p-4 pl-6">
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
                                <p className="font-bold text-brand-black truncate">
                                  {enr.studentId?.name || 'Deleted Student'}
                                </p>
                                <p className="text-[11px] text-brand-muted truncate">{enr.studentId?.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            <p className="font-semibold text-brand-black">{enr.courseId?.title}</p>
                            <span className="text-[10px] text-brand-muted">
                              {enr.courseId?.category}
                            </span>
                          </td>

                          <td className="p-4 font-mono text-[11px] text-brand-muted">
                            {new Date(enr.assignedAt).toLocaleDateString()}
                          </td>

                          <td className="p-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                enr.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {enr.status}
                            </span>
                          </td>

                          <td className="p-4 pr-6 text-right">
                            {enr.status === 'active' ? (
                              <button
                                onClick={() => handleRevokeAccess(enr._id)}
                                className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-[11px] font-semibold transition"
                                title="Immediately revokes student media access"
                              >
                                Revoke Access
                              </button>
                            ) : (
                              <span className="text-[10px] text-brand-muted">Revoked</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-xs text-brand-muted">
                No course enrollments granted yet.
              </div>
            )}
          </div>
        </main>
      </div>
    </LiquidBackground>
  );
};

export default EnrollmentManagement;

