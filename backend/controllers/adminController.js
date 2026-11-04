const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const { getPresignedViewUrl, deleteMediaObject, getS3Status } = require('../services/s3Service');

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get metrics, stats, recent activities
 * @access  Private (Admin)
 */
const getDashboardOverview = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalCourses = await Course.countDocuments();
    const publishedCourses = await Course.countDocuments({ status: 'published' });
    const totalLessons = await Lesson.countDocuments();
    const activeEnrollments = await Enrollment.countDocuments({ status: 'active' });

    // Calculate approximate storage usage from Lesson records
    const lessons = await Lesson.find().select('videoSize notes');
    let totalStorageBytes = 0;
    let totalVideosCount = 0;
    let totalNotesCount = 0;

    lessons.forEach((l) => {
      if (l.videoSize) {
        totalStorageBytes += l.videoSize;
        totalVideosCount += 1;
      }
      if (l.notes && l.notes.length > 0) {
        l.notes.forEach((n) => {
          totalStorageBytes += n.size || 0;
          totalNotesCount += 1;
        });
      }
    });

    // Recent registered students with S3 avatars
    const rawRecentStudents = await User.find({ role: 'student' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email avatar createdAt isActive');

    const recentStudents = await Promise.all(
      rawRecentStudents.map(async (st) => {
        let avatarUrl = null;
        if (st.avatar) {
          avatarUrl = await getPresignedViewUrl(st.avatar, { expiresIn: 86400 });
        }
        return {
          _id: st._id,
          name: st.name,
          email: st.email,
          avatarUrl,
          createdAt: st.createdAt,
          isActive: st.isActive,
        };
      })
    );

    // Recent enrollments with student S3 avatars
    const rawRecentEnrollments = await Enrollment.find({ status: 'active' })
      .sort({ assignedAt: -1 })
      .limit(6)
      .populate('studentId', 'name email avatar')
      .populate('courseId', 'title category');

    const recentEnrollments = await Promise.all(
      rawRecentEnrollments.map(async (enr) => {
        let avatarUrl = null;
        if (enr.studentId && enr.studentId.avatar) {
          avatarUrl = await getPresignedViewUrl(enr.studentId.avatar, { expiresIn: 86400 });
        }
        return {
          _id: enr._id,
          studentId: enr.studentId
            ? {
                _id: enr.studentId._id,
                name: enr.studentId.name,
                email: enr.studentId.email,
                avatarUrl,
              }
            : null,
          courseId: enr.courseId,
          assignedAt: enr.assignedAt,
        };
      })
    );

    const s3Status = getS3Status();

    return res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        totalCourses,
        publishedCourses,
        totalLessons,
        activeEnrollments,
        totalStorageBytes,
        totalStorageMB: (totalStorageBytes / (1024 * 1024)).toFixed(2),
        totalVideosCount,
        totalNotesCount,
      },
      s3Status,
      recentStudents,
      recentEnrollments,
    });
  } catch (error) {
    console.error('Admin Dashboard Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin dashboard stats.',
    });
  }
};

/**
 * @route   GET /api/admin/courses
 * @desc    Get all courses with lesson & enrollment counts
 * @access  Private (Admin)
 */
const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });

    const enrichedCourses = await Promise.all(
      courses.map(async (c) => {
        const lessonsCount = await Lesson.countDocuments({ courseId: c._id });
        const enrolledStudentsCount = await Enrollment.countDocuments({
          courseId: c._id,
          status: 'active',
        });

        let thumbnailUrl = null;
        if (c.thumbnailKey) {
          thumbnailUrl = await getPresignedViewUrl(c.thumbnailKey, { expiresIn: 7200 });
        }

        return {
          ...c.toObject(),
          lessonsCount,
          enrolledStudentsCount,
          thumbnailUrl,
        };
      })
    );

    return res.status(200).json({
      success: true,
      courses: enrichedCourses,
    });
  } catch (error) {
    console.error('Get All Courses Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch courses.',
    });
  }
};

/**
 * @route   POST /api/admin/courses
 * @desc    Create a new course
 * @access  Private (Admin)
 */
