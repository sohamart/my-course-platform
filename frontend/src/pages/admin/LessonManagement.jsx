import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Play,
  FileText,
  Trash2,
  Edit2,
  Upload,
  CheckCircle2,
  Clock,
  X,
  AlertCircle,
  Video,
  Layers,
  Sparkles,
  Check,
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import LiquidBackground from '../../components/effects/LiquidBackground';
import Header from '../../components/layout/Header';
import AdminSidebar from '../../components/layout/AdminSidebar';
import DatabaseErrorAlert from '../../components/common/DatabaseErrorAlert';
import MediaAssetPickerModal from '../../components/admin/MediaAssetPickerModal';

const LessonManagement = () => {
  const { courseId } = useParams();
  const { showToast } = useToast();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Lesson Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    chapter: 'General',
    description: '',
    order: 1,
    isPreview: false,
    videoKey: '',
    videoDuration: 0,
    videoSize: 0,
    notes: [],
  });

  // Reusable Media Library Picker State
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerTab, setPickerTab] = useState('video'); // 'video' | 'note'
  const [reusedVideoMeta, setReusedVideoMeta] = useState(null);

  // Upload States
  const [videoFile, setVideoFile] = useState(null);
  const [notesFiles, setNotesFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [deletingLesson, setDeletingLesson] = useState(null);

  useEffect(() => {
    fetchLessons();
  }, [courseId]);

  const fetchLessons = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/admin/courses/${courseId}/lessons`);
      if (res.data && res.data.success) {
        setCourse(res.data.course);
        setLessons(res.data.lessons || []);
      } else {
        throw new Error(res.data?.message || 'Database connection error');
      }
    } catch (err) {
      console.error('Failed to load course lessons:', err);
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
    setEditingLesson(null);
    setFormData({
      title: '',
      chapter: 'General',
      description: '',
      order: lessons.length + 1,
      isPreview: false,
      videoKey: '',
      videoDuration: 0,
      videoSize: 0,
      notes: [],
    });
    setVideoFile(null);
    setNotesFiles([]);
    setReusedVideoMeta(null);
    setIsModalOpen(true);
  };

  const openEditModal = (lesson) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title,
      chapter: lesson.chapter || 'General',
      description: lesson.description || '',
      order: lesson.order,
      isPreview: !!lesson.isPreview,
      videoKey: lesson.videoKey || '',
      videoDuration: lesson.videoDuration || 0,
      videoSize: lesson.videoSize || 0,
      notes: lesson.notes || [],
    });
    setVideoFile(null);
    setNotesFiles([]);
    setReusedVideoMeta(null);
    setIsModalOpen(true);
  };

  // Handle asset reuse selection from Media Asset Picker
  const handleSelectVideoFromLibrary = (videoItem) => {
    setVideoFile(null);
    setFormData((prev) => ({
      ...prev,
      videoKey: videoItem.key,
      videoDuration: videoItem.duration || 0,
      videoSize: videoItem.size || 0,
    }));
    setReusedVideoMeta({
      title: videoItem.title,
      courseTitle: videoItem.courseTitle,
      chapter: videoItem.chapter,
    });
    showToast(`Reusing video from "${videoItem.courseTitle}"`, 'success');
  };

  const handleSelectNoteFromLibrary = (noteItem) => {
    const existingNotes = formData.notes || [];
    if (existingNotes.some((n) => n.key === noteItem.key)) {
      showToast('This note is already attached to this lesson.', 'info');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      notes: [
        ...prev.notes,
        {
          name: noteItem.name,
          key: noteItem.key,
          size: noteItem.size || 0,
          reusedFrom: noteItem.courseTitle,
        },
      ],
    }));
    showToast(`Attached note "${noteItem.name}"`, 'success');
  };

  // Upload file via Presigned S3 PUT URL
  const uploadToS3 = async (file, fileType) => {
    const res = await api.post('/media/admin/upload-url', {
      fileType,
      originalFilename: file.name,
      contentType: file.type || (fileType === 'note' ? 'application/pdf' : 'video/mp4'),
      fileSize: file.size,
      courseId,
    });

    if (!res.data || !res.data.success) {
      throw new Error(`Failed to obtain upload token for ${file.name}`);
    }

    const { uploadUrl, objectKey } = res.data.data;

    await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || (fileType === 'note' ? 'application/pdf' : 'video/mp4'),
      },
      body: file,
    });

    return { objectKey, size: file.size, name: file.name };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let finalVideoKey = formData.videoKey;
      let finalVideoSize = formData.videoSize;
      let finalNotes = [...(formData.notes || [])];

      // 1. Upload Video if new file selected
      if (videoFile) {
        setUploadStatus('Uploading video to private S3 bucket...');
        const vResult = await uploadToS3(videoFile, 'video');
        finalVideoKey = vResult.objectKey;
        finalVideoSize = vResult.size;
      }

      // 2. Upload PDF Notes if selected
      if (notesFiles.length > 0) {
        setUploadStatus(`Uploading ${notesFiles.length} PDF note(s)...`);
        for (const nf of notesFiles) {
          const nResult = await uploadToS3(nf, 'note');
          finalNotes.push({
            name: nResult.name,
            key: nResult.objectKey,
            size: nResult.size,
          });
        }
      }

      const payload = {
        ...formData,
        videoKey: finalVideoKey,
        videoSize: finalVideoSize,
        notes: finalNotes,
      };

      if (editingLesson) {
        await api.put(`/admin/lessons/${editingLesson._id}`, payload);
        showToast('Lesson updated successfully!', 'success');
      } else {
        await api.post(`/admin/courses/${courseId}/lessons`, payload);
        showToast('Lesson created successfully!', 'success');
      }

      setIsModalOpen(false);
      fetchLessons();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
      setUploadStatus('');
    }
  };

  const confirmDeleteLesson = async () => {
    if (!deletingLesson) return;
    try {
      await api.delete(`/admin/lessons/${deletingLesson._id}`);
      showToast('Lesson deleted successfully.', 'success');
      setDeletingLesson(null);
      fetchLessons();
    } catch (err) {
      showToast('Failed to delete lesson.', 'error');
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
          {/* Breadcrumb & Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <Link
                to="/admin/courses"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-muted hover:text-brand-black transition mb-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Courses
              </Link>
              <h1 className="text-2xl font-extrabold text-brand-black brand-title">
                {course?.title || 'Course'} — Lessons
              </h1>
              <p className="text-xs text-brand-muted mt-0.5">
                Organize chapters, upload private videos, and attach PDF notes.
              </p>
            </div>

            <button
              onClick={openCreateModal}
              className="px-4 py-2.5 rounded-2xl bg-brand-black text-white text-xs font-semibold flex items-center gap-2 hover:bg-neutral-800 transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 text-brand-lavender" /> Add Lesson
            </button>
          </div>

          {/* Lessons List */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-20 rounded-2xl glass-card animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <DatabaseErrorAlert message={error} onRetry={fetchLessons} />
          ) : lessons.length > 0 ? (
            <div className="space-y-3">
              {lessons.map((lesson) => (
                <div
                  key={lesson._id}
                  className="rounded-2xl sm:rounded-3xl glass-card p-4 sm:p-5 border border-white/80 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 sm:gap-4 transition hover:shadow-md"
                >
                  <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 flex-1 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl glass-lavender flex items-center justify-center font-bold text-xs text-indigo-950 shrink-0 mt-0.5 sm:mt-0 shadow-xs">
                      {lesson.order}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">
                          {lesson.chapter}
                        </span>
                        {lesson.isPreview && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Preview Free
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-brand-black leading-snug">
                        {lesson.title}
                      </h3>
                      <div className="flex items-center gap-3 text-[11px] text-brand-muted font-medium mt-1.5 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Video className="w-3.5 h-3.5 text-brand-black" />
                          {lesson.videoKey ? 'Video Attached' : 'No Video'}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-brand-black" />
                          {lesson.notes?.length || 0} PDF Notes
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Full width on mobile, compact on tablet/desktop */}
                  <div className="flex items-center gap-2 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-white/60 shrink-0 justify-end">
                    <button
                      onClick={() => openEditModal(lesson)}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl glass-card border border-white/80 text-xs font-semibold text-brand-black hover:bg-white/80 transition active:scale-95 cursor-pointer shadow-xs"
                      title="Edit Lesson"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span className="sm:hidden">Edit</span>
                    </button>
                    <button
                      onClick={() => setDeletingLesson(lesson)}
                      className="p-2 sm:p-2 rounded-xl glass-card border border-rose-200 text-rose-600 hover:bg-rose-50/80 transition active:scale-95 cursor-pointer shadow-xs"
                      title="Delete Lesson"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 rounded-2xl glass-card text-center text-xs text-brand-muted">
              No lessons added yet. Click "Add Lesson" to upload your first module.
            </div>
          )}
        </main>
      </div>

      {/* Add / Edit Lesson Modal */}
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
                  <Layers className="w-5 h-5 text-brand-mint" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-brand-black brand-title">
                    {editingLesson ? 'Edit Module Lecture' : 'Add New Lecture Module'}
                  </h3>
                  <p className="text-[11px] text-brand-muted">
                    {editingLesson
                      ? 'Update chapter sequence, private video, and study guide materials.'
                      : 'Configure module order, upload private video, and attach PDF study notes.'}
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

            {/* Form wrapping scrollable inputs and pinned footer */}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Scrollable Form Body */}
              <div
                data-lenis-prevent
                onWheel={(e) => e.stopPropagation()}
                className="flex-1 min-h-0 overflow-y-auto modal-scrollbar p-6 space-y-6 overscroll-contain bg-white"
              >
                {/* Section 1: Module Essentials */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-1 border-b border-neutral-100">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">
                      01 · MODULE ESSENTIALS
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                      Lesson Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      placeholder="e.g. AWS S3 Presigned URLs Implementation"
                      className="w-full px-4 py-2.5 rounded-xl bg-neutral-50/50 border border-neutral-200 text-xs sm:text-sm text-brand-black placeholder:text-neutral-400 focus:outline-none focus:bg-white focus:border-brand-black focus:ring-2 focus:ring-brand-black/10 transition shadow-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                        Chapter / Section <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.chapter}
                        onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
                        required
                        placeholder="e.g. Chapter 01 · System Architecture"
                        className="w-full px-4 py-2.5 rounded-xl bg-neutral-50/50 border border-neutral-200 text-xs sm:text-sm text-brand-black placeholder:text-neutral-400 focus:outline-none focus:bg-white focus:border-brand-black focus:ring-2 focus:ring-brand-black/10 transition shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                        Display Order <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.order}
                        onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                        required
                        min="1"
                        className="w-full px-4 py-2.5 rounded-xl bg-neutral-50/50 border border-neutral-200 text-xs sm:text-sm text-brand-black focus:outline-none focus:bg-white focus:border-brand-black focus:ring-2 focus:ring-brand-black/10 transition shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Free Preview Toggle Pill */}
                  <label className="flex items-center gap-3 p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/90 cursor-pointer select-none hover:bg-neutral-100/70 transition">
                    <input
                      type="checkbox"
                      checked={formData.isPreview || false}
                      onChange={(e) => setFormData({ ...formData, isPreview: e.target.checked })}
                      className="w-4 h-4 rounded text-brand-black accent-brand-black cursor-pointer"
                    />
                    <div>
                      <p className="text-xs font-bold text-brand-black">Allow Free Preview</p>
                      <p className="text-[11px] text-brand-muted">
                        Un-enrolled students can watch this module before access is granted.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Section 2: Study Guide & Description */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-1 border-b border-neutral-100">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">
                      02 · STUDY GUIDE & DESCRIPTIONS
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                      Description / Study Guide
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows="3"
                      placeholder="Key concepts, architecture patterns, and study tips for this lecture..."
                      className="w-full px-4 py-2.5 rounded-xl bg-neutral-50/50 border border-neutral-200 text-xs sm:text-sm text-brand-black placeholder:text-neutral-400 focus:outline-none focus:bg-white focus:border-brand-black focus:ring-2 focus:ring-brand-black/10 transition resize-none shadow-xs"
                    />
                  </div>
                </div>

                {/* Section 3: Video Lecture (Private AWS S3) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-neutral-100">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">
                      03 · VIDEO STREAM (PRIVATE AWS S3)
                    </span>
                    <span className="text-[10px] text-brand-muted font-medium">MP4, WebM (Max 500MB)</span>
                  </div>

                  {/* Clean Media Box */}
                  <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/90 flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-brand-black text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Video className="w-6 h-6 text-brand-lavender" />
                    </div>

                    <div className="flex-1 min-w-0 w-full space-y-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-bold text-brand-black">Video Lecture</p>
                          {videoFile ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              New File Selected
                            </span>
                          ) : reusedVideoMeta ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-lavender text-brand-black flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-brand-black" />
                              Reused: {reusedVideoMeta.courseTitle}
                            </span>
                          ) : formData.videoKey ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-lavender text-brand-black">
                              Attached in AWS S3
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                              No Video Attached
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-brand-muted truncate mt-0.5">
                          {videoFile
                            ? `Selected local file: ${videoFile.name} (${(videoFile.size / (1024 * 1024)).toFixed(1)} MB)`
                            : reusedVideoMeta
                            ? `Reusing: "${reusedVideoMeta.title}" (${reusedVideoMeta.courseTitle})`
                            : formData.videoKey
                            ? 'Video stream is safely stored in private AWS S3 bucket.'
                            : 'Upload a new HD video lecture or select an existing lecture from other courses.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Option 1: Upload from Computer */}
                        <input
                          type="file"
                          id="lessonVideoInput"
                          accept="video/mp4,video/webm,video/quicktime"
                          onChange={(e) => {
                            setVideoFile(e.target.files[0] || null);
                            setReusedVideoMeta(null);
                          }}
                          className="hidden"
                        />
                        <label
                          htmlFor="lessonVideoInput"
                          className="px-3.5 py-2 rounded-xl bg-white border border-neutral-300 hover:border-brand-black hover:bg-neutral-50 text-xs font-bold text-brand-black transition cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{videoFile || formData.videoKey ? 'Upload Replacement' : 'Upload From Computer'}</span>
                        </label>

                        {/* Option 2: Select from Existing Courses / Library */}
                        <button
                          type="button"
                          onClick={() => {
                            setPickerTab('video');
                            setIsPickerOpen(true);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-brand-black hover:bg-neutral-800 text-white text-xs font-bold transition cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                        >
                          <Layers className="w-3.5 h-3.5 text-brand-lavender" />
                          <span>Select from Existing Courses</span>
                        </button>

                        {/* Option to clear video */}
                        {(videoFile || formData.videoKey) && (
                          <button
                            type="button"
                            onClick={() => {
                              setVideoFile(null);
                              setReusedVideoMeta(null);
                              setFormData({ ...formData, videoKey: '', videoDuration: 0, videoSize: 0 });
                            }}
                            className="text-[11px] font-semibold text-rose-500 hover:text-rose-700 px-2 py-1 transition cursor-pointer"
                          >
                            Remove Video
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Protected PDF Notes */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-neutral-100">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">
                      04 · PROTECTED PDF NOTES (AWS S3)
                    </span>
                    <span className="text-[10px] text-brand-muted font-medium">In-App Protected Reader</span>
                  </div>

                  <div className="space-y-3">
                    {/* Add PDF Buttons: Upload vs Reuse */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <input
                        type="file"
                        id="lessonNotesInput"
                        accept="application/pdf"
                        multiple
                        onChange={(e) => setNotesFiles(Array.from(e.target.files || []))}
                        className="hidden"
                      />
                      <label
                        htmlFor="lessonNotesInput"
                        className="px-3.5 py-2 rounded-xl bg-white border border-neutral-300 hover:border-brand-black hover:bg-neutral-50 text-xs font-bold text-brand-black transition cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>
                          {notesFiles.length > 0
                            ? `+ Attach Local (${notesFiles.length} selected)`
                            : '+ Upload PDF From Computer'}
                        </span>
                      </label>

                      {/* Select Existing PDF from other courses */}
                      <button
                        type="button"
                        onClick={() => {
                          setPickerTab('note');
                          setIsPickerOpen(true);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                      >
                        <Layers className="w-3.5 h-3.5 text-brand-lavender" />
                        <span>+ Select from Existing Notes</span>
                      </button>

                      <span className="text-[10px] text-brand-muted">Max 50MB per file</span>
                    </div>

                    {/* Attached Notes List */}
                    {formData.notes?.length > 0 && (
                      <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/90 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted block">
                          Current Attached Notes ({formData.notes.length}):
                        </span>
                        <div className="space-y-1.5">
                          {formData.notes.map((n, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-white border border-neutral-200/80 shadow-2xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                <span className="font-semibold text-brand-black truncate">{n.name}</span>
                                {n.reusedFrom && (
                                  <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-brand-lavender text-brand-black shrink-0">
                                    Reused: {n.reusedFrom}
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = formData.notes.filter((_, i) => i !== idx);
                                  setFormData({ ...formData, notes: updated });
                                }}
                                className="text-rose-500 hover:text-rose-700 text-[11px] font-bold cursor-pointer shrink-0 ml-2"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {uploadStatus && (
                  <div className="p-3.5 rounded-2xl bg-brand-lavender text-xs font-bold text-brand-black text-center animate-pulse border border-indigo-200 shadow-sm">
                    {uploadStatus}
                  </div>
                )}
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
                  {submitting ? 'Uploading to S3...' : editingLesson ? 'Update Lesson' : 'Save Lesson'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingLesson && (
        <div
          data-lenis-prevent
          onWheel={(e) => e.stopPropagation()}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-3xl glass-card p-6 bg-brand-offwhite border border-rose-200 shadow-2xl text-center">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-brand-black">Delete Lesson?</h3>
            <p className="text-xs text-brand-muted mt-2 leading-relaxed">
              This will permanently delete <strong>{deletingLesson.title}</strong>, remove its video and notes from S3 storage, and erase student progress for this module.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setDeletingLesson(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-brand-muted hover:text-brand-black"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteLesson}
                className="px-5 py-2.5 rounded-2xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition shadow-md"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Media Asset Picker Modal */}
      <MediaAssetPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        initialTab={pickerTab}
        onSelectVideo={handleSelectVideoFromLibrary}
        onSelectNote={handleSelectNoteFromLibrary}
        currentVideoKey={formData.videoKey}
        attachedNoteKeys={(formData.notes || []).map((n) => n.key)}
      />
    </LiquidBackground>
  );
};

export default LessonManagement;

