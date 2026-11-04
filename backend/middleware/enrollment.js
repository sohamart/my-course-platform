const Enrollment = require('../models/Enrollment');
const Lesson = require('../models/Lesson');
const Course = require('../models/Course');

const requireCourseEnrollment = (courseIdParamName = 'courseId') => {
  return async (req, res, next) => {
    try {
      const courseId = req.params[courseIdParamName] || req.body.courseId;

      if (!courseId) {
        return res.status(400).json({
          success: false,
          message: 'Course ID is required.',
        });
      }

      // Admin has universal access
      if (req.user && req.user.role === 'admin') {
        const course = await Course.findById(courseId);
        if (!course) {
          return res.status(404).json({
            success: false,
            message: 'Course not found.',
          });
        }
        req.course = course;
        return next();
      }

      // Check course existence
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found.',
        });
      }

      // Verify active student enrollment
      const enrollment = await Enrollment.findOne({
        studentId: req.user._id,
        courseId,
        status: 'active',
      });

      if (!enrollment) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are not enrolled in this course or your access has been revoked.',
        });
      }

      req.course = course;
      req.enrollment = enrollment;
      next();
    } catch (error) {
      console.error('Course Enrollment Middleware Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error verifying course authorization.',
      });
    }
  };
};

const requireLessonEnrollment = async (req, res, next) => {
  try {
    const lessonId = req.params.id || req.params.lessonId;

    if (!lessonId) {
      return res.status(400).json({
        success: false,
        message: 'Lesson ID is required.',
      });
    }

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found.',
      });
    }

    // Admin has universal access
    if (req.user && req.user.role === 'admin') {
      req.lesson = lesson;
      req.courseId = lesson.courseId;
      return next();
    }

    // If lesson has preview enabled, students can view
    if (lesson.isPreview) {
      req.lesson = lesson;
      req.courseId = lesson.courseId;
      return next();
    }

    // Verify student has active enrollment for the course containing this lesson
    const enrollment = await Enrollment.findOne({
      studentId: req.user._id,
      courseId: lesson.courseId,
      status: 'active',
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have active access to the course for this lesson.',
      });
    }

    req.lesson = lesson;
    req.courseId = lesson.courseId;
    req.enrollment = enrollment;
    next();
  } catch (error) {
    console.error('Lesson Enrollment Middleware Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying lesson authorization.',
    });
  }
};

module.exports = {
  requireCourseEnrollment,
  requireLessonEnrollment,
};

