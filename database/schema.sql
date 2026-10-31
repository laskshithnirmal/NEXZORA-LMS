-- =============================================================
-- NEXZORA LMS - MySQL 8 schema (reference)
--
-- You do NOT need to run this manually: the backend creates and
-- updates these tables on startup from the JPA entity classes
-- (spring.jpa.hibernate.ddl-auto=update).
--
-- Column types below match what Hibernate 6.5 generates on MySQL 8
-- (checked with SHOW CREATE TABLE on 31 October 2026), including the
-- ENUM columns for Java enums. Hibernate gives foreign-key and unique
-- constraints generated names such as FK4tv5efpqhlo8xg8l8dpba8v75;
-- readable names are used here so the script is easier to review.
-- The only explicitly named constraint in the code is
-- uk_enrollment_student_class (Enrollment.java).
--
-- Foreign keys do not cascade. Deleting a class or user is handled in
-- the service layer, which removes or detaches dependent rows in the
-- same transaction (ClassService.delete, UserService.delete).
-- =============================================================

CREATE DATABASE IF NOT EXISTS nexzora_lms CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE nexzora_lms;

CREATE TABLE IF NOT EXISTS users (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    active      BIT(1)       NOT NULL,
    created_at  DATETIME(6)  NOT NULL,
    email       VARCHAR(120) NOT NULL,
    full_name   VARCHAR(100) NOT NULL,
    password    VARCHAR(255) NOT NULL,                     -- BCrypt hash, never plain text
    phone       VARCHAR(20)  DEFAULT NULL,
    role        ENUM('ADMIN','STUDENT','TEACHER') NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_users_email UNIQUE (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS classes (
    id               BIGINT        NOT NULL AUTO_INCREMENT,
    active           BIT(1)        NOT NULL,              -- open for enrollment
    course_code      VARCHAR(20)   NOT NULL,
    created_at       DATETIME(6)   NOT NULL,
    description      VARCHAR(1000) DEFAULT NULL,
    enrollment_code  VARCHAR(20)   NOT NULL,
    fee              DECIMAL(10,2) DEFAULT NULL,
    name             VARCHAR(120)  NOT NULL,
    schedule         VARCHAR(100)  DEFAULT NULL,
    teacher_id       BIGINT        DEFAULT NULL,          -- NULL = no teacher assigned
    PRIMARY KEY (id),
    CONSTRAINT uk_classes_enrollment_code UNIQUE (enrollment_code),
    CONSTRAINT fk_classes_teacher FOREIGN KEY (teacher_id) REFERENCES users (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS enrollments (
    id           BIGINT      NOT NULL AUTO_INCREMENT,
    enrolled_at  DATETIME(6) NOT NULL,
    class_id     BIGINT      NOT NULL,
    student_id   BIGINT      NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_enrollment_student_class UNIQUE (student_id, class_id),
    CONSTRAINT fk_enrollments_student FOREIGN KEY (student_id) REFERENCES users (id),
    CONSTRAINT fk_enrollments_class   FOREIGN KEY (class_id)   REFERENCES classes (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS learning_materials (
    id           BIGINT        NOT NULL AUTO_INCREMENT,
    created_at   DATETIME(6)   NOT NULL,
    description  VARCHAR(1000) DEFAULT NULL,
    file_name    VARCHAR(255)  DEFAULT NULL,              -- original file name (PDF)
    file_path    VARCHAR(255)  DEFAULT NULL,              -- stored UUID file name (PDF)
    file_size    BIGINT        DEFAULT NULL,
    title        VARCHAR(150)  NOT NULL,
    type         ENUM('PDF','VIDEO') NOT NULL,
    video_url    VARCHAR(500)  DEFAULT NULL,              -- lesson link (VIDEO)
    class_id     BIGINT        NOT NULL,
    uploaded_by  BIGINT        DEFAULT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_materials_class FOREIGN KEY (class_id)    REFERENCES classes (id),
    CONSTRAINT fk_materials_user  FOREIGN KEY (uploaded_by) REFERENCES users (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS announcements (
    id          BIGINT        NOT NULL AUTO_INCREMENT,
    content     VARCHAR(3000) NOT NULL,
    created_at  DATETIME(6)   NOT NULL,
    title       VARCHAR(150)  NOT NULL,
    author_id   BIGINT        DEFAULT NULL,               -- NULL after the author is deleted
    class_id    BIGINT        DEFAULT NULL,               -- NULL = visible to all users
    PRIMARY KEY (id),
    CONSTRAINT fk_announcements_author FOREIGN KEY (author_id) REFERENCES users (id),
    CONSTRAINT fk_announcements_class  FOREIGN KEY (class_id)  REFERENCES classes (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payments (
    id            BIGINT        NOT NULL AUTO_INCREMENT,
    amount        DECIMAL(10,2) NOT NULL,
    created_at    DATETIME(6)   NOT NULL,
    description   VARCHAR(255)  DEFAULT NULL,
    method        VARCHAR(30)   DEFAULT NULL,
    payment_date  DATE          NOT NULL,
    reference     VARCHAR(60)   DEFAULT NULL,
    status        ENUM('OVERDUE','PAID','PENDING') NOT NULL,
    class_id      BIGINT        DEFAULT NULL,             -- NULL = general payment / class deleted
    student_id    BIGINT        NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_payments_student FOREIGN KEY (student_id) REFERENCES users (id),
    CONSTRAINT fk_payments_class   FOREIGN KEY (class_id)   REFERENCES classes (id)
) ENGINE=InnoDB;
