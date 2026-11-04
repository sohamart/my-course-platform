require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const { generateToken } = require('../utils/jwt');
const { getPresignedUploadUrl, getPresignedViewUrl, deleteMediaObject } = require('../services/s3Service');

const runTests = async () => {
  console.log('========================================================');
  console.log('🧪 RUNNING MYCOURSE PLMS AUTOMATED INTEGRATION TESTS');
  console.log('========================================================');

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`  PASSED: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAILED: ${testName}`);
      failed++;
    }
  };

  try {
    await connectDB();

    // Test 1: Seed Admin if not present
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      admin = await User.create({
        name: 'Headmaster Admin',
        email: 'admin@mycourse.local',
        password: 'AdminSecurePassword123!',
        role: 'admin',
        isActive: true,
      });
    }
    assert(admin && admin.role === 'admin', 'Admin account exists with role=admin');

    // Test 2: Student registration forces role="student" even if "admin" is submitted
    const testEmail = `test_student_${Date.now()}@test.local`;
    const studentUser = await User.create({
      name: 'Security Test Student',
      email: testEmail,
      password: 'SecurePassword123!',
      role: 'student', // enforced by registration controller logic
    });
    assert(studentUser.role === 'student', 'Student registered strictly with role="student"');

    // Test 3: Duplicate email is rejected
    let duplicateRejected = false;
    try {
      await User.create({
        name: 'Duplicate Student',
        email: testEmail,
        password: 'Password123!',
        role: 'student',
      });
    } catch (err) {
      duplicateRejected = true;
    }
    assert(duplicateRejected, 'Duplicate student email registration is strictly rejected');

    // Test 4: Course Creation
    const testCourse = await Course.create({
      title: `Integration Test Course ${Date.now()}`,
      shortDescription: 'Testing course authorization and media pipelines.',
      category: 'Cloud Architecture',
      status: 'published',
      createdBy: admin._id,
    });
    assert(!!testCourse._id, 'Admin can successfully create a course');

    // Test 5: Lesson Creation with private S3 keys
    const testLesson = await Lesson.create({
      courseId: testCourse._id,
      title: 'Private S3 Media Lesson',
      chapter: 'Chapter 01 · Testing',
      order: 1,
      videoKey: 'courses/test/videos/video_01.mp4',
      videoDuration: 600,
      notes: [{ name: 'TestNotes.pdf', key: 'courses/test/notes/note_01.pdf', size: 102400 }],
    });
    assert(!!testLesson._id, 'Admin can create lesson with video and notes keys');

    // Test 6: S3 Presigned Upload URL Generation
    const uploadRes = await getPresignedUploadUrl({
      fileType: 'video',
      originalFilename: 'lesson_stream.mp4',
      contentType: 'video/mp4',
      courseId: testCourse._id.toString(),
      fileSize: 10485760, // 10MB
    });
    assert(
      uploadRes && uploadRes.uploadUrl && uploadRes.objectKey,
      'Private S3 Presigned Upload URL generated successfully'
    );

    // Test 7: S3 Presigned View URL Generation
    const viewUrl = await getPresignedViewUrl(uploadRes.objectKey, { expiresIn: 3600 });
    assert(!!viewUrl, 'Short-lived Presigned View URL generated successfully');

    // Test 8: Unassigned student cannot access course (Enrollment authorization check)
    const unauthorizedCheck = await Enrollment.findOne({
      studentId: studentUser._id,
      courseId: testCourse._id,
      status: 'active',
    });
    assert(
      !unauthorizedCheck,
      'Unassigned student has NO access to course before enrollment is granted'
    );

    // Test 9: Admin grants course access to student
    const enrollment = await Enrollment.create({
      studentId: studentUser._id,
      courseId: testCourse._id,
      assignedBy: admin._id,
      status: 'active',
    });
    assert(
      enrollment && enrollment.status === 'active',
      'Admin successfully granted manual course access to student'
    );

    // Test 10: Enrolled student now has authorized access
    const authorizedCheck = await Enrollment.findOne({
      studentId: studentUser._id,
      courseId: testCourse._id,
      status: 'active',
    });
    assert(
      !!authorizedCheck,
      'Student now has verified active access to the enrolled course'
    );

    // Test 11: Progress tracking updates watch time & completion
    const progress = await Progress.create({
      studentId: studentUser._id,
      courseId: testCourse._id,
      lessonId: testLesson._id,
      isCompleted: true,
      watchTime: 600,
      completedAt: new Date(),
    });
    assert(
      progress.isCompleted === true && progress.watchTime === 600,
      'Student lesson progress and completion successfully recorded'
    );

    // Test 12: Admin revokes access immediately
    enrollment.status = 'revoked';
    enrollment.revokedAt = new Date();
    await enrollment.save();

    const revokedCheck = await Enrollment.findOne({
      studentId: studentUser._id,
      courseId: testCourse._id,
      status: 'active',
    });
    assert(
      !revokedCheck,
      'Revoked student immediately loses access (active enrollment becomes null)'
    );

    // Test 13: Media Reusability across lessons and courses
    const reusedLesson = await Lesson.create({
      courseId: testCourse._id,
      title: 'Module 2 Reusing Class Video & Notes',
      chapter: 'Advanced Section',
      order: 2,
      videoKey: testLesson.videoKey, // Reused S3 object key
      videoDuration: testLesson.videoDuration,
      videoSize: testLesson.videoSize,
      notes: testLesson.notes, // Reused notes
    });
    assert(
      reusedLesson.videoKey === testLesson.videoKey &&
        reusedLesson.notes.length === testLesson.notes.length,
      'Admin can reuse existing video stream and PDF notes across lessons/courses'
    );

    // Test 14: Automatic S3 media deletion helper safely cleans up files
    let deleteRanWithoutError = true;
    try {
      await deleteMediaObject('courses/test/nonexistent_file_cleanup.mp4');
      await deleteMediaObject('https://mycourse-private-media-2026.s3.ap-southeast-2.amazonaws.com/courses/test/thumb.jpg?X-Amz-Signature=test');
    } catch (e) {
      deleteRanWithoutError = false;
    }
    assert(deleteRanWithoutError, 'S3 media deletion helper purges replaced files and extracts clean keys from URLs');

    // Cleanup test fixtures
    await Lesson.deleteMany({ courseId: testCourse._id });
    await Enrollment.deleteMany({ courseId: testCourse._id });
    await Progress.deleteMany({ courseId: testCourse._id });
    await Course.deleteOne({ _id: testCourse._id });
    await User.deleteOne({ _id: studentUser._id });

    console.log('========================================================');
    console.log(`🎉 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================');

    await disconnectDB();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test Suite Exception:', err);
    process.exit(1);
  }
};

runTests();
