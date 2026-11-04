import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Video,
  FileText,
  Check,
  Clock,
  Layers,
  Sparkles,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import api from '../../services/api';

const MediaAssetPickerModal = ({
  isOpen,
  onClose,
  initialTab = 'video', // 'video' | 'note'
  onSelectVideo,
  onSelectNote,
  currentVideoKey = '',
  attachedNoteKeys = [],
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      fetchMediaLibrary();
    }
  }, [isOpen, initialTab]);

  const fetchMediaLibrary = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/media-library');
      if (res.data && res.data.success) {
        setVideos(res.data.videos || []);
        setNotes(res.data.notes || []);
      }
    } catch (err) {
      console.error('Failed to fetch media library:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Extract unique categories across both videos & notes
  const allCategories = ['All'];
  const items = activeTab === 'video' ? videos : notes;
  items.forEach((item) => {
    if (item.category && !allCategories.includes(item.category)) {
      allCategories.push(item.category);
    }
  });

  // Filter items by search query and category
  const filteredItems = items.filter((item) => {
    const matchesCategory =
      selectedCategory === 'All' || item.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCategory;

    const nameMatch = (item.title || item.name || '').toLowerCase().includes(q);
    const courseMatch = (item.courseTitle || '').toLowerCase().includes(q);
    const chapterMatch = (item.chapter || '').toLowerCase().includes(q);

    return matchesCategory && (nameMatch || courseMatch || chapterMatch);
  });

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return null;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return null;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-3xl max-h-[88vh] rounded-[28px] bg-white border border-neutral-200/90 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-neutral-100 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-brand-lavender text-brand-black">
                <Layers className="w-4 h-4" />
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-brand-black brand-title">
                Reuse Existing Course Media
              </h2>
            </div>
            <p className="text-xs text-brand-muted mt-1">
              Select any previously uploaded video class or PDF notes from existing courses.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-brand-black hover:bg-neutral-100 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher & Search Bar */}
        <div className="p-4 sm:p-6 py-3 border-b border-neutral-100 bg-neutral-50/50 space-y-3 shrink-0">
          {/* Tabs */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('video');
                setSelectedCategory('All');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'video'
                  ? 'bg-brand-black text-white shadow-xs'
                  : 'bg-white text-neutral-600 hover:text-brand-black border border-neutral-200'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Existing Videos</span>
              <span
                className={`text-[10px] px-2 py-0.2 rounded-full ${
                  activeTab === 'video'
                    ? 'bg-white/20 text-white'
                    : 'bg-neutral-100 text-neutral-600'
                }`}
              >
                {videos.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('note');
                setSelectedCategory('All');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'note'
                  ? 'bg-brand-black text-white shadow-xs'
                  : 'bg-white text-neutral-600 hover:text-brand-black border border-neutral-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Existing PDF Notes</span>
              <span
                className={`text-[10px] px-2 py-0.2 rounded-full ${
                  activeTab === 'note'
                    ? 'bg-white/20 text-white'
                    : 'bg-neutral-100 text-neutral-600'
                }`}
              >
                {notes.length}
              </span>
            </button>
          </div>

          {/* Search Input & Category Pills */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === 'video'
                    ? 'Search videos by title, lesson, or course...'
                    : 'Search PDF notes by name or course...'
                }
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-neutral-200 text-xs sm:text-sm text-brand-black placeholder:text-neutral-400 focus:outline-none focus:border-brand-black focus:ring-2 focus:ring-brand-black/10 transition shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-brand-black p-1 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            {allCategories.length > 2 && (
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {allCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-neutral-900 text-white'
                        : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Asset List */}
        <div
          data-lenis-prevent
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 min-h-[260px] overscroll-contain"
        >
          {loading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-20 rounded-2xl bg-neutral-100/80 animate-pulse border border-neutral-200/60"
                />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-3 text-neutral-400">
                {activeTab === 'video' ? (
                  <Video className="w-6 h-6" />
                ) : (
                  <FileText className="w-6 h-6" />
                )}
              </div>
              <h3 className="text-sm font-bold text-brand-black">No matching media found</h3>
              <p className="text-xs text-brand-muted mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? 'Try modifying your search query or switching categories.'
                  : `No existing ${activeTab === 'video' ? 'videos' : 'PDF notes'} have been uploaded yet. You can upload new files directly from your computer.`}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredItems.map((item, idx) => {
                const isVideo = activeTab === 'video';
                const isAlreadySelected = isVideo
                  ? currentVideoKey === item.key
                  : attachedNoteKeys.includes(item.key);

                return (
                  <div
                    key={item.key || idx}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isAlreadySelected
                        ? 'bg-emerald-50/60 border-emerald-200 ring-1 ring-emerald-200'
                        : 'bg-white hover:bg-neutral-50/80 border-neutral-200 shadow-2xs hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isVideo
                            ? 'bg-neutral-900 text-brand-mint'
                            : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                        }`}
                      >
                        {isVideo ? (
                          <Video className="w-5 h-5" />
                        ) : (
                          <FileText className="w-5 h-5" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs sm:text-sm font-bold text-brand-black truncate max-w-md">
                            {item.title || item.name}
                          </h4>
                          {isAlreadySelected && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Attached
                            </span>
                          )}
                        </div>

                        {/* Metadata row */}
                        <div className="flex items-center gap-2 flex-wrap text-[11px] text-brand-muted mt-1">
                          <span className="font-semibold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded-md">
                            {item.courseTitle}
                          </span>
                          {item.chapter && (
                            <span className="truncate max-w-[180px]">
                              {item.chapter}
                            </span>
                          )}
                          {item.duration > 0 && (
                            <span className="flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3" />
                              {formatDuration(item.duration)}
                            </span>
                          )}
                          {item.size > 0 && (
                            <span className="font-mono">{formatSize(item.size)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex items-center justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                      {isAlreadySelected ? (
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100/70">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Attached
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (isVideo) {
                              onSelectVideo(item);
                            } else {
                              onSelectNote(item);
                            }
                            onClose();
                          }}
                          className="px-3.5 py-2 rounded-xl bg-brand-black hover:bg-neutral-800 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-brand-lavender" />
                          <span>{isVideo ? 'Select Video' : 'Attach Note'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-neutral-100 bg-neutral-50/70 flex items-center justify-between text-xs text-brand-muted shrink-0">
          <span>
            {activeTab === 'video'
              ? 'Shared video streams play without re-uploading file bytes to S3.'
              : 'Attached PDF notes are available across lessons in student player.'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-neutral-200 text-xs font-bold text-neutral-700 hover:text-brand-black transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default MediaAssetPickerModal;