const createCourse = async (req, res) => {
  try {
    const { title, shortDescription, detailedDescription, category, thumbnailKey, status } = req.body;

    if (!title || !shortDescription || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title, short description, and category are required.',
      });
    }

    const course = await Course.create({
      title: title.trim(),
      shortDescription: shortDescription.trim(),
      detailedDescription: detailedDescription ? detailedDescription.trim() : '',
      category: category.trim(),
      thumbnailKey: thumbnailKey || '',
      status: status || 'draft',
      createdBy: req.user._id,
    });

    let thumbnailUrl = null;
    if (course.thumbnailKey) {
      thumbnailUrl = await getPresignedViewUrl(course.thumbnailKey, { expiresIn: 7200 });
    }

    return res.status(201).json({
      success: true,
      message: 'Course created successfully.',
      course: {
        ...course.toObject(),
        thumbnailUrl,
      },
    });
  } catch (error) {
    console.error('Create Course Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create course.',
    });
  }
};

/**
 * @route   PUT /api/admin/courses/:id
 * @desc    Update course details
 * @access  Private (Admin)
 */
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, shortDescription, detailedDescription, category, thumbnailKey, status } = req.body;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.',
      });
    }

    if (title) course.title = title.trim();
    if (shortDescription) course.shortDescription = shortDescription.trim();
    if (detailedDescription !== undefined) course.detailedDescription = detailedDescription.trim();
    if (category) course.category = category.trim();
    if (status) course.status = status;

    // If thumbnail changed, delete old one from S3 and local storage
    const newThumbnailKey = thumbnailKey !== undefined ? thumbnailKey : req.body.thumbnail;
    if (newThumbnailKey !== undefined && newThumbnailKey !== course.thumbnailKey) {
      if (course.thumbnailKey) {
        await deleteMediaObject(course.thumbnailKey);
        console.log(`🗑️ Deleted old course thumbnail from S3: ${course.thumbnailKey}`);
      }
      course.thumbnailKey = newThumbnailKey;
    }

    await course.save();

    let thumbnailUrl = null;
    if (course.thumbnailKey) {
      thumbnailUrl = await getPresignedViewUrl(course.thumbnailKey, { expiresIn: 7200 });
    }

    return res.status(200).json({
      success: true,
      message: 'Course updated successfully.',
      course: {
        ...course.toObject(),
        thumbnailUrl,
      },
    });
  } catch (error) {
    console.error('Update Course Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update course.',
    });
  }
};

/**
 * @route   DELETE /api/admin/courses/:id
 * @desc    Delete course and cascade delete lessons, enrollments, media
 * @access  Private (Admin)
 */
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.',
      });
    }

    // 1. Delete course thumbnail
    if (course.thumbnailKey) {
      await deleteMediaObject(course.thumbnailKey);
    }

    // 2. Find and delete all lesson media (only if not referenced by another course)
    const lessons = await Lesson.find({ courseId: id });
    for (const l of lessons) {
      if (l.videoKey) {
        const stillUsed = await Lesson.exists({
          courseId: { $ne: id },
          videoKey: l.videoKey,
        });
        if (!stillUsed) {
          await deleteMediaObject(l.videoKey);
        }
      }
      if (l.notes && l.notes.length > 0) {
        for (const n of l.notes) {
          if (n.key) {
            const stillUsed = await Lesson.exists({
              courseId: { $ne: id },
              'notes.key': n.key,
            });
            if (!stillUsed) {
              await deleteMediaObject(n.key);
            }
          }
        }
      }
    }

    // 3. Delete lessons, enrollments, progress
    await Lesson.deleteMany({ courseId: id });
    await Enrollment.deleteMany({ courseId: id });
    await Progress.deleteMany({ courseId: id });

    // 4. Delete course
    await course.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Course and all associated content deleted successfully.',
    });
  } catch (error) {
    console.error('Delete Course Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete course.',
    });
  }
};

/**
 * @route   GET /api/admin/courses/:courseId/lessons
 * @desc    Get all lessons for a course (Admin view with direct media keys)
 * @access  Private (Admin)
 */
const getCourseLessons = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.',
      });
    }

    const lessons = await Lesson.find({ courseId }).sort({ order: 1 });

    const lessonsWithUrls = await Promise.all(
      lessons.map(async (l) => {
        let videoUrl = null;
        if (l.videoKey) {
          videoUrl = await getPresignedViewUrl(l.videoKey, { expiresIn: 3600 });
        }

        const notesWithUrls = await Promise.all(
          (l.notes || []).map(async (n) => ({
            _id: n._id,
            name: n.name,
            size: n.size,
            key: n.key,
            url: await getPresignedViewUrl(n.key, { expiresIn: 3600, inline: true }),
          }))
        );

        return {
          ...l.toObject(),
          videoUrl,
          notes: notesWithUrls,
        };
      })
    );

    return res.status(200).json({
      success: true,
      course,
      lessons: lessonsWithUrls,
    });
  } catch (error) {
    console.error('Get Course Lessons Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch lessons.',
    });
  }
};

