import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Plus,
  BookOpen,
  Edit2,
  Trash2,
  Upload,
  CheckCircle2,
  Clock,
  Layers,
  Search,
  X,
  AlertCircle,
  Users,
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import LiquidBackground from '../../components/effects/LiquidBackground';
import Header from '../../components/layout/Header';
import AdminSidebar from '../../components/layout/AdminSidebar';
import CourseThumbnail from '../../components/common/CourseThumbnail';
import DatabaseErrorAlert from '../../components/common/DatabaseErrorAlert';

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Web Development',
    shortDescription: '',
    detailedDescription: '',
    status: 'draft',
    thumbnailKey: '',
  });

  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation modal state
  const [deletingCourse, setDeletingCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

  // Sync search query from URL
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null && q !== undefined) {
      setSearchTerm(q);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchCourses();
    if (searchParams.get('action') === 'create') {
      openCreateModal();
    }
  }, [searchParams]);

  const filteredCourses = courses.filter((c) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      (c.title || '').toLowerCase().includes(term) ||
      (c.category || '').toLowerCase().includes(term) ||
      (c.shortDescription || '').toLowerCase().includes(term)
    );
  });

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/courses');
      if (res.data && res.data.success) {
        setCourses(res.data.courses || []);
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

  const openCreateModal = () => {
    setEditingCourse(null);
    setFormData({
      title: '',
      category: 'Web Development',
      shortDescription: '',
      detailedDescription: '',
      status: 'published',
      thumbnailKey: '',
    });
    setThumbnailFile(null);
    setIsModalOpen(true);
  };

  const openEditModal = (course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      category: course.category,
      shortDescription: course.shortDescription,
      detailedDescription: course.detailedDescription || '',
      status: course.status,
      thumbnailKey: course.thumbnailKey || '',
    });
    setThumbnailFile(null);
    setIsModalOpen(true);
  };

  // Upload thumbnail using Presigned S3 PUT URL
  const uploadThumbnail = async (file) => {
    const res = await api.post('/media/admin/upload-url', {
      fileType: 'thumbnail',
      originalFilename: file.name,
      contentType: file.type || 'image/jpeg',
      fileSize: file.size,
    });

    if (!res.data || !res.data.success) {
      throw new Error('Failed to obtain presigned upload token.');
    }

    const { uploadUrl, objectKey } = res.data.data;

    // Upload directly using PUT to presigned endpoint
    await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'image/jpeg',
      },
      body: file,
    });

    return objectKey;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let finalKey = formData.thumbnailKey;

      if (thumbnailFile) {
        showToast('Uploading thumbnail to private storage...', 'info');
        finalKey = await uploadThumbnail(thumbnailFile);
      }

      const payload = {
        ...formData,
        thumbnailKey: finalKey,
      };

      if (editingCourse) {
        await api.put(`/admin/courses/${editingCourse._id}`, payload);
        showToast('Course updated successfully!', 'success');
      } else {
        await api.post('/admin/courses', payload);
        showToast('Course created successfully!', 'success');
      }

      setIsModalOpen(false);
      fetchCourses();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingCourse) return;
    try {
      await api.delete(`/admin/courses/${deletingCourse._id}`);
      showToast('Course deleted successfully.', 'success');
      setDeletingCourse(null);
      fetchCourses();
    } catch (err) {
      showToast('Failed to delete course.', 'error');
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
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">
                CURRICULUM INVENTORY
              </span>
              <h1 className="text-2xl font-extrabold text-brand-black brand-title mt-0.5">
                Course Management
              </h1>
              <p className="text-xs text-brand-muted mt-0.5">
                Create, organize, and publish course tracks.
              </p>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-60">
                <Search className="w-4 h-4 text-brand-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter courses..."
                  className="w-full pl-9 pr-8 py-2 rounded-2xl glass-card border border-white/80 text-xs text-brand-black placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-black/20"
                />
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      if (searchParams.get('q')) {
                        searchParams.delete('q');
                        setSearchParams(searchParams);
                      }
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-neutral-200/60 text-brand-muted"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                onClick={openCreateModal}
                className="px-4 py-2.5 rounded-2xl bg-brand-black text-white text-xs font-semibold flex items-center gap-2 hover:bg-neutral-800 transition shadow-sm cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 text-brand-lavender" /> Create Course
              </button>
            </div>
          </div>

          {/* Courses List */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-28 rounded-2xl glass-card animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <DatabaseErrorAlert message={error} onRetry={fetchCourses} />
          ) : filteredCourses.length > 0 ? (
            <div className="space-y-4">
              {filteredCourses.map((course) => (
                <div
                  key={course._id}
                  className="rounded-3xl glass-card p-4 sm:p-5 md:p-6 border border-white/80 shadow-glass flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 transition hover:shadow-lg"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 sm:gap-4 flex-1 min-w-0">
                    {/* Thumbnail: responsive banner on mobile, 16:9 box on tablet/desktop */}
                    <div className="w-full sm:w-36 h-40 sm:h-24 rounded-2xl overflow-hidden shrink-0 border border-white/80 shadow-sm">
                      <CourseThumbnail
                        src={course.thumbnailUrl}
                        title={course.title}
                        category={course.category}
                        alt={course.title}
                        className="w-full h-full"
                      />
                    </div>

                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                            course.status === 'published'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {course.status}
                        </span>
                        <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wider">
                          {course.category}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-brand-black leading-snug">
                        {course.title}
                      </h3>
                      <p className="text-xs text-brand-muted line-clamp-2 mt-1">
                        {course.shortDescription}
                      </p>
                      <div className="flex items-center gap-3 sm:gap-4 mt-2.5 text-[11px] font-semibold text-brand-muted flex-wrap">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-brand-black" />
                          {course.lessonsCount || 0} Lessons
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-brand-black" />
                          {course.enrolledStudentsCount || 0} Enrolled
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Row: Full-width touch bar on mobile, aligned on tablet/desktop */}
                  <div className="flex items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-white/60 shrink-0 w-full md:w-auto">
                    <Link
                      to={`/admin/courses/${course._id}/lessons`}
                      className="flex-1 md:flex-initial justify-center px-4 py-2.5 rounded-xl bg-brand-black text-white text-xs font-semibold flex items-center gap-2 hover:bg-neutral-800 transition active:scale-95 shadow-sm"
                    >
                      <Layers className="w-3.5 h-3.5 text-brand-mint" />
                      <span>Lessons</span>
                    </Link>

                    <button
                      onClick={() => openEditModal(course)}
                      className="p-2.5 rounded-xl glass-card border border-white/80 text-brand-muted hover:text-brand-black transition active:scale-95 cursor-pointer"
                      title="Edit Course"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setDeletingCourse(course)}
                      className="p-2.5 rounded-xl glass-card border border-rose-200 text-rose-600 hover:bg-rose-50/80 transition active:scale-95 cursor-pointer"
                      title="Delete Course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : courses.length > 0 ? (
            <div className="p-12 rounded-3xl glass-card text-center border border-white/80">
              <Search className="w-8 h-8 text-brand-muted mx-auto mb-2" />
              <p className="text-sm font-bold text-brand-black">No courses match "{searchTerm}"</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  if (searchParams.get('q')) {
                    searchParams.delete('q');
                    setSearchParams(searchParams);
                  }
                }}
                className="mt-3 px-3.5 py-1.5 rounded-xl bg-brand-black text-white text-xs font-semibold hover:bg-neutral-800 transition"
              >
                Clear Filter
              </button>
            </div>
          ) : (
            <div className="p-12 rounded-2xl glass-card text-center text-xs text-brand-muted">
              No courses created yet. Click "Create Course" to add your first track.
            </div>
          )}
        </main>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div
          data-lenis-prevent
          onWheel={(e) => e.stopPropagation()}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md"
        >
          <div
            data-lenis-prevent
            onWheel={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-[28px] bg-white border border-neutral-200/80 shadow-2xl max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Pinned Modal Header */}
            <div className="shrink-0 flex items-center justify-between px-6 py-4.5 border-b border-neutral-100 bg-neutral-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-black text-white flex items-center justify-center shadow-sm">
                  <BookOpen className="w-5 h-5 text-brand-lavender" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-brand-black brand-title">
                    {editingCourse ? 'Edit Course Track' : 'Create New Course'}
                  </h3>
                  <p className="text-[11px] text-brand-muted">
                    {editingCourse
                      ? 'Modify track syllabus, publishing status, and private cover artwork.'
                      : 'Define curriculum metadata and private S3 media settings.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-brand-muted hover:text-brand-black transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form wrapping body and pinned footer */}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Scrollable Form Body */}
              <div
                data-lenis-prevent
                onWheel={(e) => e.stopPropagation()}
                className="flex-1 min-h-0 overflow-y-auto modal-scrollbar p-6 space-y-6 overscroll-contain bg-white"
              >
                {/* Section 1: Track Essentials */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-1 border-b border-neutral-100">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">
                      01 · TRACK ESSENTIALS
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                      Course Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      placeholder="e.g. Advanced React & Animation Systems"
                      className="w-full px-4 py-2.5 rounded-xl bg-neutral-50/50 border border-neutral-200 text-xs sm:text-sm text-brand-black placeholder:text-neutral-400 focus:outline-none focus:bg-white focus:border-brand-black focus:ring-2 focus:ring-brand-black/10 transition shadow-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                        Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50/50 border border-neutral-200 text-xs sm:text-sm text-brand-black focus:outline-none focus:bg-white focus:border-brand-black focus:ring-2 focus:ring-brand-black/10 transition cursor-pointer"
                      >
                        <option value="Web Development">Web Development</option>
                        <option value="Cloud Architecture">Cloud Architecture</option>
                        <option value="Frontend Engineering">Frontend Engineering</option>
                        <option value="Cybersecurity">Cybersecurity</option>
                        <option value="DevOps">DevOps</option>
                        <option value="AI & Machine Learning">AI & Machine Learning</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                        Publishing Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50/50 border border-neutral-200 text-xs sm:text-sm text-brand-black focus:outline-none focus:bg-white focus:border-brand-black focus:ring-2 focus:ring-brand-black/10 transition cursor-pointer"
                      >
                        <option value="published">Published (Visible in Catalog)</option>
                        <option value="draft">Draft (Admin Only)</option>
                        <option value="archived">Archived (Retired Track)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2: Syllabus & Descriptions */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-1 border-b border-neutral-100">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">
                      02 · SYLLABUS & DESCRIPTIONS
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                      Short Description <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      value={formData.shortDescription}
                      onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                      required
                      rows="2"
                      placeholder="Brief overview displayed on course cards..."
                      className="w-full px-4 py-2.5 rounded-xl bg-neutral-50/50 border border-neutral-200 text-xs sm:text-sm text-brand-black placeholder:text-neutral-400 focus:outline-none focus:bg-white focus:border-brand-black focus:ring-2 focus:ring-brand-black/10 transition resize-none shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                      Detailed Syllabus (Optional)
                    </label>
                    <textarea
                      value={formData.detailedDescription}
                      onChange={(e) =>
                        setFormData({ ...formData, detailedDescription: e.target.value })
                      }
                      rows="3"
                      placeholder="Full syllabus curriculum, prerequisites, and learning outcomes..."
                      className="w-full px-4 py-2.5 rounded-xl bg-neutral-50/50 border border-neutral-200 text-xs sm:text-sm text-brand-black placeholder:text-neutral-400 focus:outline-none focus:bg-white focus:border-brand-black focus:ring-2 focus:ring-brand-black/10 transition resize-none shadow-xs"
                    />
                  </div>
                </div>

                {/* Section 3: Thumbnail Artwork (Integrated S3 Card) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-neutral-100">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">
                      03 · BRANDING & THUMBNAIL (AWS S3)
                    </span>
                    <span className="text-[10px] text-brand-muted font-medium">16:9 Landscape</span>
                  </div>

                  {/* Clean Horizontal Media Asset Card */}
                  <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/90 flex flex-col sm:flex-row items-center gap-4">
                    {/* Live Thumbnail Preview */}
                    <div className="w-full sm:w-44 h-28 sm:h-24 rounded-xl overflow-hidden shrink-0 border border-neutral-200 shadow-sm bg-white">
                      <CourseThumbnail
                        src={thumbnailFile ? URL.createObjectURL(thumbnailFile) : editingCourse?.thumbnailUrl}
                        title={formData.title || 'Course Preview'}
                        category={formData.category}
                        compact
                        className="w-full h-full"
                      />
                    </div>

                    {/* Controls & Status */}
                    <div className="flex-1 min-w-0 w-full space-y-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-brand-black">Cover Preview</p>
                          {thumbnailFile ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              New File Selected
                            </span>
                          ) : editingCourse?.thumbnailUrl ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-lavender text-brand-black">
                              S3 Cloud Active
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-700">
                              Auto-Branded Cover
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-brand-muted truncate mt-0.5">
                          {thumbnailFile
                            ? thumbnailFile.name
                            : 'Upload a custom cover image or let MyCourse auto-brand it.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <input
                          type="file"
                          id="courseThumbInput"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => setThumbnailFile(e.target.files[0] || null)}
                          className="hidden"
                        />
                        <label
                          htmlFor="courseThumbInput"
                          className="px-3.5 py-2 rounded-xl bg-white border border-neutral-300 hover:border-brand-black hover:bg-neutral-50 text-xs font-bold text-brand-black transition cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{thumbnailFile || editingCourse?.thumbnailUrl ? 'Replace Thumbnail' : 'Choose Cover Image'}</span>
                        </label>
                        <span className="text-[10px] text-brand-muted">Max 5MB</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pinned Modal Action Footer */}
              <div className="shrink-0 px-6 py-4 flex items-center justify-end gap-3 border-t border-neutral-100 bg-neutral-50/80">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-brand-muted hover:text-brand-black hover:bg-neutral-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-brand-black text-white text-xs font-bold hover:bg-neutral-800 transition active:scale-95 shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Saving Course...' : editingCourse ? 'Update Course' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCourse && (
        <div
          data-lenis-prevent
          onWheel={(e) => e.stopPropagation()}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-3xl glass-card p-6 bg-brand-offwhite border border-rose-200 shadow-2xl text-center">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-brand-black">Delete Course?</h3>
            <p className="text-xs text-brand-muted mt-2 leading-relaxed">
              This will permanently delete <strong>{deletingCourse.title}</strong>, all associated video lessons, notes from S3, and student enrollment records.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setDeletingCourse(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-brand-muted hover:text-brand-black"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2.5 rounded-2xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition shadow-md"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </LiquidBackground>
  );
};

export default CourseManagement;

