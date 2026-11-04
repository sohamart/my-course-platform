import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  Search,
  Bell,
  User as UserIcon,
  LogOut,
  Settings,
  Shield,
  BookOpen,
  ChevronDown,
  Menu,
  X,
  LayoutDashboard,
  Users,
  KeyRound,
  HardDrive,
  BarChart2,
  Home,
  ArrowRight,
  Sparkles,
  Command,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Header = ({ onSearchClick }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Quick Search Command Palette State
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [coursesList, setCoursesList] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = useRef(null);

  // Global Ctrl+K / Cmd+K and ESC listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setSearchModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [mobileMenuOpen]);

  // Focus input and fetch courses when modal opens
  useEffect(() => {
    if (searchModalOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 60);

      if (coursesList.length === 0) {
        setSearchLoading(true);
        const endpoint = isAdmin ? '/admin/courses' : '/student/courses';
        api
          .get(endpoint)
          .then((res) => {
            if (res.data?.success) {
              setCoursesList(res.data.courses || []);
            }
          })
          .catch((err) => console.warn('Search fetch error:', err))
          .finally(() => setSearchLoading(false));
      }
    } else {
      setSearchQuery('');
    }
  }, [searchModalOpen, isAdmin]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const adminNavLinks = [
    { label: 'Overview', path: '/admin', icon: LayoutDashboard },
    { label: 'Courses & Lessons', path: '/admin/courses', icon: BookOpen },
    { label: 'Students', path: '/admin/students', icon: Users },
    { label: 'Enrollments', path: '/admin/enrollments', icon: KeyRound },
    { label: 'Storage & S3', path: '/admin/storage', icon: HardDrive },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const studentNavLinks = [
    { label: 'Home Dashboard', path: '/dashboard', icon: Home },
    { label: 'My Courses', path: '/courses', icon: BookOpen },
    { label: 'Learning Progress', path: '/progress', icon: BarChart2 },
    { label: 'Profile Settings', path: '/profile', icon: Settings },
  ];

  // Handle enter key in search
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchModalOpen(false);
    if (isAdmin) {
      navigate(`/admin/courses?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate(`/courses?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSelectCourse = (c) => {
    setSearchModalOpen(false);
    if (isAdmin) {
      navigate(`/admin/courses/${c._id}/lessons`);
    } else {
      navigate(`/courses/${c._id}`);
    }
  };

  const handleSelectNav = (path) => {
    setSearchModalOpen(false);
    navigate(path);
  };

  const cleanQuery = searchQuery.trim().toLowerCase();
  const filteredCourses = cleanQuery
    ? coursesList.filter((c) => {
        const title = (c.title || '').toLowerCase();
        const cat = (c.category || '').toLowerCase();
        const desc = (c.shortDescription || '').toLowerCase();
        return title.includes(cleanQuery) || cat.includes(cleanQuery) || desc.includes(cleanQuery);
      })
    : coursesList.slice(0, 4);

  const navLinks = isAdmin ? adminNavLinks : studentNavLinks;
  const filteredNavLinks = cleanQuery
    ? navLinks.filter((item) => item.label.toLowerCase().includes(cleanQuery))
    : navLinks;

  return (
    <header className="sticky top-0 z-50 w-full max-w-full glass-header px-2.5 sm:px-6 lg:px-8 py-2.5 sm:py-3 transition-all overflow-hidden sm:overflow-visible">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-4 min-w-0">
        {/* Brand Logo & Tagline */}
        <Link
          to={isAdmin ? '/admin' : '/dashboard'}
          className="flex items-center gap-2 sm:gap-3 group shrink min-w-0"
        >
          <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-brand-black flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform shrink-0">
            <GraduationCap className="w-4 h-4 sm:w-6 sm:h-6 text-brand-lavender" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-base sm:text-xl font-bold tracking-tight text-brand-black brand-title flex items-center gap-1 sm:gap-1.5 truncate">
              MyCourse
              {isAdmin && (
                <span className="text-[8px] sm:text-[9.5px] uppercase tracking-wider font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-brand-lavender text-brand-black border border-white/60 shrink-0">
                  Admin
                </span>
              )}
            </span>
            <span className="text-[9px] uppercase tracking-widest font-semibold text-brand-muted hidden sm:block truncate">
              YOUR PERSONAL LEARNING SPACE
            </span>
          </div>
        </Link>

        {/* Right Actions */}
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
          {/* Quick Search Button */}
          <button
            onClick={() => {
              if (onSearchClick) onSearchClick();
              setSearchModalOpen(true);
            }}
            className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-2 rounded-xl bg-white/70 border border-white/80 hover:bg-white transition text-brand-muted hover:text-brand-black text-xs sm:text-sm cursor-pointer group shadow-2xs"
            title="Quick search (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-muted group-hover:text-brand-black transition-colors" />
            <span className="hidden md:inline text-xs font-medium">Quick search...</span>
            <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-mono font-semibold text-brand-muted bg-neutral-100 rounded border border-neutral-200">
              Ctrl K
            </kbd>
          </button>

          {/* Notifications Button */}
          <div className="relative">
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setProfileOpen(false);
              }}
              className="relative p-1.5 sm:p-2.5 rounded-xl bg-white/60 border border-white/70 hover:bg-white transition text-brand-black shadow-2xs"
              aria-label="Notifications"
            >
              <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-black" />
              <span className="absolute top-1 right-1 sm:top-2 sm:right-2 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-brand-black ring-2 ring-white animate-pulse" />
            </button>

            {/* Notifications Popover */}
            <AnimatePresence>
              {notificationsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setNotificationsOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white/95 backdrop-blur-3xl p-4 shadow-2xl z-50 border border-white"
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-100">
                      <h4 className="text-sm font-semibold text-brand-black">Notifications</h4>
                      <span className="text-[11px] font-medium text-brand-muted">1 unread</span>
                    </div>
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-xl bg-brand-lavender/40 border border-brand-lavender/70 text-xs">
                        <p className="font-semibold text-brand-black">Welcome to MyCourse!</p>
                        <p className="text-brand-muted mt-0.5">
                          Your personal learning space is active. Happy studying!
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setProfileOpen(!profileOpen);
                setNotificationsOpen(false);
              }}
              className="flex items-center gap-1 sm:gap-2 p-1 sm:p-1.5 sm:pr-2.5 rounded-xl sm:rounded-2xl bg-white/60 border border-white/80 hover:bg-white transition shadow-2xs"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-brand-black text-white flex items-center justify-center font-bold text-xs uppercase tracking-wider overflow-hidden shrink-0">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user?.name ? user.name.slice(0, 2) : 'MC'
                )}
              </div>
              <span className="hidden sm:inline text-xs font-semibold text-brand-black max-w-[90px] truncate">
                {user?.name?.split(' ')[0] || 'User'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-brand-muted hidden sm:inline" />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {profileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    className="absolute right-0 mt-2 w-60 rounded-2xl bg-white/95 backdrop-blur-3xl p-2.5 shadow-2xl z-50 border border-white"
                  >
                    <div className="px-3 py-2 border-b border-neutral-100 mb-1">
                      <p className="text-xs font-bold text-brand-black truncate">{user?.name}</p>
                      <p className="text-[11px] text-brand-muted truncate">{user?.email}</p>
                    </div>

                    {isAdmin ? (
                      <>
                        <Link
                          to="/admin"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-brand-black hover:bg-brand-lavender/30 transition"
                        >
                          <Shield className="w-4 h-4 text-brand-black" />
                          Admin Dashboard
                        </Link>
                        <Link
                          to="/admin/courses"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-brand-black hover:bg-brand-lavender/30 transition"
                        >
                          <BookOpen className="w-4 h-4 text-brand-black" />
                          Manage Courses
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/dashboard"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-brand-black hover:bg-brand-lavender/30 transition"
                        >
                          <BookOpen className="w-4 h-4 text-brand-black" />
                          Student Dashboard
                        </Link>
                        <Link
                          to="/courses"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-brand-black hover:bg-brand-lavender/30 transition"
                        >
                          <BookOpen className="w-4 h-4 text-brand-black" />
                          My Courses
                        </Link>
                      </>
                    )}

                    <Link
                      to={isAdmin && location.pathname.startsWith('/admin') ? '/admin/settings' : '/profile'}
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-brand-black hover:bg-brand-lavender/30 transition"
                    >
                      <Settings className="w-4 h-4 text-brand-black" />
                      Profile & Settings
                    </Link>

                    <div className="border-t border-neutral-100 my-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Navigation Drawer Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 sm:p-2 rounded-xl bg-white/70 border border-white/80 hover:bg-white text-brand-black md:hidden transition shadow-2xs cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>
      </div>

      {/* Slide-out Mobile Navigation Drawer (Portaled to document.body with floating Liquid Glass capsule design) */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                key="mobile-drawer-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 z-[9998] bg-black/45 backdrop-blur-xs md:hidden"
              />
            )}
            {mobileMenuOpen && (
              <motion.div
                key="mobile-drawer-panel"
                initial={{ x: '-110%', opacity: 0.8 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '-110%', opacity: 0.8 }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="fixed top-2.5 bottom-2.5 left-2.5 z-[9999] w-[300px] max-w-[calc(100vw-20px)] rounded-[32px] bg-white/95 backdrop-blur-3xl border border-white/90 shadow-[0_20px_60px_-15px_rgba(75,70,130,0.25)] p-5 flex flex-col justify-between md:hidden overflow-hidden"
              >
                <div className="flex-1 min-h-0 flex flex-col">
                  {/* Drawer Header */}
                  <div className="flex items-center justify-between pb-3.5 border-b border-brand-lavender/40 mb-3.5 shrink-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-brand-black text-white flex items-center justify-center font-bold text-xs uppercase overflow-hidden shrink-0 shadow-sm border border-white/80">
                        {user?.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          user?.name ? user.name.slice(0, 2) : 'MC'
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-brand-black brand-title truncate">{user?.name}</p>
                        <span className="inline-block mt-0.5 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-lavender text-brand-black border border-white/80">
                          {user?.role || 'Student'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-brand-black transition flex items-center justify-center shadow-2xs border border-white/80 cursor-pointer shrink-0"
                      aria-label="Close navigation menu"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Nav Links - Scrollable */}
                  <div
                    data-lenis-prevent
                    className="flex-1 overflow-y-auto pr-1 space-y-1.5 overscroll-contain modal-scrollbar"
                  >
                    <span className="text-[10px] uppercase font-bold tracking-widest text-brand-muted px-3.5 mb-2 block">
                      {isAdmin ? 'ADMINISTRATION' : 'STUDENT PORTAL'}
                    </span>

                    {(isAdmin ? adminNavLinks : studentNavLinks).map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        item.path === '/admin' || item.path === '/dashboard'
                          ? location.pathname === item.path
                          : location.pathname.startsWith(item.path);

                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                            isActive
                              ? 'bg-brand-lavender text-brand-black shadow-xs font-bold border border-white/80'
                              : 'text-brand-muted hover:text-brand-black hover:bg-white/70'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isActive ? 'text-brand-black' : 'text-brand-muted'}`} />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}

                    {isAdmin && (
                      <div className="pt-3 border-t border-brand-lavender/40 mt-3">
                        <Link
                          to={location.pathname.startsWith('/admin') ? '/dashboard' : '/admin'}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-bold text-emerald-950 bg-brand-mint hover:bg-emerald-200 transition border border-emerald-300 shadow-2xs"
                        >
                          <span className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-emerald-800" />
                            {location.pathname.startsWith('/admin') ? 'Student View' : 'Admin Workspace'}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-emerald-800" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* Drawer Footer */}
                <div className="pt-3.5 border-t border-brand-lavender/40 shrink-0">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-rose-600 bg-rose-50/80 hover:bg-rose-100 transition cursor-pointer border border-rose-200/80 shadow-2xs active:scale-98"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* Global Quick Search Spotlight Modal (Portaled to document.body for true viewport positioning) */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {searchModalOpen && (
              <div
                className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-start justify-center pt-20 sm:pt-28 px-4 overflow-y-auto animate-in fade-in duration-200"
                onClick={() => setSearchModalOpen(false)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: -16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -16 }}
                  transition={{ duration: 0.18 }}
                  className="w-full max-w-xl rounded-[28px] bg-white border border-neutral-200/90 shadow-2xl overflow-hidden flex flex-col mb-12"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Search Input Bar */}
                  <form
                    onSubmit={handleSearchSubmit}
                    className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-neutral-100 bg-white"
                  >
                    <Search className="w-5 h-5 text-brand-muted shrink-0" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={
                        isAdmin
                          ? 'Search courses, modules, students, settings...'
                          : 'Search courses, topics, modules...'
                      }
                      className="flex-1 bg-transparent text-sm sm:text-base text-brand-black placeholder:text-brand-muted focus:outline-none"
                    />
                    {searchQuery ? (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="p-1 rounded-full hover:bg-neutral-100 text-brand-muted hover:text-brand-black cursor-pointer"
                        title="Clear"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    ) : (
                      <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-semibold text-brand-muted bg-neutral-100 rounded border border-neutral-200">
                        ESC
                      </kbd>
                    )}
                  </form>

                  {/* Search Results Area */}
                  <div data-lenis-prevent className="max-h-[60vh] overflow-y-auto p-3 sm:p-4 space-y-4 overscroll-contain bg-white">
                    {/* Courses Group */}
                    <div>
                      <div className="flex items-center justify-between px-2 mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">
                          {cleanQuery ? 'Matching Courses' : 'Available Courses'}
                        </span>
                        {cleanQuery && filteredCourses.length > 0 && (
                          <span className="text-[10px] font-semibold text-brand-muted">
                            {filteredCourses.length} found
                          </span>
                        )}
                      </div>

                      {searchLoading ? (
                        <div className="p-4 text-center text-xs text-brand-muted">
                          Loading curriculum index...
                        </div>
                      ) : filteredCourses.length > 0 ? (
                        <div className="space-y-1">
                          {filteredCourses.map((c) => (
                            <button
                              key={c._id}
                              onClick={() => handleSelectCourse(c)}
                              className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-brand-lavender/30 transition text-left group cursor-pointer"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-brand-black text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-sm">
                                  <BookOpen className="w-4 h-4 text-brand-lavender" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-brand-black truncate">
                                      {c.title}
                                    </span>
                                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-neutral-100 text-neutral-600">
                                      {c.category}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-brand-muted truncate mt-0.5">
                                    {c.shortDescription}
                                  </p>
                                </div>
                              </div>
                              <ArrowRight className="w-4 h-4 text-brand-muted group-hover:text-brand-black group-hover:translate-x-0.5 transition shrink-0 ml-2" />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-neutral-50 text-center text-xs text-brand-muted">
                          No matching courses found for "{searchQuery}".
                        </div>
                      )}
                    </div>

                    {/* Quick Navigation Group */}
                    {filteredNavLinks.length > 0 && (
                      <div>
                        <div className="px-2 mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">
                            Quick Navigation
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {filteredNavLinks.map((item) => {
                            const Icon = item.icon;
                            return (
                              <button
                                key={item.path}
                                onClick={() => handleSelectNav(item.path)}
                                className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-neutral-100 transition text-left cursor-pointer group text-xs font-semibold text-brand-black"
                              >
                                <Icon className="w-4 h-4 text-brand-muted group-hover:text-brand-black" />
                                <span className="truncate">{item.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="px-4 py-2.5 bg-neutral-50/80 border-t border-neutral-100 flex items-center justify-between text-[11px] text-brand-muted">
                    <span>
                      Press <kbd className="px-1 py-0.5 bg-white rounded border border-neutral-200 font-mono text-[9px] font-semibold text-neutral-700">Enter</kbd> to search full directory
                    </span>
                    <span className="hidden sm:inline">ESC to dismiss</span>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </header>
  );
};

export default Header;

