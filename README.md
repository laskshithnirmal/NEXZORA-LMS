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
├── start-all.cmd             Windows: start backend + frontend
├── start-backend.cmd         Windows: start backend only
├── start-frontend.cmd        Windows: start frontend only
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
- **MySQL 8** running locally, and its root (or another user's) password
- Maven is **not** required — the included `mvnw.cmd` wrapper downloads it automatically

## MySQL setup

The app only needs a MySQL login — it creates the `nexzora_lms` database and all six tables
(`users`, `classes`, `enrollments`, `learning_materials`, `announcements`, `payments`) by itself.

**Check that your password works** (Command Prompt):

```bat
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p -e "SELECT VERSION();"
```

Enter your password when asked. If it prints a version number, use the same username and password in
`backend\.env`.

**Optional — use a dedicated MySQL user instead of root:**

```sql
CREATE DATABASE IF NOT EXISTS nexzora_lms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'nexzora'@'localhost' IDENTIFIED BY 'choose_a_password';
GRANT ALL PRIVILEGES ON nexzora_lms.* TO 'nexzora'@'localhost';
```

Then set `DB_USERNAME=nexzora` and `DB_PASSWORD=choose_a_password` in `backend\.env`.

**After the first start**, you can confirm the tables were created:

```bat
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p -e "SHOW TABLES FROM nexzora_lms;"
```

## Environment configuration (`backend\.env`)

| Variable | Meaning | Default |
|----------|---------|---------|
| `DB_HOST`, `DB_PORT`, `DB_NAME` | MySQL location and database name | `localhost`, `3306`, `nexzora_lms` |
| `DB_USERNAME`, `DB_PASSWORD` | MySQL login | `root`, *(empty)* |
| `JWT_SECRET` | Key used to sign login tokens — at least 32 characters | random on each start |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | First admin account (created only if no admin exists) | `admin@nexzora.lk`, `Admin@123` |
| `SEED_DEMO_DATA` | Create the demo teacher, student and classes on first start | `true` |
| `UPLOAD_DIR` | Folder for uploaded PDFs | `uploads` |
| `SERVER_PORT` | Backend port | `8080` |
| `CORS_ORIGINS` | Allowed frontend origins | `http://localhost:5173` |

Write values without quotes or spaces around `=`.

## Quick start on Windows

1. **Make sure MySQL is running.** Open *Services* (`services.msc`) and check that **MySQL80** is *Running*.
2. **Set your MySQL password.** Copy `backend\.env.example` to `backend\.env` (if it doesn't exist yet),
   open it in Notepad and fill in:
   ```properties
   DB_USERNAME=root
   DB_PASSWORD=your_mysql_password
   JWT_SECRET=any_random_text_at_least_32_characters_long
   ```
3. **Double-click `start-all.cmd`** in the project folder. Two windows open — one for the backend,
   one for the frontend.
4. When the backend window shows `Started NexzoraLmsApplication`, open **http://localhost:5173**
   and log in as `admin@nexzora.lk` / `Admin@123`.

You do not need to create the database: `nexzora_lms` and all tables are created automatically on
the first start. The **first** start downloads Maven and the backend libraries (a few minutes);
later starts take about 15 seconds.

`backend\.env` is git-ignored, so your password is never committed.

## Manual setup (any OS)

### 1. Configure the backend

```bash
cd backend
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
```

Edit `backend/.env` and set at least `DB_PASSWORD`, `JWT_SECRET` and `ADMIN_PASSWORD`.

### 2. Start the backend (port 8080)

```bash
cd backend
./mvnw spring-boot:run      # Windows: mvnw.cmd spring-boot:run
```

Run this from inside the `backend` folder — that's where the backend looks for `.env`.

### 3. Start the frontend (port 5173)

```bash
cd frontend
npm install                 # first time only
npm run dev
```

Open **http://localhost:5173**. The Vite dev server forwards `/api` requests to the backend.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Access denied for user 'root'@'localhost'` | Wrong or missing `DB_PASSWORD` in `backend\.env`. |
| `Communications link failure` | MySQL isn't running — start the **MySQL80** service. |
| Login page says *Cannot reach the server* | The backend isn't running or is still starting. |
| `Port 8080 was already in use` | Close the other program, or set `SERVER_PORT=8081` in `.env` and start the frontend with `set VITE_BACKEND_URL=http://localhost:8081` first. |
| Logged out after restarting the backend | `JWT_SECRET` is empty in `.env`, so a new random key is used on every start. Set it. |
| Password contains a backslash `\` | `.env` is read as a Java properties file — write each `\` as `\\`. |

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
