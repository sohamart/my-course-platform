const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const { getPresignedViewUrl } = require('../services/s3Service');
const path = require('path');

/**
 * @route   GET /api/student/dashboard
 * @desc    Get student dashboard summary
 * @access  Private (Student)
 */
const getDashboard = async (req, res) => {
  try {
    const studentId = req.user._id;
    const isAdminUser = req.user.role === 'admin';

    let activeCourseIds = [];
    let fallbackCourse = null;

    if (isAdminUser) {
      // Admin has universal access to all curriculum tracks (published & preview)
      const allCourses = await Course.find().sort({ createdAt: -1 });
      activeCourseIds = allCourses.map((c) => c._id);
      if (allCourses.length > 0) {
        fallbackCourse = allCourses[0];
      }
    } else {
      // Find all active enrollments for student
      const enrollments = await Enrollment.find({
        studentId,
        status: 'active',
      }).populate('courseId');

      activeCourseIds = enrollments
        .filter((e) => e.courseId && e.courseId.status === 'published')
        .map((e) => e.courseId._id);

      if (enrollments.length > 0 && enrollments[0].courseId) {
        fallbackCourse = enrollments[0].courseId;
      }
    }

    // Get progress records for active courses
    const allProgress = await Progress.find({
      studentId,
      courseId: { $in: activeCourseIds },
    });

    const completedLessonsCount = allProgress.filter((p) => p.isCompleted).length;
    const totalWatchTime = allProgress.reduce((acc, curr) => acc + (curr.watchTime || 0), 0);

    // Total lessons in active courses
    const totalLessonsCount = await Lesson.countDocuments({
      courseId: { $in: activeCourseIds },
    });

    const overallProgressPercent =
      totalLessonsCount > 0
        ? Math.min(100, Math.round((completedLessonsCount / totalLessonsCount) * 100))
        : 0;

    // Find most recently watched lesson or active course for "Continue Learning"
    let continueLearning = null;
    const latestProgress = await Progress.findOne({
      studentId,
      courseId: { $in: activeCourseIds },
    })
      .sort({ lastWatchedAt: -1 })
      .populate('courseId')
      .populate('lessonId');

    if (latestProgress && latestProgress.courseId && latestProgress.lessonId) {
      // Calculate progress of this specific course
      const courseLessons = await Lesson.countDocuments({ courseId: latestProgress.courseId._id });
      const courseCompleted = allProgress.filter(
        (p) => p.courseId.toString() === latestProgress.courseId._id.toString() && p.isCompleted
      ).length;

      const courseProgressPct = courseLessons > 0 ? Math.round((courseCompleted / courseLessons) * 100) : 0;

      continueLearning = {
        courseId: latestProgress.courseId._id,
        courseTitle: latestProgress.courseId.title,
        chapter: latestProgress.lessonId.chapter || 'Introduction',
        lessonId: latestProgress.lessonId._id,
        lessonTitle: latestProgress.lessonId.title,
        progressPercent: courseProgressPct,
        status: courseProgressPct === 100 ? 'Completed' : 'In Progress',
      };
    } else if (fallbackCourse) {
      // Fallback to first course in catalog
      const firstLesson = await Lesson.findOne({ courseId: fallbackCourse._id }).sort({ order: 1 });

      continueLearning = {
        courseId: fallbackCourse._id,
        courseTitle: fallbackCourse.title,
        chapter: firstLesson ? firstLesson.chapter : 'General',
        lessonId: firstLesson ? firstLesson._id : null,
        lessonTitle: firstLesson ? firstLesson.title : 'Welcome',
        progressPercent: 0,
        status: 'Not Started',
      };
    }

    return res.status(200).json({
      success: true,
      data: {
        activeCoursesCount: activeCourseIds.length,
        completedLessonsCount,
        totalLessonsCount,
        overallProgressPercent,
        totalWatchHours: (totalWatchTime / 3600).toFixed(1),
        continueLearning,
      },
    });
  } catch (error) {
    console.error('Student Dashboard Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load dashboard data.',
    });
  }
};

/**
 * @route   GET /api/student/courses
 * @desc    Get all courses assigned to this student
 * @access  Private (Student)
 */
