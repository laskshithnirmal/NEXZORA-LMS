package com.nexzora.lms.service;

import com.nexzora.lms.dto.Requests.UserRequest;
import com.nexzora.lms.dto.Responses.UserDto;
import com.nexzora.lms.entity.Role;
import com.nexzora.lms.entity.User;
import com.nexzora.lms.exception.ApiException;
import com.nexzora.lms.repository.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static com.nexzora.lms.util.TextUtils.trimToNull;

/** Admin management of student and teacher accounts. */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EnrollmentRepository enrollmentRepository;
    private final PaymentRepository paymentRepository;
    private final CourseClassRepository classRepository;
    private final LearningMaterialRepository materialRepository;
    private final AnnouncementRepository announcementRepository;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       EnrollmentRepository enrollmentRepository, PaymentRepository paymentRepository,
                       CourseClassRepository classRepository, LearningMaterialRepository materialRepository,
                       AnnouncementRepository announcementRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.enrollmentRepository = enrollmentRepository;
        this.paymentRepository = paymentRepository;
        this.classRepository = classRepository;
        this.materialRepository = materialRepository;
        this.announcementRepository = announcementRepository;
    }

    @Transactional(readOnly = true)
    public List<UserDto> list(Role role) {
        return userRepository.findByRoleOrderByCreatedAtDesc(role).stream().map(UserDto::from).toList();
    }

    @Transactional
    public UserDto create(UserRequest req) {
        requireManageableRole(req.role());
        String email = req.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("An account with this email already exists");
        }
        if (req.password() == null || req.password().length() < 6) {
            throw ApiException.badRequest("Password must be at least 6 characters");
        }
        User user = new User();
        apply(user, req, email);
        user.setRole(req.role());
        user.setPassword(passwordEncoder.encode(req.password()));
        return UserDto.from(userRepository.save(user));
    }

    @Transactional
    public UserDto update(Long id, UserRequest req) {
        User user = userRepository.findById(id).orElseThrow(() -> ApiException.notFound("User"));
        requireManageableRole(user.getRole());
        String email = req.email().trim().toLowerCase();
        if (!user.getEmail().equalsIgnoreCase(email) && userRepository.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("An account with this email already exists");
        }
        apply(user, req, email);
        if (req.password() != null && !req.password().isBlank()) {
            if (req.password().length() < 6) {
                throw ApiException.badRequest("Password must be at least 6 characters");
            }
            user.setPassword(passwordEncoder.encode(req.password()));
        }
        return UserDto.from(user);
    }

    @Transactional
    public void delete(Long id, User actingAdmin) {
        User user = userRepository.findById(id).orElseThrow(() -> ApiException.notFound("User"));
        if (user.getId().equals(actingAdmin.getId())) {
            throw ApiException.badRequest("You cannot delete your own account");
        }
        requireManageableRole(user.getRole());
        // Remove or detach everything that references this user.
        enrollmentRepository.deleteByStudentId(id);
        paymentRepository.deleteByStudentId(id);
        classRepository.unassignTeacher(id);
        materialRepository.clearUploader(id);
        announcementRepository.clearAuthor(id);
        userRepository.delete(user);
    }

    private void apply(User user, UserRequest req, String email) {
        user.setFullName(req.fullName().trim());
        user.setEmail(email);
        user.setPhone(trimToNull(req.phone()));
        if (req.active() != null) {
            user.setActive(req.active());
        }
    }

    private void requireManageableRole(Role role) {
        if (role != Role.STUDENT && role != Role.TEACHER) {
            throw ApiException.badRequest("Only student and teacher accounts can be managed here");
        }
    }
}
