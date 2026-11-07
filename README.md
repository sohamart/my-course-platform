# MyCourse — Personal Learning Management System (PLMS)

> **Your Personal Learning Space.**

MyCourse is a private, production-minded Personal Learning Management System engineered with an **Apple Liquid Glass + Animated Water Droplet** design language and an enterprise-grade MERN + AWS S3 private storage architecture.

---

## 💎 Design System: Liquid Glass + Soft Pastel Identity

The interface is built around a proprietary **Shade + Pastel 5-color palette**, realistic 3D water droplets, and semi-transparent glass surfaces.

| Color | Hex Code | Purpose in MyCourse |
|---|---|---|
| **Black** | `#111111` | Primary text, high-contrast CTA buttons, header icons |
| **Off-white** | `#F5F5F5` | Main surface backgrounds |
| **Lavender** | `#DCDCFB` | Hero sections, glass highlights, module icons |
| **Mint** | `#DDF5E5` | Success metrics, completion badges, progress indicators |
| **Ice Blue** | `#DFF3F8` | Glass decorative elements, cool ambient water reflections |

### Visual Characteristics

- **Liquid Glass Cards:** Semi-transparent white backgrounds, backdrop blur, delicate white borders, inner highlights, and soft layered shadows.
- **3D Water Droplets:** Realistic CSS radial gradients, specular highlights, inner refractions, and organic floating animations.
- **Distraction-Free Learning:** Dark video player containers and a protected in-browser PDF reader.

---

## 🏛️ System Architecture & Core Capabilities

### 1. User Roles & Security

- **Single Admin / Teacher Account:** Created exclusively through a secure backend seeding script (`npm run seed`).
- **Student Registration:** Public registration can only create student accounts.
- **Manual Course Access:** Students cannot self-enroll or purchase courses. Admin explicitly assigns courses.
- **Zero-Trust Backend Authorization:** Every request to view course details, lessons, or media validates active course enrollment.
- **Instant Revocation:** When an admin revokes course access, the student immediately loses access to associated videos, lessons, and PDF documents.

### 2. Private AWS S3 Media Engine

All course thumbnails, high-definition video modules, and PDF notes remain in private storage.

#### Admin Direct Upload Workflow

1. Admin selects a media file.
2. Backend validates MIME type, extension, and file size.
3. Backend creates an AWS S3 Pre-signed Upload URL (HTTP PUT).
4. Browser uploads the file directly to S3.
5. S3 object key is saved to MongoDB.

**File Size Limits:**

| Media Type | Maximum Size |
|---|---:|
| Thumbnails | 5 MB |
| Videos | 500 MB |
| PDFs | 50 MB |

#### Student Secure Streaming

1. Student requests a video or PDF note.
2. Backend verifies JWT authentication and active course enrollment.
3. Backend generates a short-lived Pre-signed GET URL (15–60 minutes).
4. Frontend streams videos with HTTP Range support or displays PDFs in-browser.

#### Local Storage Fallback

When AWS credentials are not configured in `backend/.env`, MyCourse can activate its built-in Local S3 Storage Emulation layer for local development.

---

## 📁 Monorepo Folder Structure