const getMyCourses = async (req, res) => {
  try {
    const studentId = req.user._id;
    const isAdminUser = req.user.role === 'admin';

    let coursesList = [];

    if (isAdminUser) {
      // Admin has universal access to all courses in student view
      const allCourses = await Course.find().sort({ createdAt: -1 });
      coursesList = allCourses.map((c) => ({
        course: c,
        assignedAt: c.createdAt,
      }));
    } else {
      const enrollments = await Enrollment.find({
        studentId,
        status: 'active',
      })
        .sort({ assignedAt: -1 })
        .populate('courseId');

      coursesList = enrollments
        .filter((e) => e.courseId && e.courseId.status === 'published')
        .map((e) => ({
          course: e.courseId,
          assignedAt: e.assignedAt,
        }));
    }

    const coursesWithProgress = await Promise.all(
      coursesList.map(async ({ course, assignedAt }) => {
        // Count lessons
        const totalLessons = await Lesson.countDocuments({ courseId: course._id });

        // Count completed lessons
        const completedLessons = await Progress.countDocuments({
          studentId,
          courseId: course._id,
          isCompleted: true,
        });

        const progressPercent =
          totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        // Generate Presigned URL for thumbnail
        let thumbnailUrl = null;
        if (course.thumbnailKey) {
          thumbnailUrl = await getPresignedViewUrl(course.thumbnailKey, { expiresIn: 7200 });
        }

        return {
          _id: course._id,
          title: course.title,
          shortDescription: course.shortDescription,
          category: course.category,
          thumbnailKey: course.thumbnailKey,
          thumbnailUrl,
          totalDuration: course.totalDuration,
          lessonsCount: totalLessons,
          completedLessons,
          progressPercent,
          assignedAt,
        };
      })
    );

    return res.status(200).json({
      success: true,
      courses: coursesWithProgress,
    });
  } catch (error) {
    console.error('Get My Courses Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch assigned courses.',
    });
  }
};

/**
 * @route   GET /api/student/courses/:courseId
 * @desc    Get course syllabus & chapters for enrolled student
 * @access  Private (Student with enrollment)
 */
const getCourseDetails = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { courseId } = req.params;

    // Enrollment checked via requireCourseEnrollment middleware
    const course = req.course;

    // Fetch all lessons for this course
    const lessons = await Lesson.find({ courseId: course._id }).sort({ order: 1 });

    // Fetch student's progress for each lesson
    const progressList = await Progress.find({
      studentId,
      courseId: course._id,
    });

    const progressMap = new Map();
    progressList.forEach((p) => {
      progressMap.set(p.lessonId.toString(), {
        isCompleted: p.isCompleted,
        watchTime: p.watchTime,
        lastWatchedAt: p.lastWatchedAt,
      });
    });

    // Group lessons by Chapter
    const chaptersMap = new Map();
    lessons.forEach((lesson) => {
      const chapterName = lesson.chapter || 'General';
      if (!chaptersMap.has(chapterName)) {
        chaptersMap.set(chapterName, []);
      }

      const lessonProgress = progressMap.get(lesson._id.toString()) || {
        isCompleted: false,
        watchTime: 0,
      };

      chaptersMap.get(chapterName).push({
        _id: lesson._id,
        title: lesson.title,
        description: lesson.description,
        order: lesson.order,
        duration: lesson.videoDuration,
        hasVideo: !!lesson.videoKey,
        notesCount: lesson.notes ? lesson.notes.length : 0,
        isPreview: lesson.isPreview,
        isCompleted: lessonProgress.isCompleted,
        watchTime: lessonProgress.watchTime,
      });
    });

    const chapters = Array.from(chaptersMap.entries()).map(([name, lessonItems]) => ({
      name,
      lessons: lessonItems,
    }));

    let thumbnailUrl = null;
    if (course.thumbnailKey) {
      thumbnailUrl = await getPresignedViewUrl(course.thumbnailKey, { expiresIn: 7200 });
    }

    const completedCount = progressList.filter((p) => p.isCompleted).length;
    const progressPercent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

    return res.status(200).json({
      success: true,
      course: {
        _id: course._id,
        title: course.title,
        shortDescription: course.shortDescription,
        detailedDescription: course.detailedDescription,
        category: course.category,
        thumbnailUrl,
        totalDuration: course.totalDuration,
        lessonsCount: lessons.length,
        completedCount,
        progressPercent,
        chapters,
      },
    });
  } catch (error) {
    console.error('Get Course Details Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch course details.',
    });
  }
};

/**
 * @route   GET /api/student/lessons/:id/access
 * @desc    Get secure playback URL & PDF notes access
 * @access  Private (Student with enrollment or Admin)
 */
