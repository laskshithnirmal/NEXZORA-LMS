package com.nexzora.lms.dto;

import com.nexzora.lms.entity.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** Outgoing response bodies. Entities are never serialized directly. */
public final class Responses {

    private Responses() {
    }

    public record AuthResponse(String token, UserDto user) {
    }

    public record UserDto(Long id, String fullName, String email, Role role, String phone,
                          boolean active, LocalDateTime createdAt) {
        public static UserDto from(User u) {
            return new UserDto(u.getId(), u.getFullName(), u.getEmail(), u.getRole(), u.getPhone(),
                    u.isActive(), u.getCreatedAt());
        }
    }

    /**
     * enrollmentCode is only filled in for admins and the class teacher;
     * students must obtain it separately to join.
     */
    public record ClassDto(Long id, String name, String courseCode, String description, String schedule,
                           BigDecimal fee, String enrollmentCode, Long teacherId, String teacherName,
                           boolean active, long studentCount, long materialCount, boolean enrolled,
                           LocalDateTime createdAt) {
        public static ClassDto from(CourseClass c, boolean includeCode, long studentCount,
                                    long materialCount, boolean enrolled) {
            User t = c.getTeacher();
            return new ClassDto(c.getId(), c.getName(), c.getCourseCode(), c.getDescription(), c.getSchedule(),
                    c.getFee(), includeCode ? c.getEnrollmentCode() : null,
                    t == null ? null : t.getId(), t == null ? null : t.getFullName(),
                    c.isActive(), studentCount, materialCount, enrolled, c.getCreatedAt());
        }
    }

    public record EnrollmentDto(Long id, Long studentId, String studentName, String studentEmail,
                                Long classId, String className, String courseCode, LocalDateTime enrolledAt) {
        public static EnrollmentDto from(Enrollment e) {
            User s = e.getStudent();
            CourseClass c = e.getCourseClass();
            return new EnrollmentDto(e.getId(), s.getId(), s.getFullName(), s.getEmail(),
                    c.getId(), c.getName(), c.getCourseCode(), e.getEnrolledAt());
        }
    }

    public record MaterialDto(Long id, Long classId, String title, String description, MaterialType type,
                              String fileName, Long fileSize, String videoUrl, String uploadedBy,
                              LocalDateTime createdAt) {
        public static MaterialDto from(LearningMaterial m) {
            return new MaterialDto(m.getId(), m.getCourseClass().getId(), m.getTitle(), m.getDescription(),
                    m.getType(), m.getFileName(), m.getFileSize(), m.getVideoUrl(),
                    m.getUploadedBy() == null ? null : m.getUploadedBy().getFullName(), m.getCreatedAt());
        }
    }

    public record AnnouncementDto(Long id, String title, String content, Long authorId, String authorName,
                                  Role authorRole, Long classId, String className, LocalDateTime createdAt) {
        public static AnnouncementDto from(Announcement a) {
            User u = a.getAuthor();
            CourseClass c = a.getCourseClass();
            return new AnnouncementDto(a.getId(), a.getTitle(), a.getContent(),
                    u == null ? null : u.getId(), u == null ? "Deleted user" : u.getFullName(),
                    u == null ? null : u.getRole(),
                    c == null ? null : c.getId(), c == null ? null : c.getName(), a.getCreatedAt());
        }
    }

    public record PaymentDto(Long id, Long studentId, String studentName, String studentEmail, Long classId,
                             String className, BigDecimal amount, PaymentStatus status, String method,
                             String reference, String description, LocalDate paymentDate, LocalDateTime createdAt) {
        public static PaymentDto from(Payment p) {
            User s = p.getStudent();
            CourseClass c = p.getCourseClass();
            return new PaymentDto(p.getId(), s.getId(), s.getFullName(), s.getEmail(),
                    c == null ? null : c.getId(), c == null ? null : c.getName(),
                    p.getAmount(), p.getStatus(), p.getMethod(), p.getReference(), p.getDescription(),
                    p.getPaymentDate(), p.getCreatedAt());
        }
    }

    // ---------- dashboards (one record per role) ----------

    /** totalPending includes both PENDING and OVERDUE payments. */
    public record AdminDashboardDto(long students, long teachers, long classes, long enrollments,
                                    BigDecimal totalPaid, BigDecimal totalPending,
                                    List<EnrollmentDto> recentEnrollments, List<AnnouncementDto> recentAnnouncements) {
    }

    public record TeacherDashboardDto(long classes, long students, long materials,
                                      List<ClassDto> myClasses, List<AnnouncementDto> recentAnnouncements) {
    }

    /** totalPending includes both PENDING and OVERDUE payments. */
    public record StudentDashboardDto(long enrolledClasses, BigDecimal totalPaid, BigDecimal totalPending,
                                      List<ClassDto> myClasses, List<AnnouncementDto> recentAnnouncements) {
    }
}
