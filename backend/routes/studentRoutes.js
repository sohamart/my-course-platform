const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getMyCourses,
  getCourseDetails,
  getLessonAccess,
  updateProgress,
  getMyProgress,
} = require('../controllers/studentController');
const { authenticateJWT, requireStudent } = require('../middleware/auth');
const {
  requireCourseEnrollment,
  requireLessonEnrollment,
} = require('../middleware/enrollment');

// All student routes require authentication
router.use(authenticateJWT);

router.get('/dashboard', getDashboard);
router.get('/courses', getMyCourses);
router.get('/courses/:courseId', requireCourseEnrollment('courseId'), getCourseDetails);
router.get('/lessons/:id/access', requireLessonEnrollment, getLessonAccess);
router.post('/progress', updateProgress);
router.get('/progress', getMyProgress);

module.exports = router;

