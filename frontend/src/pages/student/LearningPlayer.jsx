import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Play,
  Pause,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Shield,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ArrowLeft,
  BookOpen,
  Sparkles,
  RotateCcw,
  RotateCw,
  Gauge,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import LiquidBackground from '../../components/effects/LiquidBackground';
import Header from '../../components/layout/Header';
import PDFViewerModal from '../../components/player/PDFViewerModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const WATERMARK_POSITIONS = [
  { top: '8%', left: '6%' },
  { top: '10%', right: '8%' },
  { bottom: '22%', left: '8%' },
  { bottom: '24%', right: '6%' },
  { top: '36%', left: '22%' },
  { top: '55%', right: '16%' },
  { top: '18%', right: '22%' },
  { bottom: '38%', left: '16%' },
];

const LearningPlayer = () => {
  const { courseId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [course, setCourse] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [activeNote, setActiveNote] = useState(null);

  // Video State & Player Container References
  const videoRef = useRef(null);
  const playerContainerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isMediaReady, setIsMediaReady] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'notes'
  const [watermarkPosIdx, setWatermarkPosIdx] = useState(0);

  // Periodic Floating Anti-Piracy Watermark repositioning (every 8.5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setWatermarkPosIdx((prev) => (prev + 1) % WATERMARK_POSITIONS.length);
    }, 8500);
    return () => clearInterval(interval);
  }, []);

  // Listen to browser fullscreen changes to ensure watermark & controls stay active
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!(document.fullscreenElement || document.webkitFullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Auto-hide controls after 2.8s of inactivity during playback (like YouTube)
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2800);
    }
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      setShowControls(false);
    }
  };

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // Fetch course structure
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const res = await api.get(`/student/courses/${courseId}`);
        if (res.data && res.data.success) {
          const cData = res.data.course;
          setCourse(cData);

          // Find requested lesson or first lesson in course
          const lessonIdParam = searchParams.get('lesson');
          let targetLessonId = lessonIdParam;

          if (!targetLessonId && cData.chapters?.length > 0) {
            targetLessonId = cData.chapters[0].lessons[0]?._id;
          }

          if (targetLessonId) {
            loadLesson(targetLessonId);
          }
        }
      } catch (err) {
        showToast(err.response?.data?.message || 'Access restricted.', 'error');
        navigate('/courses');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId]);

  // Trigger active browser media preloading whenever lesson changes
  useEffect(() => {
    if (currentLesson?.videoUrl) {
      setIsVideoLoading(true);
      if (videoRef.current) {
        try {
          videoRef.current.load();
        } catch (e) {}
      }
    } else {
      setIsVideoLoading(false);
    }
  }, [currentLesson?.videoUrl]);

  // Load a specific lesson and request presigned media URLs
  const loadLesson = async (lessonId) => {
    try {
      setLessonLoading(true);
      setIsVideoLoading(true);
      setIsBuffering(false);
      setBufferedPercent(0);
      setCurrentTime(0);
      setIsMediaReady(false);
      setSearchParams({ lesson: lessonId });
      const res = await api.get(`/student/lessons/${lessonId}/access`);
      if (res.data && res.data.success) {
        const lData = res.data.lesson;
        setCurrentLesson(lData);
        if (lData.duration) {
          setDuration(lData.duration);
        }
        setIsPlaying(false);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load lesson media.', 'error');
    } finally {
      setLessonLoading(false);
    }
  };

  // Continuous buffer calculation for the scrubber track
  const updateBuffer = () => {
    const v = videoRef.current;
    if (!v || !v.buffered.length || !v.duration || isNaN(v.duration)) return;
    const ct = v.currentTime || 0;
    let bufferEnd = 0;
    for (let i = 0; i < v.buffered.length; i++) {
      const start = v.buffered.start(i);
      const end = v.buffered.end(i);
      if (start <= ct + 1.2 && end >= ct) {
        bufferEnd = end;
        break;
      }
    }
    if (bufferEnd === 0 && v.buffered.length > 0) {
      bufferEnd = v.buffered.end(v.buffered.length - 1);
    }
    const percent = Math.min(100, Math.max(0, Math.round((bufferEnd / v.duration) * 100)));
    setBufferedPercent(percent);
  };

  // Toggle Play / Pause - Starts immediately without artificial delays
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying) {
      v.pause();
      setIsPlaying(false);
      setIsBuffering(false);
      setShowControls(true);
    } else {
      setIsBuffering(true);
      const playPromise = v.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setIsBuffering(false);
          })
          .catch((err) => {
            console.warn('Playback interrupted:', err);
            setIsPlaying(false);
            setIsBuffering(false);
          });
      }
    }
  };

  // Skip time forward or backward
  const handleSkip = (seconds) => {
    if (!videoRef.current) return;
    const newTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    updateBuffer();
  };

  // Cycle playback speed: 1x -> 1.25x -> 1.5x -> 2x -> 0.75x
  const handleCycleSpeed = () => {
    if (!videoRef.current) return;
    const speeds = [1, 1.25, 1.5, 2, 0.75];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    videoRef.current.playbackRate = nextSpeed;
    setPlaybackRate(nextSpeed);
    showToast(`Playback speed: ${nextSpeed}x`, 'info');
  };

  // Handle Video Time Update
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
    updateBuffer();
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration;
    if (dur && !isNaN(dur)) {
      setDuration(dur);
      setIsMediaReady(true);
    }
    updateBuffer();
  };

  const handleWaiting = () => {
    if (isPlaying) {
      setIsBuffering(true);
    }
  };

  const handleSeek = (e) => {
    if (!videoRef.current) return;
    const seekTime = Number(e.target.value);
    videoRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
    updateBuffer();
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Fullscreen Container Toggle - Keeps watermark and custom controls visible
  const toggleFullscreen = () => {
    const target = playerContainerRef.current || videoRef.current;
    if (!target) return;

    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      if (target.requestFullscreen) {
        target.requestFullscreen().catch((err) => {
          console.warn('Fullscreen request failed:', err);
        });
      } else if (target.webkitRequestFullscreen) {
        target.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.warn('Exit fullscreen failed:', err);
        });
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  };

  // Keyboard Shortcuts (Space: Play/Pause, F: Fullscreen, M: Mute, Left/Right: Seek)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleSkip(10);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleSkip(-10);
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isMuted, duration]);

  // Mark lesson completed
  const handleToggleCompleted = async () => {
    if (!currentLesson) return;
    const newStatus = !currentLesson.isCompleted;

    try {
      const res = await api.post('/student/progress', {
        courseId,
        lessonId: currentLesson._id,
        isCompleted: newStatus,
        watchTime: Math.round(currentTime),
      });

      if (res.data && res.data.success) {
        setCurrentLesson((prev) => ({ ...prev, isCompleted: newStatus }));
        showToast(
          newStatus ? 'Lesson marked as completed! 🎉' : 'Lesson marked as incomplete.',
          'success'
        );

        // Update local course structure checkmarks
        setCourse((prevCourse) => {
          if (!prevCourse) return prevCourse;
          const updatedChapters = prevCourse.chapters.map((ch) => ({
            ...ch,
            lessons: ch.lessons.map((l) =>
              l._id === currentLesson._id ? { ...l, isCompleted: newStatus } : l
            ),
          }));
          return { ...prevCourse, chapters: updatedChapters };
        });
      }
    } catch (err) {
      showToast('Failed to update progress.', 'error');
    }
  };

  // Find flattened lesson list to manage Next / Previous
  const allLessons = [];
  course?.chapters?.forEach((ch) => {
    ch.lessons.forEach((l) => allLessons.push(l));
  });

  const currentIndex = allLessons.findIndex((l) => l._id === currentLesson?._id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const formatSeconds = (sec) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading || !course) {
    return (
      <LiquidBackground>
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
          <div className="h-[60vh] rounded-[30px] glass-card" />
        </div>
      </LiquidBackground>
    );
  }

  return (
    <LiquidBackground>
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-4">
          <Link
            to={`/courses/${courseId}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-muted hover:text-brand-black transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Course Syllabus
          </Link>
          <span className="text-xs font-semibold text-brand-muted">
            {course.title}
          </span>
        </div>

        {/* Main Grid: Player on Left, Chapter Sidebar on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video & Lesson Content Section (2 columns) */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {/* Dark Video Container with Fullscreen Container Support */}
            <div
              ref={playerContainerRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className={`relative overflow-hidden bg-neutral-950 flex items-center justify-center select-none ${
                isFullscreen
                  ? 'w-full h-full rounded-none fixed inset-0 z-50'
                  : 'rounded-[28px] shadow-2xl border border-white/60 aspect-video'
              }`}
            >
              {currentLesson?.videoUrl ? (
                <video
                  ref={videoRef}
                  src={currentLesson.videoUrl}
                  preload="auto"
                  playsInline
                  onLoadStart={() => setIsVideoLoading(true)}
                  onLoadedData={() => {
                    setIsVideoLoading(false);
                    setIsMediaReady(true);
                  }}
                  onPlay={() => setIsPlaying(true)}
                  onPlaying={() => {
                    setIsVideoLoading(false);
                    setIsBuffering(false);
                    setIsPlaying(true);
                  }}
                  onCanPlay={() => {
                    setIsVideoLoading(false);
                    setIsMediaReady(true);
                    setIsBuffering(false);
                    updateBuffer();
                  }}
                  onPause={() => {
                    setIsPlaying(false);
                    setIsBuffering(false);
                  }}
                  onWaiting={() => setIsBuffering(true)}
                  onProgress={updateBuffer}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onError={(e) => {
                    console.error('Video error:', e);
                    setIsVideoLoading(false);
                    setIsBuffering(false);
                    setIsPlaying(false);
                  }}
                  onEnded={() => {
                    setIsPlaying(false);
                    setIsBuffering(false);
                    if (!currentLesson.isCompleted) handleToggleCompleted();
                  }}
                  controlsList="nodownload noplaybackrate"
                  disablePictureInPicture
                  onContextMenu={(e) => e.preventDefault()}
                  className="w-full h-full object-contain cursor-pointer"
                  onClick={togglePlay}
                />
              ) : (
                <div className="text-center p-8 text-neutral-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 text-neutral-500" />
                  <p className="text-sm font-semibold text-white">Audio/Video Module</p>
                  <p className="text-xs text-neutral-400 mt-1 max-w-sm">
                    This lesson focuses on interactive reading notes and document resources below.
                  </p>
                </div>
              )}

              {/* Central Play Button */}
              <AnimatePresence>
                {!isPlaying && !lessonLoading && !isVideoLoading && currentLesson?.videoUrl && (
                  <motion.button
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    onClick={togglePlay}
                    className="absolute z-20 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 flex items-center justify-center text-brand-mint shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer group/playbtn"
                    title="Play Video"
                  >
                    {isBuffering ? (
                      <div className="w-8 h-8 rounded-full border-3 border-white/20 border-t-brand-mint animate-spin" />
                    ) : (
                      <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current translate-x-0.5 group-hover/playbtn:scale-110 transition-transform" />
                    )}
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Lesson Data & Video Media Loading Overlay (Never blank; shows beautiful animated loader before video arrives) */}
              <AnimatePresence>
                {(lessonLoading || isVideoLoading) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-neutral-950/95 backdrop-blur-xs p-6 text-center select-none"
                  >
                    {/* Background subtle course thumbnail */}
                    {course?.thumbnailUrl && (
                      <img
                        src={course.thumbnailUrl}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover opacity-20 blur-md pointer-events-none"
                      />
                    )}

                    <div className="relative z-10 flex flex-col items-center">
                      {/* Animated glowing spinner with Brand Mint Accent */}
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-4 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-3 border-white/10" />
                        <div className="absolute inset-0 rounded-full border-3 border-transparent border-t-brand-mint border-r-brand-lavender animate-spin" />
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-brand-mint shadow-inner">
                          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
                        </div>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-white tracking-wide mb-1">
                        Loading HD Video Stream...
                      </h3>
                      <p className="text-xs text-neutral-400 max-w-xs font-medium">
                        Connecting to private cloud storage & buffering video...
                      </p>

                      {/* Shimmering pulse pill */}
                      <div className="mt-4 w-44 sm:w-52 h-1.5 rounded-full bg-white/15 overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-r from-brand-lavender via-brand-mint to-brand-iceblue animate-pulse rounded-full" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Non-blocking Circular Buffering Indicator (YouTube-style) */}
              <AnimatePresence>
                {isBuffering && isPlaying && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-20 pointer-events-none flex flex-col items-center justify-center"
                  >
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-3 border-white/20 border-t-brand-mint animate-spin shadow-2xl" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Dynamic Floating Anti-Piracy Watermark (stays visible in Normal & Fullscreen) */}
              {currentLesson?.videoUrl && (
                <motion.div
                  key={watermarkPosIdx}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 0.35, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                  style={{
                    position: 'absolute',
                    ...WATERMARK_POSITIONS[watermarkPosIdx],
                  }}
                  className="pointer-events-none select-none z-20 flex flex-col items-start px-2.5 py-1 rounded-lg bg-black/45 backdrop-blur-[2px] border border-white/10 text-white font-mono tracking-wider shadow-sm transition-all duration-700"
                >
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/90">
                    <Shield className="w-3 h-3 text-brand-mint/90" />
                    <span>{user?.name || 'Verified Learner'}</span>
                  </div>
                  <span className="text-[9px] text-white/70 lowercase font-medium">{user?.email || 'protected@mycourse.local'}</span>
                  <span className="text-[8px] text-brand-mint/90 tracking-widest uppercase mt-0.5">
                    SECURE STREAM · {user?._id ? user._id.slice(-6).toUpperCase() : 'AUTH'}
                  </span>
                </motion.div>
              )}

              {/* Custom Dark Player Control Overlay */}
              {currentLesson?.videoUrl && (
                <div
                  className={`absolute bottom-0 inset-x-0 p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex flex-col gap-2 transition-opacity duration-300 z-30 ${
                    showControls || !isPlaying ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                  }`}
                >
                  {/* Visual Buffer & Scrubbing Progress Bar */}
                  <div className="relative w-full h-2 group/scrub flex items-center cursor-pointer">
                    {/* Background Track */}
                    <div className="absolute inset-0 bg-white/20 rounded-full" />
                    {/* Buffered Track (shows bytes preloaded ahead) */}
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-white/45 rounded-full transition-all duration-300 shadow-sm"
                      style={{ width: `${bufferedPercent}%` }}
                    />
                    {/* Played Track */}
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-brand-mint rounded-full shadow-sm"
                      style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                    />
                    {/* Scrub Input Range */}
                    <input
                      type="range"
                      min="0"
                      max={duration || 100}
                      value={currentTime}
                      onChange={handleSeek}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                  </div>

                  {/* Buttons & Indicators Row */}
                  <div className="flex items-center justify-between text-white text-xs gap-2 pt-1">
                    <div className="flex items-center gap-1.5 sm:gap-2.5">
                      {/* Play/Pause */}
                      <button
                        onClick={togglePlay}
                        className="p-1.5 rounded-lg hover:bg-white/20 transition text-brand-mint active:scale-95 cursor-pointer"
                        title={isPlaying ? "Pause (Space)" : "Play (Space)"}
                      >
                        {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                      </button>

                      {/* Rewind 10s */}
                      <button
                        onClick={() => handleSkip(-10)}
                        className="p-1.5 rounded-lg hover:bg-white/20 transition text-neutral-300 hover:text-white cursor-pointer"
                        title="Rewind 10s (←)"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>

                      {/* Forward 10s */}
                      <button
                        onClick={() => handleSkip(10)}
                        className="p-1.5 rounded-lg hover:bg-white/20 transition text-neutral-300 hover:text-white cursor-pointer"
                        title="Forward 10s (→)"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>

                      {/* Mute/Volume */}
                      <button
                        onClick={toggleMute}
                        className="p-1.5 rounded-lg hover:bg-white/20 transition text-neutral-300 hover:text-white cursor-pointer"
                        title={isMuted ? "Unmute (M)" : "Mute (M)"}
                      >
                        {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                      </button>

                      {/* Current Time / Duration */}
                      <span className="text-[11px] font-mono text-neutral-300 ml-1">
                        {formatSeconds(currentTime)} / {formatSeconds(duration || currentLesson?.duration || 0)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Speed Cycler Button */}
                      <button
                        onClick={handleCycleSpeed}
                        className="px-2 py-1 rounded-lg hover:bg-white/20 transition text-[11px] font-bold text-brand-mint flex items-center gap-1 bg-white/10 cursor-pointer"
                        title="Playback Speed"
                      >
                        <Gauge className="w-3.5 h-3.5" />
                        <span>{playbackRate}x</span>
                      </button>

                      {/* Fullscreen Button */}
                      <button
                        onClick={toggleFullscreen}
                        className="p-1.5 rounded-lg hover:bg-white/20 transition text-neutral-300 hover:text-white cursor-pointer"
                        title={isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen (F)"}
                      >
                        {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Lesson Title & Controls Card */}
            <div className="rounded-[26px] glass-card p-6 border border-white/80 shadow-glass">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-lavender text-brand-black">
                      {currentLesson?.chapter || 'Module'}
                    </span>
                    <span className="text-xs text-brand-muted font-medium">
                      Lesson {currentLesson?.order}
                    </span>
                  </div>
                  <h1 className="text-lg sm:text-2xl font-extrabold text-brand-black brand-title">
                    {currentLesson?.title}
                  </h1>
                </div>

                {/* Mark as Completed Button */}
                <button
                  onClick={handleToggleCompleted}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 transition active:scale-95 cursor-pointer shadow-sm ${
                    currentLesson?.isCompleted
                      ? 'glass-mint text-emerald-900 border border-emerald-300'
                      : 'bg-brand-black text-white hover:bg-neutral-800'
                  }`}
                >
                  <CheckCircle2
                    className={`w-4 h-4 ${
                      currentLesson?.isCompleted ? 'text-emerald-600' : 'text-brand-mint'
                    }`}
                  />
                  <span>{currentLesson?.isCompleted ? 'Completed' : 'Mark Completed'}</span>
                </button>
              </div>

              {/* Prev / Next controls */}
              <div className="mt-5 pt-4 border-t border-white/60 flex items-center justify-between">
                <button
                  disabled={!prevLesson}
                  onClick={() => prevLesson && loadLesson(prevLesson._id)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition ${
                    prevLesson
                      ? 'glass-card text-brand-black hover:bg-white/70 cursor-pointer'
                      : 'opacity-40 cursor-not-allowed text-brand-muted'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" /> Previous Lesson
                </button>

                <button
                  disabled={!nextLesson}
                  onClick={() => nextLesson && loadLesson(nextLesson._id)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition ${
                    nextLesson
                      ? 'bg-brand-black text-white hover:bg-neutral-800 cursor-pointer'
                      : 'opacity-40 cursor-not-allowed bg-neutral-300 text-brand-muted'
                  }`}
                >
                  Next Lesson <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tabs for Overview & PDF Notes */}
            <div className="rounded-[26px] glass-card p-6 border border-white/80 shadow-glass">
              <div className="flex items-center gap-2 border-b border-white/60 pb-3 mb-4">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeTab === 'overview'
                      ? 'bg-brand-black text-white'
                      : 'text-brand-muted hover:text-brand-black'
                  }`}
                >
                  Lesson Overview
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                    activeTab === 'notes'
                      ? 'bg-brand-black text-white'
                      : 'text-brand-muted hover:text-brand-black'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" /> PDF Notes
                  {currentLesson?.notes?.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-brand-lavender text-brand-black text-[10px] flex items-center justify-center">
                      {currentLesson.notes.length}
                    </span>
                  )}
                </button>
              </div>

              {activeTab === 'overview' ? (
                <div className="text-xs sm:text-sm text-brand-muted leading-relaxed">
                  <p>{currentLesson?.description || 'No additional summary text for this module.'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentLesson?.notes && currentLesson.notes.length > 0 ? (
                    currentLesson.notes.map((note) => (
                      <div
                        key={note._id}
                        className="p-3.5 rounded-2xl bg-white/50 border border-white/70 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl glass-lavender flex items-center justify-center text-indigo-900">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-brand-black">{note.name}</p>
                            <span className="text-[10px] text-brand-muted font-mono">
                              {(note.size / (1024 * 1024)).toFixed(2)} MB · Protected PDF
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => setActiveNote(note)}
                          className="px-3 py-1.5 rounded-xl bg-brand-black text-white text-xs font-semibold hover:bg-neutral-800 transition"
                        >
                          Read In-App
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-brand-muted">
                      No supplementary PDF notes attached to this lesson.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Chapters & Lessons Sidebar (1 column) */}
          <div className="rounded-[28px] glass-card p-5 border border-white/80 shadow-glass flex flex-col h-fit">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/60">
              <h3 className="text-sm font-bold text-brand-black brand-title">Course Modules</h3>
              <span className="text-[11px] font-semibold text-brand-muted">
                {allLessons.filter((l) => l.isCompleted).length}/{allLessons.length} Done
              </span>
            </div>

            <div data-lenis-prevent className="space-y-4 max-h-[75vh] overflow-y-auto pr-1 overscroll-contain">
              {(course.chapters || []).map((ch, chIdx) => (
                <div key={chIdx} className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-brand-muted px-2">
                    {ch.name}
                  </h4>
                  <div className="space-y-1">
                    {ch.lessons.map((lesson) => {
                      const isActive = lesson._id === currentLesson?._id;
                      return (
                        <button
                          key={lesson._id}
                          onClick={() => loadLesson(lesson._id)}
                          className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition ${
                            isActive
                              ? 'bg-brand-black text-white shadow-sm'
                              : 'hover:bg-white/60 text-brand-black'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {lesson.isCompleted ? (
                              <CheckCircle2
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isActive ? 'text-brand-mint' : 'text-emerald-600'
                                }`}
                              />
                            ) : (
                              <div
                                className={`w-3.5 h-3.5 rounded-full border shrink-0 ${
                                  isActive ? 'border-white/50' : 'border-black/30'
                                }`}
                              />
                            )}
                            <span className="text-xs font-semibold truncate">{lesson.title}</span>
                          </div>
                          <span
                            className={`text-[10px] font-mono shrink-0 ${
                              isActive ? 'text-white/70' : 'text-brand-muted'
                            }`}
                          >
                            {formatSeconds(lesson.duration)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* PDF Modal Viewer */}
      {activeNote && (
        <PDFViewerModal note={activeNote} onClose={() => setActiveNote(null)} />
      )}
    </LiquidBackground>
  );
};

export default LearningPlayer;

