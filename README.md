# NEXZORA LMS

A university-level Learning Management System with three roles — **Admin**, **Teacher** and **Student**.

| Layer     | Technology                                  |
|-----------|---------------------------------------------|
| Frontend  | React 18 + Vite 5, Tailwind CSS, React Router |
| Backend   | Java 17, Spring Boot 3.3, Spring Security + JWT |
| Database  | MySQL 8                                     |
| Build     | Maven (wrapper included — no install needed) |

## Features

**Admin** — dashboard with statistics · manage students and teachers (create / edit / deactivate / delete) ·
manage classes · assign teachers to classes · view and remove enrollments · manage payment records ·
publish announcements (to everyone or to one class).

**Teacher** — dashboard · view assigned classes · see enrolled students · upload PDF materials ·
add lesson video links (YouTube / Vimeo play inside the LMS) · publish class announcements.

**Student** — self-registration and login · dashboard · browse available classes · join a class with
its enrollment code · view enrolled classes · open PDFs · watch lesson videos · read announcements ·
view payment history.

## Project structure

```
LMS-Project/
├── backend/                  Spring Boot REST API
│   ├── src/main/java/com/nexzora/lms/
│   │   ├── config/           Security config, first-run data seeder
│   │   ├── controller/       Auth, Admin, Teacher, Student, Material endpoints
│   │   ├── dto/              Request (validated) and response records
│   │   ├── entity/           JPA entities (users, classes, enrollments, ...)
│   │   ├── exception/        Consistent JSON error responses
│   │   ├── repository/       Spring Data JPA repositories
│   │   ├── security/         JWT service + filter
│   │   └── service/          Business logic and access checks
│   ├── src/test/             End-to-end API tests (H2 in-memory DB)
│   ├── .env.example          Template for your local secrets
│   └── mvnw / mvnw.cmd       Maven wrapper
├── frontend/                 React + Vite app
│   └── src/
│       ├── api/              Axios client (JWT header, error helpers)
│       ├── components/       Layout, sidebar, cards, modals, tables
│       ├── context/          Auth state
│       ├── pages/            admin/, teacher/, student/ and shared pages
│       └── utils/            Form validation and formatting
└── database/schema.sql       Reference MySQL schema
```

## Prerequisites

- **Java 17+** (`java -version`)
- **Node.js 18+** (`node -v`)
- **MySQL 8** running locally

## Setup

### 1. Configure the backend

```bash
cd backend
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
```

Edit `backend/.env` and set at least:

```properties
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
JWT_SECRET=a_long_random_string_of_at_least_32_characters
ADMIN_PASSWORD=choose_a_strong_password
```

`.env` is git-ignored, so your credentials are never committed.
The database `nexzora_lms` and all tables are created automatically on first start.

### 2. Start the backend (port 8080)

```bash
cd backend
./mvnw spring-boot:run      # Windows: mvnw.cmd spring-boot:run
```

The first run downloads Maven and the dependencies, so it can take a few minutes.

### 3. Start the frontend (port 5173)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. The Vite dev server proxies `/api` to the backend.

## Default accounts

On the first start with an empty database, the backend creates:

| Role    | Email                | Password                          |
|---------|----------------------|-----------------------------------|
| Admin   | `admin@nexzora.lk`   | value of `ADMIN_PASSWORD` (default `Admin@123`) |
| Teacher | `teacher@nexzora.lk` | `Teacher@123` *(demo data)*       |
| Student | `student@nexzora.lk` | `Student@123` *(demo data)*       |

Demo data (one teacher, one student, two classes with enrollment codes `SE2026A` and `DB2026A`) is
created only when `SEED_DEMO_DATA=true`. Set it to `false` for a clean installation, and change the
default passwords before any real use.

## Running the tests

```bash
cd backend
./mvnw test                 # Windows: mvnw.cmd test
```

The tests use an in-memory H2 database (no MySQL needed) and cover login, registration, validation,
role-based access, class creation, teacher assignment, enrollment by code, PDF upload/download,
video links, announcements, payments, dashboards and cascading deletes.

## Production build

```bash
cd frontend && npm run build          # output in frontend/dist
cd backend  && ./mvnw clean package   # output in backend/target/nexzora-lms-backend-1.0.0.jar
java -jar backend/target/nexzora-lms-backend-1.0.0.jar
```

If the frontend is served from a different origin than the API, set `VITE_API_URL`
(e.g. `https://api.example.com/api`) before building, and add that origin to `CORS_ORIGINS` in the backend.

## API overview

| Area     | Endpoints |
|----------|-----------|
| Auth     | `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me` |
| Admin    | `/api/admin/dashboard`, `/users?role=`, `/classes`, `/classes/{id}/teacher`, `/enrollments`, `/payments`, `/announcements` |
| Teacher  | `/api/teacher/dashboard`, `/classes`, `/classes/{id}/students`, `/classes/{id}/materials`, `/classes/{id}/materials/pdf`, `/classes/{id}/materials/video`, `/announcements` |
| Student  | `/api/student/dashboard`, `/classes/available`, `/classes`, `/enroll`, `/classes/{id}/materials`, `/announcements`, `/payments` |
| Files    | `GET /api/materials/{id}/file` (PDF, access-checked) |

All endpoints except login/register require `Authorization: Bearer <token>`.

## Security notes

- Passwords are hashed with BCrypt; JWTs are signed with `JWT_SECRET` (HS256, 24 h expiry).
- Role checks on every `/api/admin|teacher|student/**` route, plus ownership checks in the
  services (a teacher only manages their own classes; a student only sees classes they joined).
- Uploaded files are validated as real PDFs (max 20 MB) and stored under `backend/uploads/` with random names.
- `.env`, uploads, build output and IDE files are excluded by `.gitignore`.