/**
 * @route   POST /api/admin/courses/:courseId/lessons
 * @desc    Create a lesson in a course
 * @access  Private (Admin)
 */
const createLesson = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, chapter, order, videoKey, videoDuration, videoSize, notes, isPreview } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.',
      });
    }

    // Determine order if not specified
    let lessonOrder = order;
    if (lessonOrder === undefined || lessonOrder === null) {
      const highest = await Lesson.findOne({ courseId }).sort({ order: -1 });
      lessonOrder = highest ? highest.order + 1 : 1;
    }

    const lesson = await Lesson.create({
      courseId,
      title: title.trim(),
      description: description ? description.trim() : '',
      chapter: chapter ? chapter.trim() : 'General',
      order: lessonOrder,
      videoKey: videoKey || '',
      videoDuration: Number(videoDuration) || 0,
      videoSize: Number(videoSize) || 0,
      notes: notes || [],
      isPreview: !!isPreview,
    });

    // Update course metadata
    const lessonsCount = await Lesson.countDocuments({ courseId });
    const allCourseLessons = await Lesson.find({ courseId }).select('videoDuration');
    const totalDuration = allCourseLessons.reduce((sum, l) => sum + (l.videoDuration || 0), 0);

    course.lessonsCount = lessonsCount;
    course.totalDuration = totalDuration;
    await course.save();

    return res.status(201).json({
      success: true,
      message: 'Lesson created successfully.',
      lesson,
    });
  } catch (error) {
    console.error('Create Lesson Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create lesson.',
    });
  }
};

/**
 * @route   PUT /api/admin/lessons/:id
 * @desc    Update a lesson
 * @access  Private (Admin)
 */
const updateLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, chapter, order, videoKey, videoDuration, videoSize, notes, isPreview } = req.body;

    const lesson = await Lesson.findById(id);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found.',
      });
    }

    if (title) lesson.title = title.trim();
    if (description !== undefined) lesson.description = description.trim();
    if (chapter) lesson.chapter = chapter.trim();
    if (order !== undefined) lesson.order = order;
    if (videoDuration !== undefined) lesson.videoDuration = Number(videoDuration);
    if (videoSize !== undefined) lesson.videoSize = Number(videoSize);
    if (isPreview !== undefined) lesson.isPreview = !!isPreview;

    // If video changed, delete old video ONLY if not used in other lessons
    if (videoKey !== undefined && videoKey !== lesson.videoKey) {
      if (lesson.videoKey) {
        const stillUsed = await Lesson.exists({
          _id: { $ne: lesson._id },
          videoKey: lesson.videoKey,
        });
        if (!stillUsed) {
          await deleteMediaObject(lesson.videoKey);
          console.log(`🗑️ Deleted old lesson video from S3: ${lesson.videoKey}`);
        }
      }
      lesson.videoKey = videoKey;
    }

    // If notes updated, find and delete any removed PDF notes from S3
    if (notes !== undefined) {
      const oldNotes = lesson.notes || [];
      const newKeys = new Set((notes || []).map((n) => n.key).filter(Boolean));

      for (const oldNote of oldNotes) {
        if (oldNote.key && !newKeys.has(oldNote.key)) {
          const stillUsed = await Lesson.exists({
            _id: { $ne: lesson._id },
            'notes.key': oldNote.key,
          });
          if (!stillUsed) {
            await deleteMediaObject(oldNote.key);
            console.log(`🗑️ Deleted removed PDF note from S3: ${oldNote.key}`);
          }
        }
      }
      lesson.notes = notes;
    }

    await lesson.save();

    // Recalculate total duration of course
    const allCourseLessons = await Lesson.find({ courseId: lesson.courseId }).select('videoDuration');
    const totalDuration = allCourseLessons.reduce((sum, l) => sum + (l.videoDuration || 0), 0);
    await Course.findByIdAndUpdate(lesson.courseId, { totalDuration });

    return res.status(200).json({
      success: true,
      message: 'Lesson updated successfully.',
      lesson,
    });
  } catch (error) {
    console.error('Update Lesson Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update lesson.',
    });
  }
};

