-- =============================================================
-- NEXZORA LMS - MySQL schema (reference)
--
-- You do NOT need to run this manually: the backend creates and
-- updates these tables automatically on startup
-- (spring.jpa.hibernate.ddl-auto=update).
-- It is provided for documentation, review, or manual setup.
-- =============================================================

CREATE DATABASE IF NOT EXISTS nexzora_lms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nexzora_lms;

CREATE TABLE IF NOT EXISTS users (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name   VARCHAR(100) NOT NULL,
    email       VARCHAR(120) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,              -- BCrypt hash
    role        VARCHAR(20)  NOT NULL,              -- ADMIN | TEACHER | STUDENT
    phone       VARCHAR(20),
    active      BIT          NOT NULL DEFAULT 1,
    created_at  DATETIME(6)  NOT NULL
);

CREATE TABLE IF NOT EXISTS classes (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    name             VARCHAR(120)  NOT NULL,
    course_code      VARCHAR(20)   NOT NULL,
    description      VARCHAR(1000),
    enrollment_code  VARCHAR(20)   NOT NULL UNIQUE,
    schedule         VARCHAR(100),
    fee              DECIMAL(10,2) DEFAULT 0,
    teacher_id       BIGINT,
    active           BIT           NOT NULL DEFAULT 1,
    created_at       DATETIME(6)   NOT NULL,
    CONSTRAINT fk_classes_teacher FOREIGN KEY (teacher_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS enrollments (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id   BIGINT      NOT NULL,
    class_id     BIGINT      NOT NULL,
    enrolled_at  DATETIME(6) NOT NULL,
    CONSTRAINT uk_enrollment_student_class UNIQUE (student_id, class_id),
    CONSTRAINT fk_enrollments_student FOREIGN KEY (student_id) REFERENCES users (id),
    CONSTRAINT fk_enrollments_class   FOREIGN KEY (class_id)   REFERENCES classes (id)
);

CREATE TABLE IF NOT EXISTS learning_materials (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    class_id     BIGINT        NOT NULL,
    title        VARCHAR(150)  NOT NULL,
    description  VARCHAR(1000),
    type         VARCHAR(10)   NOT NULL,            -- PDF | VIDEO
    file_path    VARCHAR(255),                      -- stored file name (PDF)
    file_name    VARCHAR(255),                      -- original file name (PDF)
    file_size    BIGINT,
    video_url    VARCHAR(500),                      -- lesson link (VIDEO)
    uploaded_by  BIGINT,
    created_at   DATETIME(6)   NOT NULL,
    CONSTRAINT fk_materials_class FOREIGN KEY (class_id)    REFERENCES classes (id),
    CONSTRAINT fk_materials_user  FOREIGN KEY (uploaded_by) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS announcements (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(150)  NOT NULL,
    content     VARCHAR(3000) NOT NULL,
    author_id   BIGINT,
    class_id    BIGINT,                             -- NULL = visible to everyone
    created_at  DATETIME(6)   NOT NULL,
    CONSTRAINT fk_announcements_author FOREIGN KEY (author_id) REFERENCES users (id),
    CONSTRAINT fk_announcements_class  FOREIGN KEY (class_id)  REFERENCES classes (id)
);

CREATE TABLE IF NOT EXISTS payments (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id    BIGINT        NOT NULL,
    class_id      BIGINT,
    amount        DECIMAL(10,2) NOT NULL,
    status        VARCHAR(20)   NOT NULL,           -- PAID | PENDING | OVERDUE
    method        VARCHAR(30),
    reference     VARCHAR(60),
    description   VARCHAR(255),
    payment_date  DATE          NOT NULL,
    created_at    DATETIME(6)   NOT NULL,
    CONSTRAINT fk_payments_student FOREIGN KEY (student_id) REFERENCES users (id),
    CONSTRAINT fk_payments_class   FOREIGN KEY (class_id)   REFERENCES classes (id)
);
