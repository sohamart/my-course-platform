require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const { connectDB } = require('./config/db');

// Route Handlers
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const mediaRoutes = require('./routes/mediaRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// 1. Database Connection & Auto-Seed check
connectDB().then(async () => {
  try {
    const User = require('./models/User');
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      console.log(' No admin found on startup. Auto-seeding initial database...');
      const adminEmail = (process.env.ADMIN_EMAIL || 'admin@mycourse.local').toLowerCase().trim();
      const adminPassword = process.env.ADMIN_PASSWORD || 'AdminSecurePassword123!';
      const adminName = process.env.ADMIN_NAME || 'Headmaster Admin';

      const admin = new User({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        isActive: true,
        bio: 'Lead Instructor & Administrator of MyCourse PLMS.',
      });
      await admin.save();
      console.log(` Created default Admin (${adminEmail})`);

      // Also create demo student & courses for instant evaluation
      const Course = require('./models/Course');
      const Lesson = require('./models/Lesson');
      const Enrollment = require('./models/Enrollment');
      const Progress = require('./models/Progress');

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

        const course1 = await Course.create({
          title: 'Full Stack Development',
          shortDescription: 'Master modern full-stack engineering with React, Node.js, and AWS cloud patterns.',
          detailedDescription: 'A comprehensive deep dive into high-performance web architecture, secure authentication, private S3 asset streaming, and Apple-inspired Liquid Glass user interfaces.',
          category: 'Web Development',
          status: 'published',
          createdBy: admin._id,
        });

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

        await Enrollment.create({
          studentId: student._id,
          courseId: course1._id,
          assignedBy: admin._id,
          status: 'active',
        });

        for (let i = 0; i < 3; i++) {
          await Progress.create({
            studentId: student._id,
            courseId: course1._id,
            lessonId: createdLessons[i]._id,
            isCompleted: true,
            watchTime: createdLessons[i].videoDuration,
            completedAt: new Date(),
          });
        }

        await Progress.create({
          studentId: student._id,
          courseId: course1._id,
          lessonId: createdLessons[3]._id,
          isCompleted: false,
          watchTime: 1200,
        });

        // 3 more enrolled courses
        const otherCourses = [
          { title: 'Advanced React & Animation Systems', category: 'Frontend Engineering' },
          { title: 'AWS Cloud Architecture for Developers', category: 'Cloud Architecture' },
          { title: 'Application Security & Pen-Testing', category: 'Cybersecurity' },
        ];

        for (const oc of otherCourses) {
          const c = await Course.create({
            title: oc.title,
            shortDescription: 'Comprehensive hands-on curriculum with real production implementations.',
            category: oc.category,
            status: 'published',
            createdBy: admin._id,
            lessonsCount: 3,
            totalDuration: 5400,
          });

          await Enrollment.create({
            studentId: student._id,
            courseId: c._id,
            assignedBy: admin._id,
            status: 'active',
          });

          for (let k = 1; k <= 3; k++) {
            const l = await Lesson.create({
              courseId: c._id,
              title: `${oc.title} - Module ${k}`,
              chapter: `Chapter 0${k}`,
              order: k,
              videoDuration: 1800,
            });

            await Progress.create({
              studentId: student._id,
              courseId: c._id,
              lessonId: l._id,
              isCompleted: true,
              watchTime: 1800,
              completedAt: new Date(),
            });
          }
        }
        console.log(' Auto-seeded 4 active courses & 12 completed lessons for Soham!');
      }
    }
  } catch (seedErr) {
    console.error('Auto-seed check error:', seedErr);
  }
});

// 2. Security & Core Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false, // Allows flexible media embedding in development
  })
);

app.use(
  cors({
    origin: [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
    exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length', 'Content-Disposition'],
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/media', mediaRoutes);

// Health check endpoint (for Docker & monitoring)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'MyCourse PLMS API',
  });
});

// 4. Strict 404 Handler for undefined API routes (MUST run before SPA fallback)
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found.`,
  });
});

// 5. Production Static Frontend Serving (Single Page Application Fallback)
const primaryPublicDir = path.join(__dirname, 'public');
const fallbackDistDir = path.join(__dirname, '../frontend/dist');
const staticDir = fs.existsSync(primaryPublicDir)
  ? primaryPublicDir
  : fs.existsSync(fallbackDistDir)
  ? fallbackDistDir
  : null;

if (staticDir) {
  console.log(` Serving static frontend from ${path.relative(__dirname, staticDir)}`);
  app.use(express.static(staticDir));

  // Client-side routing fallback for all non-API paths
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
  });
}

// 6. Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 7. Start Server (Binding to 0.0.0.0 for Docker & Cloud Compatibility)
const HOST = '0.0.0.0';
const server = app.listen(PORT, HOST, () => {
  console.log(`===============================================`);
  console.log(` MyCourse PLMS Backend running on http://${HOST}:${PORT}`);
  console.log(` Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Client URL: ${CLIENT_URL}`);
  console.log(`===============================================`);
});

// Handle graceful termination (Docker container stops & process signals)
const handleGracefulShutdown = (signal) => {
  console.log(`${signal} signal received: closing HTTP server and database connections`);
  server.close(async () => {
    console.log('HTTP server closed');
    try {
      const { disconnectDB } = require('./config/db');
      await disconnectDB();
      console.log('MongoDB connection closed');
    } catch (e) {}
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

module.exports = app;