/**
 * @route   DELETE /api/admin/lessons/:id
 * @desc    Delete a lesson and its media
 * @access  Private (Admin)
 */
const deleteLesson = async (req, res) => {
  try {
    const { id } = req.params;

    const lesson = await Lesson.findById(id);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found.',
      });
    }

    const courseId = lesson.courseId;

    // Delete video & notes from S3 ONLY if no other lesson references them
    if (lesson.videoKey) {
      const stillUsed = await Lesson.exists({
        _id: { $ne: id },
        videoKey: lesson.videoKey,
      });
      if (!stillUsed) {
        await deleteMediaObject(lesson.videoKey);
      }
    }
    if (lesson.notes && lesson.notes.length > 0) {
      for (const n of lesson.notes) {
        if (n.key) {
          const stillUsed = await Lesson.exists({
            _id: { $ne: id },
            'notes.key': n.key,
          });
          if (!stillUsed) {
            await deleteMediaObject(n.key);
          }
        }
      }
    }

    // Delete progress records for this lesson
    await Progress.deleteMany({ lessonId: id });

    // Delete lesson
    await lesson.deleteOne();

    // Update course metadata
    const lessonsCount = await Lesson.countDocuments({ courseId });
    const allCourseLessons = await Lesson.find({ courseId }).select('videoDuration');
    const totalDuration = allCourseLessons.reduce((sum, l) => sum + (l.videoDuration || 0), 0);
    await Course.findByIdAndUpdate(courseId, { lessonsCount, totalDuration });

    return res.status(200).json({
      success: true,
      message: 'Lesson deleted successfully.',
    });
  } catch (error) {
    console.error('Delete Lesson Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete lesson.',
    });
  }
};

/**
 * @route   GET /api/admin/students
 * @desc    Get all registered students with enrollment counts
 * @access  Private (Admin)
 */
const getAllStudents = async (req, res) => {
  try {
    const { search, status } = req.query;

    const query = { role: 'student' };

    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    const students = await User.find(query).sort({ createdAt: -1 });

    const enrichedStudents = await Promise.all(
      students.map(async (st) => {
        let avatarUrl = null;
        if (st.avatar) {
          avatarUrl = await getPresignedViewUrl(st.avatar, { expiresIn: 86400 });
        }

        const enrollments = await Enrollment.find({
          studentId: st._id,
          status: 'active',
        }).populate('courseId', 'title category');

        const activeCourses = enrollments
          .filter((e) => e.courseId)
          .map((e) => ({
            enrollmentId: e._id,
            courseId: e.courseId._id,
            title: e.courseId.title,
            category: e.courseId.category,
            assignedAt: e.assignedAt,
          }));

        return {
          _id: st._id,
          name: st.name,
          email: st.email,
          avatarUrl,
          isActive: st.isActive,
          createdAt: st.createdAt,
          lastLogin: st.lastLogin,
          activeCoursesCount: activeCourses.length,
          courses: activeCourses,
        };
      })
    );

    return res.status(200).json({
      success: true,
      students: enrichedStudents,
    });
  } catch (error) {
    console.error('Get All Students Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch students.',
    });
  }
};

/**
 * @route   POST /api/admin/enrollments
 * @desc    Grant course access to a student (bulk courseIds supported)
 * @access  Private (Admin)
 */
