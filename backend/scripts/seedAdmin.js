require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');

const seed = async () => {
  try {
    console.log(' Starting MyCourse Database Seeding...');
    await connectDB();

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@mycourse.local').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminSecurePassword123!';
    const adminName = process.env.ADMIN_NAME || 'Headmaster Admin';

    // 1. Seed or Verify Admin User
    let admin = await User.findOne({ role: 'admin' });

    if (admin) {
      console.log(` Admin account already exists: ${admin.email}`);
    } else {
      admin = new User({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        isActive: true,
        bio: 'Lead Instructor & Administrator of MyCourse PLMS.',
      });
      await admin.save();
      console.log(` Created Admin Account successfully!`);
      console.log(`   Email:    ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
    }

    // 2. If --with-demo flag is passed, seed sample courses, lessons, student & enrollment
    const withDemo = process.argv.includes('--with-demo');

    if (withDemo) {
      console.log(' Seeding demo student, sample courses, lessons, and enrollment...');

      // Seed Student Soham
      let student = await User.findOne({ email: 'soham@mycourse.local' });
      if (!student) {
        student = new User({
          name: 'Soham',
          email: 'soham@mycourse.local',
          password: 'Password123!',
          role: 'student',
          isActive: true,
          bio: 'Aspiring Full Stack & Cloud Architect.',
        });
        await student.save();
        console.log(' Demo Student Created: soham@mycourse.local / Password123!');
      }

      // Seed Course 1: Full Stack Development & Cloud Architecture
      let course1 = await Course.findOne({ title: 'Full Stack Development' });
      if (!course1) {
        course1 = await Course.create({
          title: 'Full Stack Development',
          shortDescription: 'Master modern full-stack engineering with React, Node.js, and AWS cloud patterns.',
          detailedDescription:
            'A comprehensive deep dive into high-performance web architecture, secure authentication, private S3 asset streaming, and Apple-inspired Liquid Glass user interfaces.',
          category: 'Web Development',
          status: 'published',
          createdBy: admin._id,
        });

        // Add Lessons to Course 1
        const lessonsData = [
          {
            title: 'Modern Cloud Architecture & Foundations',
            description: 'Introduction to microservices, monolithic monorepos, and cloud security.',
            chapter: 'Chapter 01 · System Architecture',
            order: 1,
            videoDuration: 1800,
            notes: [{ name: 'Cloud_Architecture_Overview.pdf', key: 'notes/demo_arch.pdf', size: 2450000 }],
          },
          {
            title: 'Designing Resilient Node & Express APIs',
            description: 'Structuring production-ready controllers, middleware, and rate limiters.',
            chapter: 'Chapter 02 · Backend Services',
            order: 2,
            videoDuration: 2400,
            notes: [{ name: 'Express_Production_Checklist.pdf', key: 'notes/demo_express.pdf', size: 1800000 }],
          },
          {
            title: 'AWS S3 Private Buckets & Presigned URLs',
            description: 'Securing video and document streaming using short-lived cryptographically signed tokens.',
            chapter: 'Chapter 03 · Cloud Storage',
            order: 3,
            videoDuration: 2100,
            notes: [{ name: 'AWS_S3_Security_Handbook.pdf', key: 'notes/demo_s3.pdf', size: 3200000 }],
          },
          {
            title: 'Liquid Glass Design & Framer Motion',
            description: 'Building transparent 3D water droplet animations and Apple-grade glass cards.',
            chapter: 'Chapter 04 · React.js',
            order: 4,
            videoDuration: 3600,
            notes: [{ name: 'Liquid_Glass_Design_Tokens.pdf', key: 'notes/demo_design.pdf', size: 1500000 }],
          },
        ];

        const createdLessons = [];
        for (const ld of lessonsData) {
          const l = await Lesson.create({ ...ld, courseId: course1._id });
          createdLessons.push(l);
        }

        course1.lessonsCount = createdLessons.length;
        course1.totalDuration = createdLessons.reduce((sum, l) => sum + l.videoDuration, 0);
        await course1.save();
        console.log(` Created Course: ${course1.title} with ${createdLessons.length} lessons`);

        // Enroll Student in Course 1
        await Enrollment.findOneAndUpdate(
          { studentId: student._id, courseId: course1._id },
          { assignedBy: admin._id, status: 'active', assignedAt: new Date() },
          { upsert: true }
        );

        // Mark 3 of 4 lessons as completed (75% progress!)
        for (let i = 0; i < 3; i++) {
          await Progress.findOneAndUpdate(
            { studentId: student._id, lessonId: createdLessons[i]._id },
            {
              courseId: course1._id,
              isCompleted: true,
              watchTime: createdLessons[i].videoDuration,
              completedAt: new Date(),
              lastWatchedAt: new Date(),
            },
            { upsert: true }
          );
        }

        // 4th lesson in progress
        await Progress.findOneAndUpdate(
          { studentId: student._id, lessonId: createdLessons[3]._id },
          {
            courseId: course1._id,
            isCompleted: false,
            watchTime: 1200,
            lastWatchedAt: new Date(),
          },
          { upsert: true }
        );
      }

      // Seed 3 more courses so student has exactly 4 Active Courses and 12 Lessons Done!
      const additionalCourses = [
        {
          title: 'Advanced React & Animation Systems',
          shortDescription: 'Master fluid physics, spring physics, and Framer Motion micro-interactions.',
          category: 'Frontend Engineering',
          lessons: [
            { title: 'Framer Motion Gestures', chapter: 'Chapter 01 · Gestures', duration: 1500 },
            { title: 'Liquid Shader Simulations', chapter: 'Chapter 02 · WebGL', duration: 2200 },
            { title: 'Accessible Interactive Canvas', chapter: 'Chapter 03 · Accessibility', duration: 1800 },
          ],
        },
        {
          title: 'AWS Cloud Architecture for Developers',
          shortDescription: 'Learn S3, CloudFront, Lambda, IAM, and production cloud infrastructure.',
          category: 'Cloud Architecture',
          lessons: [
            { title: 'IAM Least Privilege Deep Dive', chapter: 'Chapter 01 · IAM', duration: 2000 },
            { title: 'Private S3 & CloudFront Origin Access', chapter: 'Chapter 02 · Content Delivery', duration: 2600 },
            { title: 'VPC Peering & Container Security', chapter: 'Chapter 03 · Networking', duration: 3100 },
          ],
        },
        {
          title: 'Application Security & Pen-Testing',
          shortDescription: 'Hands-on OWASP Top 10 mitigation, JWT security, and CSRF protection.',
          category: 'Cybersecurity',
          lessons: [
            { title: 'JWT Cryptography & Replay Attacks', chapter: 'Chapter 01 · Tokens', duration: 1900 },
            { title: 'SQL & NoSQL Injection Defenses', chapter: 'Chapter 02 · Injection', duration: 2400 },
            { title: 'Strict Content Security Policies', chapter: 'Chapter 03 · Browser Defense', duration: 2100 },
          ],
        },
      ];

      for (const ac of additionalCourses) {
        let existing = await Course.findOne({ title: ac.title });
        if (!existing) {
          existing = await Course.create({
            title: ac.title,
            shortDescription: ac.shortDescription,
            category: ac.category,
            status: 'published',
            createdBy: admin._id,
          });

          const created = [];
          for (let i = 0; i < ac.lessons.length; i++) {
            const l = await Lesson.create({
              courseId: existing._id,
              title: ac.lessons[i].title,
              chapter: ac.lessons[i].chapter,
              order: i + 1,
              videoDuration: ac.lessons[i].duration,
            });
            created.push(l);
          }

          existing.lessonsCount = created.length;
          existing.totalDuration = created.reduce((s, c) => s + c.videoDuration, 0);
          await existing.save();

          // Enroll student
          await Enrollment.findOneAndUpdate(
            { studentId: student._id, courseId: existing._id },
            { assignedBy: admin._id, status: 'active', assignedAt: new Date() },
            { upsert: true }
          );

          // Mark all 3 lessons completed for these courses (3 * 3 = 9 + 3 from course1 = 12 Lessons Done!)
          for (const l of created) {
            await Progress.findOneAndUpdate(
              { studentId: student._id, lessonId: l._id },
              {
                courseId: existing._id,
                isCompleted: true,
                watchTime: l.videoDuration,
                completedAt: new Date(),
                lastWatchedAt: new Date(),
              },
              { upsert: true }
            );
          }

          console.log(` Created & Enrolled Course: ${existing.title}`);
        }
      }

      console.log(' Demo data initialized:');
      console.log('   - 4 Active Enrolled Courses');
      console.log('   - 12 Completed Lessons');
      console.log('   - Continue Learning: Full Stack Development (Chapter 04 · React.js, 75%)');
    }

    console.log(' Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding Error:', err);
    process.exit(1);
  }
};

seed();

