<div align="center">

# <img src="https://img.icons8.com/color/40/graduation-cap.png"/> EduPortal
### College Academic Management System

![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-6%2B-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

*A full-stack academic portal for students and faculty — manage marks, attendance, leave, and course materials all in one place.*

---

</div>

## <img src="https://img.icons8.com/color/24/list.png"/> Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Default Credentials](#default-credentials)
- [Tech Stack](#tech-stack)

---

## <img src="https://img.icons8.com/color/24/overview-pages-3.png"/> Overview

**EduPortal** is a web-based college academic management system built with a **polyglot persistence** architecture — combining a PostgreSQL relational database for structured academic records with a MongoDB document database for flexible, semi-structured data such as leave requests and course materials.

The system supports two distinct user roles — **Student** and **Faculty** — each with a tailored dashboard and access-controlled feature set, all secured with JSON Web Token (JWT) authentication.

---

## <img src="https://img.icons8.com/color/24/star.png"/> Features

### <img src="https://img.icons8.com/color/20/student-center.png"/> Student Portal
| Feature | Description |
|---------|-------------|
| **Dashboard** | GPA overview, attendance summary, notifications, and course enrollment |
| **Marks** | View mid-term, end-term, total marks, and letter grade per course |
| **Attendance** | Per-course attendance percentage with present/absent session history |
| **Leave** | Submit leave requests with date range and reason |
| **Materials** | Browse and download course materials uploaded by faculty |
| **Notifications** | Receive real-time academic notifications |

### <img src="https://img.icons8.com/color/20/teacher.png"/> Faculty Portal
| Feature | Description |
|---------|-------------|
| **Dashboard** | Summary of total students, active classes, pending leaves, and uploaded materials |
| **Marks Management** | Enter, update, and delete student marks; GPA auto-recalculates on every change |
| **Attendance** | Record daily per-student, per-course attendance |
| **Leave Approvals** | Review, approve, or reject student leave requests; approved leaves sync to attendance |
| **Materials Upload** | Upload course files (PDF, slides, etc.) per course |
| **Audit Trail** | All marks operations are logged to MongoDB for accountability |

---

## <img src="https://img.icons8.com/color/24/blueprint.png"/> Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend                         │
│         Vanilla HTML + CSS + JavaScript             │
│              (Served statically)                    │
└────────────────────┬────────────────────────────────┘
                     │  HTTP REST API
                     ▼
┌─────────────────────────────────────────────────────┐
│              Backend — Node.js + Express            │
│                                                     │
│  ┌─────────────┐   ┌──────────────────────────┐    │
│  │  JWT Auth   │   │  Role-Based Middleware    │    │
│  │  Middleware │   │  (student / faculty)      │    │
│  └─────────────┘   └──────────────────────────┘    │
│                                                     │
│  Routes: /auth /marks /attendance /leave            │
│          /courses /materials /notifications /logs   │
└──────┬──────────────────────────┬───────────────────┘
       │                          │
       ▼                          ▼
┌─────────────┐          ┌────────────────┐
│  PostgreSQL │          │    MongoDB     │
│  (Sequelize │          │  (Mongoose)    │
│    ORM)     │          │                │
│  students   │          │  leave_requests│
│  faculty    │          │  course_mats   │
│  courses    │          │  audit_logs    │
│  enrollments│          │  notifications │
│  marks      │          │  portfolios    │
│  attendance │          │                │
│  gpa_records│          │                │
└─────────────┘          └────────────────┘
```

**Polyglot Persistence Strategy:**
- **PostgreSQL** stores all entities with fixed schemas and relational constraints — students, marks, attendance, GPA.
- **MongoDB** stores flexible, semi-structured documents — leave requests (with optional attachments), course materials (variable content), and audit logs.
- **Cross-DB Sync:** When a faculty member approves a leave request in MongoDB, the system automatically creates a corresponding `Leave` attendance record in PostgreSQL.

---

## <img src="https://img.icons8.com/color/24/folder-invoices.png"/> Project Structure

```
EduPortal/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── dbMongo.js          # MongoDB connection (Mongoose)
│   │   │   └── dbSql.js            # PostgreSQL connection (Sequelize)
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.js             # JWT verification + role enforcement
│   │   │   └── errorHandler.js     # Global error handler
│   │   │
│   │   ├── models/
│   │   │   ├── mongo/
│   │   │   │   ├── AuditLog.js     # Marks operation audit trail
│   │   │   │   ├── CourseMaterial.js
│   │   │   │   ├── LeaveRequest.js
│   │   │   │   ├── Notification.js
│   │   │   │   └── Portfolio.js
│   │   │   └── sql/
│   │   │       └── index.js        # All Sequelize models + associations
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.js             # Login, registration, /me
│   │   │   ├── marks.js            # Marks CRUD + GPA recalculation
│   │   │   ├── attendance.js       # Attendance recording + summary
│   │   │   ├── leave.js            # Leave requests + cross-DB approval sync
│   │   │   ├── courses.js          # Course listing + enrollment
│   │   │   ├── materials.js        # File upload + course materials
│   │   │   ├── notifications.js
│   │   │   ├── logs.js             # Audit log retrieval
│   │   │   └── index.js            # Route aggregator
│   │   │
│   │   ├── scripts/
│   │   │   └── seedSampleData.js   # Database seeding script
│   │   │
│   │   ├── sql/
│   │   │   └── schema.sql          # Raw PostgreSQL DDL
│   │   │
│   │   ├── utils/
│   │   │   ├── dataRouter.js       # Polyglot routing decision helper
│   │   │   └── syncEngine.js       # Cross-database audit logging
│   │   │
│   │   ├── app.js                  # Express app setup + middleware
│   │   └── index.js                # Server entry point
│   │
│   ├── uploads/                    # Uploaded course material files (git-ignored)
│   ├── .env                        # Environment variables (git-ignored)
│   └── package.json
│
├── frontend/
│   ├── index.html                  # Single-page application shell
│   ├── app.js                      # All client-side logic
│   └── styles.css                  # Theming, layout, components
│
├── .gitignore
└── README.md
```

---

## <img src="https://img.icons8.com/color/24/ok.png"/> Prerequisites

Ensure the following are installed on your machine before proceeding:

| Requirement | Version | Download |
|-------------|---------|----------|
| **Node.js** | v18.0 or higher | [nodejs.org](https://nodejs.org/) |
| **npm** | v9.0 or higher | Bundled with Node.js |
| **PostgreSQL** | v14.0 or higher | [postgresql.org](https://www.postgresql.org/download/) |
| **MongoDB** | v6.0 or higher | [mongodb.com](https://www.mongodb.com/try/download/community) |
| **Git** | Any recent version | [git-scm.com](https://git-scm.com/) |

> **Note:** MongoDB must be running as a service (or started manually) on `localhost:27017`. PostgreSQL must be running on `localhost:5432`.

---

## <img src="https://img.icons8.com/color/24/rocket.png"/> Installation & Setup

### Step 1 — Clone the Repository

```bash
git clone https://github.com/<your-username>/eduportal.git
cd eduportal
```

### Step 2 — Create the PostgreSQL Database

Open `psql` or pgAdmin and run:

```sql
CREATE DATABASE college_academic;
```

Then connect to the database and run the schema:

```bash
psql -U postgres -d college_academic -f backend/src/sql/schema.sql
```

> This creates all seven relational tables: `students`, `faculty`, `courses`, `enrollments`, `marks`, `attendance`, and `gpa_records`.

### Step 3 — Configure Environment Variables

Navigate to the `backend/` directory and create a `.env` file:

```bash
cd backend
cp .env.example .env   # or create it manually (see section below)
```

Fill in your credentials — see [Environment Variables](#environment-variables).

### Step 4 — Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 5 — (Optional) Seed Sample Data

To populate the database with sample students, faculty, courses, and records for testing:

```bash
npm run seed
```

### Step 6 — Open the Frontend

The frontend is plain HTML/CSS/JS — no build step required. Simply open `frontend/index.html` directly in your browser, or serve it with any static file server:

```bash
# Using Node's http-server (install globally if needed)
npx http-server frontend -p 3000
```

Then navigate to `http://localhost:3000`.

---

## <img src="https://img.icons8.com/color/24/lock-2.png"/> Environment Variables

Create a file at `backend/.env` with the following content:

```env
# Server
PORT=4000

# JWT — change this to a long, random secret in production
JWT_SECRET=your_super_secret_key_here

# PostgreSQL
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=your_postgres_password
PG_DB=college_academic

# MongoDB
MONGO_URI=mongodb://localhost:27017/college_academic
```

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port the Express server listens on | `4000` |
| `JWT_SECRET` | Secret key for signing JWT tokens | *(required)* |
| `PG_HOST` | PostgreSQL host | `localhost` |
| `PG_PORT` | PostgreSQL port | `5432` |
| `PG_USER` | PostgreSQL username | `postgres` |
| `PG_PASSWORD` | PostgreSQL password | *(required)* |
| `PG_DB` | PostgreSQL database name | `college_academic` |
| `MONGO_URI` | MongoDB connection URI | `mongodb://localhost:27017/college_academic` |

> <img src="https://img.icons8.com/color/16/warning-shield.png"/> **Never commit your `.env` file.** It is already included in `.gitignore`.

---

## <img src="https://img.icons8.com/color/24/circled-play.png"/> Running the Application

### Start the Backend Server

```bash
cd backend

# Development (auto-restarts on file changes)
npm run dev

# Production
npm start
```

The API will be available at: **`http://localhost:4000`**

### Start the Frontend

Open `frontend/index.html` in your browser, or serve it:

```bash
npx http-server frontend -p 3000
```

Frontend available at: **`http://localhost:3000`**

> Make sure the backend is running before opening the frontend — all API calls target `http://localhost:4000/api`.

---

## <img src="https://img.icons8.com/color/24/api-settings.png"/> API Reference

All routes are prefixed with `/api`. Protected routes require the header:
```
Authorization: Bearer <token>
```

### Authentication

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register/student` | Public | Register a new student |
| `POST` | `/api/auth/register/faculty` | Public | Register a new faculty member |
| `POST` | `/api/auth/login` | Public | Login and receive a JWT |
| `GET` | `/api/auth/me` | Any | Validate current session |

### Marks

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `POST` | `/api/marks` | Faculty | Enter marks for a student in a course |
| `GET` | `/api/marks/student/:id` | Any | Get all marks + GPA for a student |
| `PUT` | `/api/marks/:id` | Faculty | Update existing mark record |
| `DELETE` | `/api/marks/:id` | Faculty | Delete a mark record |

### Attendance

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `POST` | `/api/attendance` | Faculty | Record a single attendance entry |
| `GET` | `/api/attendance/student/:id` | Any | Get all attendance records for a student |
| `GET` | `/api/attendance/student/:id/summary` | Any | Get per-course attendance percentages |
| `GET` | `/api/attendance/student/:id/course/:cid` | Any | Get session-level detail for a course |

### Leave

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `POST` | `/api/leave` | Student | Submit a leave request |
| `GET` | `/api/leave/student/:id` | Any | Get leave requests for a student |
| `GET` | `/api/leave` | Faculty | Get all leave requests |
| `POST` | `/api/leave/:id/approve` | Faculty | Approve leave + sync to attendance |
| `POST` | `/api/leave/:id/reject` | Faculty | Reject a leave request |

### Courses

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/api/courses` | Any | List all courses |
| `GET` | `/api/courses/my-enrollments` | Student | Get enrolled courses for current student |
| `POST` | `/api/courses/enroll` | Student | Enroll in a course |
| `GET` | `/api/courses/students` | Faculty | List all students |

### Materials

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/api/materials/catalog` | Any | Get all courses with uploaded materials |
| `GET` | `/api/materials/course/:id` | Any | Get materials for a specific course |
| `POST` | `/api/materials/upload` | Faculty | Upload a file for a course (multipart) |

---

## <img src="https://img.icons8.com/color/24/database.png"/> Database Schema

### PostgreSQL — Relational Tables

```
students        faculty         courses
──────────      ───────         ───────
student_id PK   faculty_id PK   course_id PK
name            name            course_name
email (UNIQUE)  email (UNIQUE)  credits
branch          department      department
semester        password_hash
password_hash

enrollments     marks               attendance
───────────     ─────               ──────────
enrollment_id   mark_id PK          attendance_id PK
student_id FK   student_id FK       student_id FK
course_id FK    course_id FK        course_id FK
                mid_marks           date
                end_marks           status (Present/Absent/Leave)
                total_marks
                grade
                updated_at

gpa_records
───────────
gpa_id PK
student_id FK
semester
gpa
updated_at
```

### MongoDB — Collections

| Collection | Description |
|------------|-------------|
| `leave_requests` | Student leave applications with status tracking |
| `course_materials` | Uploaded files and metadata per course |
| `audit_logs` | Immutable log of all marks add/update/delete operations |
| `notifications` | Academic notifications per student |
| `portfolios` | Student portfolios (resumes, projects, achievements) |

---

## <img src="https://img.icons8.com/color/24/key.png"/> Default Credentials

If you ran `npm run seed`, the following demo accounts are available:

| Role | Email | Password |
|------|-------|----------|
| Faculty | `faculty@college.edu` | `password123` |
| Student | `student@college.edu` | `password123` |

> These are for development and testing only. Change them in production.

---

## <img src="https://img.icons8.com/color/24/wrench.png"/> Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | Server-side JavaScript runtime |
| **Express.js** | HTTP framework and routing |
| **Sequelize** | ORM for PostgreSQL |
| **Mongoose** | ODM for MongoDB |
| **jsonwebtoken** | Stateless JWT-based authentication |
| **bcryptjs** | Password hashing |
| **multer** | File upload handling |
| **morgan** | HTTP request logging |
| **dotenv** | Environment configuration |
| **nodemon** | Development auto-restart |

### Frontend
| Technology | Purpose |
|------------|---------|
| **HTML5** | Semantic document structure |
| **CSS3** | Responsive layout and theming |
| **Vanilla JavaScript (ES6+)** | Client-side logic and API consumption |
| **Google Fonts — Inter** | UI typography |

### Databases
| Database | Role |
|----------|------|
| **PostgreSQL** | Structured relational data with referential integrity |
| **MongoDB** | Flexible document storage for variable-schema data |

---