const grantCourseAccess = async (req, res) => {
  try {
    const { studentId, courseIds } = req.body;

    if (!studentId || !courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a studentId and an array of courseIds.',
      });
    }

    const student = await User.findOne({ _id: studentId, role: 'student' });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.',
      });
    }

    const results = [];

    for (const courseId of courseIds) {
      const course = await Course.findById(courseId);
      if (!course) continue;

      // Upsert enrollment
      const enrollment = await Enrollment.findOneAndUpdate(
        { studentId, courseId },
        {
          assignedBy: req.user._id,
          status: 'active',
          assignedAt: new Date(),
          revokedAt: null,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      results.push({
        courseId,
        courseTitle: course.title,
        enrollmentId: enrollment._id,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Granted access to ${results.length} course(s) for ${student.name}.`,
      results,
    });
  } catch (error) {
    console.error('Grant Course Access Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to grant course access.',
    });
  }
};

/**
 * @route   DELETE /api/admin/enrollments/:id
 * @desc    Revoke student course access immediately
 * @access  Private (Admin)
 */
const revokeCourseAccess = async (req, res) => {
  try {
    const { id } = req.params;

    const enrollment = await Enrollment.findById(id);
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment record not found.',
      });
    }

    enrollment.status = 'revoked';
    enrollment.revokedAt = new Date();
    await enrollment.save();

    return res.status(200).json({
      success: true,
      message: 'Course access revoked successfully.',
      enrollment,
    });
  } catch (error) {
    console.error('Revoke Course Access Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to revoke course access.',
    });
  }
};

/**
 * @route   GET /api/admin/enrollments
 * @desc    Get all enrollments with student and course details
 * @access  Private (Admin)
 */
const getAllEnrollments = async (req, res) => {
  try {
    const rawEnrollments = await Enrollment.find()
      .sort({ assignedAt: -1 })
      .populate('studentId', 'name email avatar isActive')
      .populate('courseId', 'title category status');

    const enrollments = await Promise.all(
      rawEnrollments.map(async (enr) => {
        let avatarUrl = null;
        if (enr.studentId && enr.studentId.avatar) {
          avatarUrl = await getPresignedViewUrl(enr.studentId.avatar, { expiresIn: 86400 });
        }
        return {
          _id: enr._id,
          status: enr.status,
          assignedAt: enr.assignedAt,
          revokedAt: enr.revokedAt,
          studentId: enr.studentId
            ? {
                _id: enr.studentId._id,
                name: enr.studentId.name,
                email: enr.studentId.email,
                isActive: enr.studentId.isActive,
                avatarUrl,
              }
            : null,
          courseId: enr.courseId,
        };
      })
    );

    return res.status(200).json({
      success: true,
      enrollments,
    });
  } catch (error) {
    console.error('Get All Enrollments Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve enrollments.',
    });
  }
};

/**
 * @route   PUT /api/admin/students/:id/status
 * @desc    Toggle student active / inactive status
 * @access  Private (Admin)
 */
const toggleStudentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await User.findOne({ _id: id, role: 'student' });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.',
      });
    }

    student.isActive = !student.isActive;
    await student.save();

    return res.status(200).json({
      success: true,
      message: `Student account ${student.isActive ? 'activated' : 'deactivated'}.`,
      isActive: student.isActive,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update student status.',
    });
  }
};

/**
 * @route   GET /api/admin/media-library
 * @desc    Get all reusable media assets (videos and PDF notes) across existing courses
 * @access  Private (Admin)
 */
const getMediaLibrary = async (req, res) => {
  try {
    const lessons = await Lesson.find()
      .populate('courseId', 'title category status')
      .sort({ createdAt: -1 });

    const videoMap = new Map();
    const noteMap = new Map();

    lessons.forEach((l) => {
      // Collect unique videos
      if (l.videoKey && !videoMap.has(l.videoKey)) {
        videoMap.set(l.videoKey, {
          key: l.videoKey,
          title: l.title,
          courseId: l.courseId?._id,
          courseTitle: l.courseId?.title || 'Unknown Course',
          category: l.courseId?.category || 'General',
          duration: l.videoDuration || 0,
          size: l.videoSize || 0,
          lessonId: l._id,
          lessonTitle: l.title,
          chapter: l.chapter || 'General',
          createdAt: l.createdAt,
        });
      }

      // Collect unique PDF notes
      if (l.notes && l.notes.length > 0) {
        l.notes.forEach((n) => {
          if (n.key && !noteMap.has(n.key)) {
            noteMap.set(n.key, {
              key: n.key,
              name: n.name,
              courseId: l.courseId?._id,
              courseTitle: l.courseId?.title || 'Unknown Course',
              category: l.courseId?.category || 'General',
              size: n.size || 0,
              lessonId: l._id,
              lessonTitle: l.title,
              chapter: l.chapter || 'General',
              uploadedAt: n.uploadedAt || l.createdAt,
            });
          }
        });
      }
    });

    return res.status(200).json({
      success: true,
      videos: Array.from(videoMap.values()),
      notes: Array.from(noteMap.values()),
      totalVideos: videoMap.size,
      totalNotes: noteMap.size,
    });
  } catch (error) {
    console.error('Get Media Library Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve media library.',
    });
  }
};

module.exports = {
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
};

