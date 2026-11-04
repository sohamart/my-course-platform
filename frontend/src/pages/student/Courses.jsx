import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, BookOpen, X, Sparkles, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import LiquidBackground from '../../components/effects/LiquidBackground';
import Header from '../../components/layout/Header';
import CourseCard from '../../components/dashboard/CourseCard';
import BottomNavigation from '../../components/layout/BottomNavigation';
import DatabaseErrorAlert from '../../components/common/DatabaseErrorAlert';
import TeacherContactModal from '../../components/common/TeacherContactModal';

const Courses = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get('q') || searchParams.get('search') || ''
  );
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('cat') || 'All'
  );

  // Sync URL search params
  useEffect(() => {
    const q = searchParams.get('q') || searchParams.get('search');
    if (q !== null && q !== undefined) {
      setSearchTerm(q);
    }
  }, [searchParams]);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/student/courses');
      if (res.data && res.data.success) {
        setCourses(res.data.courses || []);
      } else {
        throw new Error(res.data?.message || 'Database connection error');
      }
    } catch (err) {
      console.error('Failed to load courses:', err);
      setError(
        err.response?.data?.message ||
          'Not connected to database. Please contact developer.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const categories = ['All', ...new Set(courses.map((c) => c.category).filter(Boolean))];

  const filteredCourses = courses.filter((c) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
    if (!term) return matchesCategory;

    const title = (c.title || '').toLowerCase();
    const shortDesc = (c.shortDescription || '').toLowerCase();
    const detailDesc = (c.detailedDescription || '').toLowerCase();
    const cat = (c.category || '').toLowerCase();

    const matchesSearch =
      title.includes(term) ||
      shortDesc.includes(term) ||
      detailDesc.includes(term) ||
      cat.includes(term);

    return matchesSearch && matchesCategory;
  });

  const handleClearSearch = () => {
    setSearchTerm('');
    if (searchParams.get('q') || searchParams.get('search')) {
      searchParams.delete('q');
      searchParams.delete('search');
      setSearchParams(searchParams);
    }
  };

  return (
    <LiquidBackground>
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28">
        {/* Page Title Header */}
        <div className="mb-8">
          <span className="text-[11px] font-bold uppercase tracking-widest text-brand-muted">
            CURRICULUM ACCESS
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-black brand-title mt-0.5">
            My Courses
          </h1>
          <p className="text-xs sm:text-sm text-brand-muted mt-1 max-w-2xl">
            Access your authorized learning tracks, watch high-definition video modules, and read course notes directly in your space.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-brand-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search course titles, keywords, topics..."
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl glass-card border border-white/80 text-xs sm:text-sm text-brand-black placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-black/20 shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-neutral-200/60 transition text-brand-muted hover:text-brand-black"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Categories Horizontal Pills */}
          <div data-lenis-prevent className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none overscroll-contain">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-brand-black text-white shadow-sm'
                    : 'glass-card border border-white/80 text-brand-muted hover:text-brand-black hover:bg-white/90'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Search Results Metadata */}
        {(searchTerm || selectedCategory !== 'All') && (
          <div className="flex items-center justify-between mb-4 px-1">
            <span className="text-xs text-brand-muted font-medium">
              Showing <strong className="text-brand-black">{filteredCourses.length}</strong> of {courses.length} courses
              {searchTerm && <span> matching "<span className="text-brand-black font-semibold">{searchTerm}</span>"</span>}
            </span>
            {(searchTerm || selectedCategory !== 'All') && (
              <button
                onClick={() => {
                  handleClearSearch();
                  setSelectedCategory('All');
                }}
                className="text-xs text-brand-black font-bold hover:underline"
              >
                Reset filters
              </button>
            )}
          </div>
        )}

        {/* Courses Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-72 rounded-[28px] glass-card animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="max-w-xl mx-auto">
            <DatabaseErrorAlert message={error} onRetry={fetchCourses} />
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="p-12 rounded-[28px] glass-card border border-white/80 text-center max-w-lg mx-auto space-y-4">
            <BookOpen className="w-12 h-12 text-brand-muted mx-auto" />
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
        ) : (
          <div className="p-12 rounded-[28px] glass-card border border-white/80 text-center max-w-lg mx-auto">
            <BookOpen className="w-12 h-12 text-brand-muted mx-auto mb-3" />
            <h3 className="text-base font-bold text-brand-black">No Courses Found</h3>
            <p className="text-xs text-brand-muted mt-1">
              Try adjusting your search criteria or explore another category.
            </p>
          </div>
        )}
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

export default Courses;

