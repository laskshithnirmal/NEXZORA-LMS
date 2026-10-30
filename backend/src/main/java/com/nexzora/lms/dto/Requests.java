package com.nexzora.lms.dto;

import com.nexzora.lms.entity.PaymentStatus;
import com.nexzora.lms.entity.Role;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Incoming request bodies, validated with Jakarta Bean Validation. */
public final class Requests {

    private Requests() {
    }

    private static final String PHONE_REGEX = "^$|^[+0-9 ()-]{7,20}$";
    private static final String PHONE_MSG = "Phone number must be 7-20 digits";

    public record LoginRequest(
            @NotBlank(message = "Email is required") @Email(message = "Enter a valid email") String email,
            @NotBlank(message = "Password is required") String password) {
    }

    public record RegisterRequest(
            @NotBlank(message = "Full name is required") @Size(min = 2, max = 100, message = "Name must be 2-100 characters") String fullName,
            @NotBlank(message = "Email is required") @Email(message = "Enter a valid email") @Size(max = 120) String email,
            @NotBlank(message = "Password is required") @Size(min = 6, max = 64, message = "Password must be 6-64 characters") String password,
            @Pattern(regexp = PHONE_REGEX, message = PHONE_MSG) String phone) {
    }

    /** Used by admins to create/update students and teachers. Password is optional on update. */
    public record UserRequest(
            @NotBlank(message = "Full name is required") @Size(min = 2, max = 100, message = "Name must be 2-100 characters") String fullName,
            @NotBlank(message = "Email is required") @Email(message = "Enter a valid email") @Size(max = 120) String email,
            @Size(max = 64, message = "Password must be at most 64 characters") String password,
            @Pattern(regexp = PHONE_REGEX, message = PHONE_MSG) String phone,
            @NotNull(message = "Role is required") Role role,
            Boolean active) {
    }

    public record ClassRequest(
            @NotBlank(message = "Class name is required") @Size(max = 120) String name,
            @NotBlank(message = "Course code is required") @Size(max = 20, message = "Course code must be at most 20 characters") String courseCode,
            @Size(max = 1000, message = "Description must be at most 1000 characters") String description,
            @Size(max = 100) String schedule,
            @NotNull(message = "Fee is required") @DecimalMin(value = "0.0", message = "Fee cannot be negative") @Digits(integer = 8, fraction = 2) BigDecimal fee,
            Long teacherId,
            Boolean active,
            @Pattern(regexp = "^$|^[A-Za-z0-9-]{4,20}$", message = "Enrollment code must be 4-20 letters, digits or dashes") String enrollmentCode) {
    }

    public record AssignTeacherRequest(Long teacherId) {
    }

    public record EnrollRequest(
            @NotBlank(message = "Enrollment code is required") @Size(max = 20) String enrollmentCode) {
    }

    public record VideoMaterialRequest(
            @NotBlank(message = "Title is required") @Size(max = 150) String title,
            @Size(max = 1000) String description,
            @NotBlank(message = "Video URL is required") @Size(max = 500)
            @Pattern(regexp = "^https?://.+", message = "Video URL must start with http:// or https://") String videoUrl) {
    }

    public record AnnouncementRequest(
            @NotBlank(message = "Title is required") @Size(max = 150) String title,
            @NotBlank(message = "Content is required") @Size(max = 3000, message = "Content must be at most 3000 characters") String content,
            Long classId) {
    }

    public record PaymentRequest(
            @NotNull(message = "Student is required") Long studentId,
            Long classId,
            @NotNull(message = "Amount is required") @DecimalMin(value = "0.01", message = "Amount must be greater than 0") @Digits(integer = 8, fraction = 2) BigDecimal amount,
            @NotNull(message = "Status is required") PaymentStatus status,
            @Size(max = 30) String method,
            @Size(max = 60) String reference,
            @Size(max = 255) String description,
            @NotNull(message = "Payment date is required") LocalDate paymentDate) {
    }
}