```text
mycourse/
│
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── mediaController.js
│   │   └── studentController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── enrollment.js
│   ├── models/
│   │   ├── Course.js
│   │   ├── Enrollment.js
│   │   ├── Lesson.js
│   │   ├── Progress.js
│   │   └── User.js
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── mediaRoutes.js
│   │   └── studentRoutes.js
│   ├── scripts/
│   │   ├── seedAdmin.js
│   │   └── testIntegration.js
│   ├── services/
│   │   └── s3Service.js
│   ├── utils/
│   │   └── jwt.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── dashboard/
│   │   │   ├── effects/
│   │   │   ├── layout/
│   │   │   └── player/
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ToastContext.jsx
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   ├── auth/
│   │   │   ├── public/
│   │   │   └── student/
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── styles/
│   │   │   ├── animations.css
│   │   │   ├── glass.css
│   │   │   └── globals.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Quick Start & Local Setup

### 1. Prerequisites

- Node.js v18+ (tested on v24.x)
- npm v9+

### 2. Installation

From the project root:

```bash
# Install backend and frontend dependencies
npm run install:all
```

### 3. Environment Variables

#### Backend (`backend/.env`)

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Optional: MongoDB Atlas URI
# If omitted, MyCourse can use an in-memory database.
MONGODB_URI=

JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRES_IN=7d

ADMIN_EMAIL=admin@mycourse.local
ADMIN_PASSWORD=your_admin_password
ADMIN_NAME=Headmaster Admin

# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET_NAME=mycourse-media
USE_LOCAL_S3_FALLBACK=true
```

#### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME="MyCourse"
VITE_APP_TAGLINE="Your Personal Learning Space"
```

### 4. Running Development Servers

Open two terminal tabs.

**Terminal 1 — Backend**

```bash
npm run start:backend
```

Backend starts at `http://localhost:5000`.

**Terminal 2 — Frontend**

```bash
npm run start:frontend
```

Frontend starts at `http://localhost:5173`.

Open `http://localhost:5173` in your browser.

---

## 🔑 Pre-Seeded Evaluation Credentials

The original README provides these demo credentials:

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@mycourse.local` | `AdminSecurePassword123!` |
| **Student (Soham)** | `soham@mycourse.local` | `Password123!` |

---

## ☁️ AWS S3 Production Setup Guide

### Step 1: Create an S3 Bucket

- Create an Amazon S3 bucket.
- Select the required AWS region.
- Keep **Block All Public Access ENABLED**.

### Step 2: Configure Bucket CORS

Add the following configuration under the S3 bucket's Permissions tab.

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:5173",
      "https://yourdomain.com"
    ],
    "ExposeHeaders": [
      "Content-Range",
      "Accept-Ranges",
      "Content-Length",
      "Content-Disposition"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

### Step 3: Create IAM Policy

Attach the following required permissions to the IAM identity used by the application:

- `s3:PutObject`
- `s3:GetObject`
- `s3:DeleteObject`

Example policy:

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

### Step 4: Update Backend Environment

Configure the AWS region and bucket name in `backend/.env`.

```env
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=mycourse-private-vault
```

Restart the backend after updating the configuration.

---

## 🧪 Automated Integration Tests

Run the full automated integration test suite:

```bash
npm test
```

### Verified Test Cases

- [x] Admin account seeded with `role: "admin"`
- [x] Student registration forces `role: "student"`
- [x] Duplicate email registration is rejected
- [x] Admin can create courses
- [x] Admin can add lessons with video and PDF note keys
- [x] AWS S3 Pre-signed Upload URL generated successfully
- [x] Short-lived Pre-signed View URL generated successfully
- [x] Unassigned student receives 403 Forbidden on course content
- [x] Admin successfully grants manual course access
- [x] Student gains verified access after enrollment
- [x] Student lesson watch time and completion are recorded
- [x] Revoked student immediately loses media and course access

---

## 🚢 Future Deployment Readiness (Docker & EC2)

The application is structured for containerization and cloud deployment:

1. Building the frontend produces static production assets in `frontend/dist`.
2. `backend/server.js` includes built-in detection to serve `frontend/dist` when present.
3. Both can run in a single container or behind a reverse proxy on AWS EC2.
4. AWS S3 remains the private media repository.

---

## 🌐 Project Links

- **Live Website:** https://mycourse.soham.cyou
- **GitHub Repository:** https://github.com/sohamart/my-course-platform

---

## 👨‍💻 Developer

**Soham Dutta**

GitHub: [@sohamart](https://github.com/sohamart)

**Project:** MyCourse — Personal Learning Management System (PLMS)

---

<p align="center">

  **MyCourse — Your Personal Learning Space.**

</p>
