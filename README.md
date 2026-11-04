# MyCourse — Personal Learning Management System (PLMS)

> **Tagline:** "Your Personal Learning Space."

**MyCourse** is a private, production-minded Personal Learning Management System engineered with an **Apple Liquid Glass + Animated Water Droplet** design language and an enterprise-grade MERN + AWS S3 private storage architecture.

---

## 💎 Design System: Liquid Glass + Soft Pastel Identity

The interface is built around a proprietary **Shade + Pastel** 5-color palette, realistic 3D water droplets, and semi-transparent glass surfaces:

| Color | Hex | Purpose in MyCourse |
|---|---|---|
| **Black** | `#111111` | Primary text, high-contrast CTA buttons, header icons |
| **Off-white** | `#F5F5F5` | Main surface backgrounds |
| **Lavender** | `#DCDCFB` | Hero sections, glass highlights, module icons |
| **Mint** | `#DDF5E5` | Success metrics, completion badges, progress indicators |
| **Ice Blue** | `#DFF3F8` | Glass decorative elements, cool ambient water reflections |

### Visual Characteristics:
- **Liquid Glass Cards**: Semi-transparent white backgrounds (`rgba(255, 255, 255, 0.58)`), `backdrop-filter: blur(28px) saturate(160%)`, delicate white borders, inner specular highlights, and soft layered shadows.
- **3D Water Droplets**: Realistic CSS radial gradients, specular highlight dots, inner refractions, and organic floating physics.
- **Distraction-Free Video & Document Experience**: Dark video player container embedded into the soft pastel glass frame; protected in-browser PDF reader with suppressed download/print toolbars.

---

## 🏛️ System Architecture & Core Capabilities

### 1. User Roles & Security
- **Single Admin / Teacher Account**: Created exclusively via secure backend seeding script (`npm run seed`). Public registration can **never** create an admin account (client roles are strictly ignored; all public signups become `role: "student"`).
- **Manual Course Access Grants**: Students cannot self-enroll or purchase courses. Admin explicitly assigns courses to students on the Enrollment Management screen.
- **Zero-Trust Backend Authorization**: Every request to view course details, lessons, or stream media validates active course enrollment at the database level. Frontend-only hiding is never relied upon.
- **Instant Revocation**: When an admin revokes course access, the student immediately loses access to all videos, lessons, and PDF documents.

### 2. Private AWS S3 Media Engine
- All course thumbnails, high-definition video modules, and PDF notes remain in private storage.
- **Admin Direct Upload**:
  1. Admin selects a media file.
  2. Backend validates MIME type, extension, and size limits (Thumbnails: max 5MB, Videos: max 500MB, PDFs: max 50MB).
  3. Backend creates an AWS S3 Presigned Upload URL (HTTP `PUT`).
  4. The browser uploads the file directly to S3.
  5. The S3 object key is saved to MongoDB.
- **Student Secure Streaming**:
  1. Student requests a video or PDF note.
  2. Backend verifies JWT and active course enrollment.
  3. Backend generates a short-lived Presigned GET URL (15 to 60 minutes).
  4. Frontend streams the video with HTTP Range support or renders the PDF in-browser with `Content-Disposition: inline`.
- **Zero-Config Local Fallback**: When AWS credentials are not yet configured in `backend/.env`, MyCourse automatically activates its built-in Local S3 Storage Emulation layer with cryptographically signed tokens and range streaming, allowing 100% of features to run locally immediately.

---

## 📁 Monorepo Folder Structure

```
mycourse/
├── backend/
│   ├── config/
│   │   └── db.js                      # MongoDB Atlas connection + dev memory fallback
│   ├── controllers/
│   │   ├── adminController.js         # Course, lesson, student & enrollment handlers
│   │   ├── authController.js          # Register, login, logout, profile handlers
│   │   ├── mediaController.js         # Presigned upload/stream controllers & local engine
│   │   └── studentController.js       # Student dashboard, syllabus, access & progress
│   ├── middleware/
│   │   ├── auth.js                    # JWT verification & admin/student role gates
│   │   └── enrollment.js              # Database enrollment verification middleware
│   ├── models/
│   │   ├── Course.js                  # Course track schema
│   │   ├── Enrollment.js              # Unique studentId + courseId index
│   │   ├── Lesson.js                  # Chapter, order, videoKey, and notes
│   │   ├── Progress.js                # Per-student lesson watch time & completion
│   │   └── User.js                    # Bcrypt hashed user schema (admin & student)
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── mediaRoutes.js
│   │   └── studentRoutes.js
│   ├── scripts/
│   │   ├── seedAdmin.js               # Creates single admin and demo curriculum
│   │   └── testIntegration.js        # Automated 12-scenario integration test suite
│   ├── services/
│   │   └── s3Service.js               # AWS SDK v3 client + presigned URL generator
│   ├── utils/
│   │   └── jwt.js                     # Token generation & cookie options
│   ├── .env.example
│   ├── package.json
│   └── server.js                      # Express app, Helmet, CORS, Rate Limiters
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── dashboard/             # WelcomeHero, StatsCard, ContinueLearning, CourseCard
│   │   │   ├── effects/               # WaterDroplets, LiquidBackground, GlassCard
│   │   │   ├── layout/                # Header, AdminSidebar, BottomNavigation, ProtectedRoute
│   │   │   └── player/                # PDFViewerModal with in-app zoom & controls
│   │   ├── context/
│   │   │   ├── AuthContext.jsx        # User state, JWT storage, role helpers
│   │   │   └── ToastContext.jsx       # Liquid glass toast notifications
│   │   ├── pages/
│   │   │   ├── admin/                 # AdminDashboard, CourseManagement, LessonManagement,
│   │   │   │                          # StudentManagement, EnrollmentManagement, StorageOverview
│   │   │   ├── auth/                  # Login, Register
│   │   │   ├── public/                # LandingPage
│   │   │   └── student/               # Dashboard, Courses, CourseDetails, LearningPlayer, Progress, Profile
│   │   ├── services/
│   │   │   └── api.js                 # Axios instance with credentials & bearer interceptors
│   │   ├── styles/
│   │   │   ├── animations.css         # Keyframes for liquid drift, wave flow, floating droplets
│   │   │   ├── glass.css              # Apple Liquid Glass CSS tokens & 3D droplet gradients
│   │   │   └── globals.css            # Tailwind directives & base fonts
│   │   ├── App.jsx                    # React Router DOM configuration
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js             # 5-color Shade + Pastel palette tokens
│   └── vite.config.js                 # Vite dev proxy configuration
│
├── .gitignore
├── package.json                       # Monorepo root scripts
└── README.md
```

