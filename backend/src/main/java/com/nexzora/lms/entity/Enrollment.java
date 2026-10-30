package com.nexzora.lms.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "enrollments",
        uniqueConstraints = @UniqueConstraint(name = "uk_enrollment_student_class", columnNames = {"student_id", "class_id"}))
public class Enrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "class_id", nullable = false)
    private CourseClass courseClass;

    @Column(name = "enrolled_at", nullable = false, updatable = false)
    private LocalDateTime enrolledAt;

    protected Enrollment() {
    }

    public Enrollment(User student, CourseClass courseClass) {
        this.student = student;
        this.courseClass = courseClass;
    }

    @PrePersist
    void onCreate() {
        enrolledAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public User getStudent() { return student; }
    public CourseClass getCourseClass() { return courseClass; }
    public LocalDateTime getEnrolledAt() { return enrolledAt; }
}
