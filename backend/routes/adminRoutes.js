const express = require('express');
const router = express.Router();
const {
  getDashboardOverview,
  getAllCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseLessons,
  createLesson,
  updateLesson,
  deleteLesson,
  getAllStudents,
  grantCourseAccess,
  revokeCourseAccess,
  getAllEnrollments,
  toggleStudentStatus,
  getMediaLibrary,
} = require('../controllers/adminController');
const { authenticateJWT, requireAdmin } = require('../middleware/auth');

// All admin routes strictly require authentication and Admin role
router.use(authenticateJWT, requireAdmin);

// Dashboard overview
router.get('/dashboard', getDashboardOverview);

// Reusable Media Library (Videos & PDF Notes across courses)
router.get('/media-library', getMediaLibrary);

// Course Management
router.get('/courses', getAllCourses);
router.post('/courses', createCourse);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);

// Lesson Management
router.get('/courses/:courseId/lessons', getCourseLessons);
router.post('/courses/:courseId/lessons', createLesson);
router.put('/lessons/:id', updateLesson);
router.delete('/lessons/:id', deleteLesson);

// Student Management
router.get('/students', getAllStudents);
router.put('/students/:id/status', toggleStudentStatus);

// Enrollment Management
router.get('/enrollments', getAllEnrollments);
router.post('/enrollments', grantCourseAccess);
router.delete('/enrollments/:id', revokeCourseAccess);

module.exports = router;