---

## 🚀 Quick Start & Local Setup

### 1. Prerequisites
- **Node.js** v18+ (tested on v24.x)
- **npm** v9+

### 2. Installation
From the project root:
```bash
# Install backend and frontend dependencies
npm run install:all
```

### 3. Environment Variables

#### Backend (`backend/.env`):
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Optional: MongoDB Atlas URI. If omitted, MyCourse automatically boots an in-memory database!
MONGODB_URI=

JWT_SECRET=mycourse_super_secret_jwt_key_2026_at_least_32_characters_long
JWT_EXPIRES_IN=7d

ADMIN_EMAIL=admin@mycourse.local
ADMIN_PASSWORD=AdminSecurePassword123!
ADMIN_NAME=Headmaster Admin

# AWS S3 Configuration (Optional for dev; local S3 emulation is active by default)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET_NAME=mycourse-media
USE_LOCAL_S3_FALLBACK=true
```

#### Frontend (`frontend/.env`):
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME="MyCourse"
VITE_APP_TAGLINE="Your Personal Learning Space"
```

### 4. Running the Development Servers
In two terminal tabs:

**Terminal 1 (Backend):**
```bash
npm run start:backend
# Backend starts on http://localhost:5000
```
*(On initial startup, the backend automatically seeds the admin and sample curriculum for instant evaluation!)*

**Terminal 2 (Frontend):**
```bash
npm run start:frontend
# Vite frontend starts on http://localhost:5173
```

Open `http://localhost:5173` in your browser.

---

## 🔑 Pre-Seeded Evaluation Credentials

You can use the one-click demo fill buttons on `/login` or enter:

| Role | Email | Password | What You Can Do |
|---|---|---|---|
| **Admin** | `admin@mycourse.local` | `AdminSecurePassword123!` | Create/edit courses, upload S3 videos & notes, grant/revoke access |
| **Student (Soham)** | `soham@mycourse.local` | `Password123!` | Access assigned courses (4 active tracks, 12 lessons completed, 75% progress on React) |

---

## ☁️ AWS S3 Production Setup Guide

When you are ready to connect a live AWS S3 private bucket:

1. **Create S3 Bucket**:
   - Bucket Name: e.g., `mycourse-private-vault`
   - Region: e.g., `us-east-1`
   - **Block all public access**: Keep **ENABLED** (100% private).

2. **Configure Bucket CORS**:
   Add this CORS configuration under the **Permissions** tab of your S3 bucket:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "HEAD"],
       "AllowedOrigins": ["http://localhost:5173", "https://yourdomain.com"],
       "ExposeHeaders": ["Content-Range", "Accept-Ranges", "Content-Length", "Content-Disposition"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

3. **Create IAM Policy & User**:
   Attach this policy to your IAM programmatic user:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:DeleteObject"
         ],
         "Resource": "arn:aws:s3:::mycourse-private-vault/*"
       }
     ]
   }
   ```

4. **Update `backend/.env`**:
   ```env
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=AKIA...YOUR_KEY...
   AWS_SECRET_ACCESS_KEY=wJalr...YOUR_SECRET...
   AWS_S3_BUCKET_NAME=mycourse-private-vault
   ```
   Restart the backend. All file uploads and stream requests now seamlessly route through AWS S3.

---

## 🧪 Automated Integration Tests

Run the full automated integration test suite:
```bash
npm test
```

### Verified Test Cases:
- [x] Admin account seeded with `role: "admin"`
- [x] Student registration forces `role: "student"` (client injection blocked)
- [x] Duplicate email registration is strictly rejected
- [x] Admin can create courses
- [x] Admin can add lessons with video and PDF notes keys
- [x] AWS S3 Presigned Upload URL generated successfully
- [x] Short-lived Presigned View URL generated successfully
- [x] Unassigned student receives 403 Forbidden on course content
- [x] Admin successfully grants manual course access
- [x] Student gains verified access after enrollment
- [x] Student lesson watch time and completion recorded accurately
- [x] Revoked student immediately loses media and course access

---

## 🚢 Future Deployment Readiness (Docker & EC2)

The application is structured for instant containerization:
1. Building the frontend produces static production assets in `frontend/dist`.
2. `backend/server.js` already includes built-in detection to serve `frontend/dist` when present.
3. Both can run in a single container or behind Nginx on AWS EC2, while AWS S3 remains the private media repository.

#   m y - c o u r s e - p l a t f o r m  
 