const getLessonAccess = async (req, res) => {
  try {
    const lesson = req.lesson; // Injected by requireLessonEnrollment
    const studentId = req.user._id;

    // Generate short-lived presigned video streaming URL with inline range disposition
    let videoUrl = null;
    if (lesson.videoKey) {
      const ext = path.extname(lesson.videoKey).toLowerCase();
      const contentType =
        ext === '.webm' ? 'video/webm' : ext === '.mov' ? 'video/quicktime' : 'video/mp4';
      videoUrl = await getPresignedViewUrl(lesson.videoKey, {
        expiresIn: 7200,
        inline: true,
        contentType,
      });
    }

    // Generate presigned URLs for PDF notes with Content-Disposition inline for secure in-browser viewing
    const notesWithUrls = await Promise.all(
      (lesson.notes || []).map(async (note) => {
        const viewUrl = await getPresignedViewUrl(note.key, {
          expiresIn: 3600,
          inline: true,
          contentType: 'application/pdf',
        });
        return {
          _id: note._id,
          name: note.name,
          size: note.size,
          viewUrl,
        };
      })
    );

    // Get current progress for this lesson
    let lessonProgress = await Progress.findOne({
      studentId,
      lessonId: lesson._id,
    });

    return res.status(200).json({
      success: true,
      lesson: {
        _id: lesson._id,
        courseId: lesson.courseId,
        title: lesson.title,
        description: lesson.description,
        chapter: lesson.chapter,
        order: lesson.order,
        duration: lesson.videoDuration,
        videoUrl,
        notes: notesWithUrls,
        isCompleted: lessonProgress ? lessonProgress.isCompleted : false,
        watchTime: lessonProgress ? lessonProgress.watchTime : 0,
      },
    });
  } catch (error) {
    console.error('Get Lesson Access Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate secure media access.',
    });
  }
};

/**
 * @route   POST /api/student/progress
 * @desc    Record or update lesson progress & completion
 * @access  Private (Student)
 */
const updateProgress = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { courseId, lessonId, isCompleted, watchTime } = req.body;

    if (!courseId || !lessonId) {
      return res.status(400).json({
        success: false,
        message: 'courseId and lessonId are required.',
      });
    }

    // Verify student is enrolled
    if (req.user.role !== 'admin') {
      const enrollment = await Enrollment.findOne({
        studentId,
        courseId,
        status: 'active',
      });

      if (!enrollment) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are not enrolled in this course.',
        });
      }
    }

    let progress = await Progress.findOne({ studentId, lessonId });

    if (!progress) {
      progress = new Progress({
        studentId,
        courseId,
        lessonId,
        isCompleted: !!isCompleted,
        watchTime: watchTime || 0,
        completedAt: isCompleted ? new Date() : null,
        lastWatchedAt: new Date(),
      });
    } else {
      if (watchTime !== undefined) progress.watchTime = watchTime;
      if (isCompleted !== undefined) {
        progress.isCompleted = isCompleted;
        if (isCompleted && !progress.completedAt) {
          progress.completedAt = new Date();
        }
      }
      progress.lastWatchedAt = new Date();
    }

    await progress.save();

    // Recalculate course completion percentage
    const totalLessons = await Lesson.countDocuments({ courseId });
    const completedLessons = await Progress.countDocuments({
      studentId,
      courseId,
      isCompleted: true,
    });

    const courseProgressPercent =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return res.status(200).json({
      success: true,
      message: 'Progress updated successfully.',
      data: {
        isCompleted: progress.isCompleted,
        watchTime: progress.watchTime,
        courseProgressPercent,
      },
    });
  } catch (error) {
    console.error('Update Progress Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update progress.',
    });
  }
};

/**
 * @route   GET /api/student/progress
 * @desc    Get detailed progress across all enrolled courses
 * @access  Private (Student)
 */
const getMyProgress = async (req, res) => {
  try {
    const studentId = req.user._id;
    const isAdminUser = req.user.role === 'admin';

    let validCourses = [];

    if (isAdminUser) {
      validCourses = await Course.find().sort({ createdAt: -1 });
    } else {
      const enrollments = await Enrollment.find({
        studentId,
        status: 'active',
      }).populate('courseId');

      validCourses = enrollments
        .filter((e) => e.courseId && e.courseId.status === 'published')
        .map((e) => e.courseId);
    }

    const progressDetails = await Promise.all(
      validCourses.map(async (course) => {
        const totalLessons = await Lesson.countDocuments({ courseId: course._id });
        const lessonProgress = await Progress.find({
          studentId,
          courseId: course._id,
        }).populate('lessonId');

        const completedCount = lessonProgress.filter((p) => p.isCompleted).length;
        const totalTime = lessonProgress.reduce((sum, p) => sum + (p.watchTime || 0), 0);

        return {
          courseId: course._id,
          courseTitle: course.title,
          category: course.category,
          totalLessons,
          completedLessons: completedCount,
          percent: totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0,
          totalTimeMinutes: Math.round(totalTime / 60),
        };
      })
    );

    return res.status(200).json({
      success: true,
      progress: progressDetails,
    });
  } catch (error) {
    console.error('Get My Progress Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve progress data.',
    });
  }
};

module.exports = {
  getDashboard,
  getMyCourses,
  getCourseDetails,
  getLessonAccess,
  updateProgress,
  getMyProgress,
};

