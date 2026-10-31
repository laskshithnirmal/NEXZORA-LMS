package com.nexzora.lms.service;

import com.nexzora.lms.dto.Requests.ClassRequest;
import com.nexzora.lms.dto.Responses.ClassDto;
import com.nexzora.lms.entity.CourseClass;
import com.nexzora.lms.entity.LearningMaterial;
import com.nexzora.lms.entity.Role;
import com.nexzora.lms.entity.User;
import com.nexzora.lms.exception.ApiException;
import com.nexzora.lms.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static com.nexzora.lms.util.TextUtils.isBlank;
import static com.nexzora.lms.util.TextUtils.trimToNull;

@Service
public class ClassService {

    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final CourseClassRepository classRepository;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final LearningMaterialRepository materialRepository;
    private final AnnouncementRepository announcementRepository;
    private final PaymentRepository paymentRepository;
    private final FileStorageService fileStorage;

    public ClassService(CourseClassRepository classRepository, UserRepository userRepository,
                        EnrollmentRepository enrollmentRepository, LearningMaterialRepository materialRepository,
                        AnnouncementRepository announcementRepository, PaymentRepository paymentRepository,
                        FileStorageService fileStorage) {
        this.classRepository = classRepository;
        this.userRepository = userRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.materialRepository = materialRepository;
        this.announcementRepository = announcementRepository;
        this.paymentRepository = paymentRepository;
        this.fileStorage = fileStorage;
    }

    // ---------- lookups & access checks (shared by other services) ----------

    public CourseClass find(Long id) {
        return classRepository.findById(id).orElseThrow(() -> ApiException.notFound("Class"));
    }

    /** Admins see everything; teachers only their classes; students only classes they joined. */
    public CourseClass findAccessible(Long classId, User user) {
        CourseClass c = find(classId);
        boolean allowed = switch (user.getRole()) {
            case ADMIN -> true;
            case TEACHER -> isTeacherOf(c, user);
            case STUDENT -> enrollmentRepository.existsByStudentIdAndCourseClassId(user.getId(), classId);
        };
        if (!allowed) {
            throw ApiException.forbidden("You do not have access to this class");
        }
        return c;
    }

    public boolean isTeacherOf(CourseClass c, User user) {
        return c.getTeacher() != null && c.getTeacher().getId().equals(user.getId());
    }

    // ---------- admin ----------

    @Transactional(readOnly = true)
    public List<ClassDto> listAll() {
        return classRepository.findAllByOrderByCreatedAtDesc().stream().map(c -> toDto(c, true, false)).toList();
    }

    @Transactional
    public ClassDto create(ClassRequest req) {
        CourseClass c = new CourseClass();
        apply(c, req);
        String code = isBlank(req.enrollmentCode()) ? generateUniqueCode() : req.enrollmentCode().trim().toUpperCase();
        if (classRepository.existsByEnrollmentCodeIgnoreCase(code)) {
            throw ApiException.conflict("This enrollment code is already used by another class");
        }
        c.setEnrollmentCode(code);
        return toDto(classRepository.save(c), true, false);
    }

    @Transactional
    public ClassDto update(Long id, ClassRequest req) {
        CourseClass c = find(id);
        apply(c, req);
        if (!isBlank(req.enrollmentCode())) {
            String code = req.enrollmentCode().trim().toUpperCase();
            if (!code.equalsIgnoreCase(c.getEnrollmentCode()) && classRepository.existsByEnrollmentCodeIgnoreCase(code)) {
                throw ApiException.conflict("This enrollment code is already used by another class");
            }
            c.setEnrollmentCode(code);
        }
        return toDto(c, true, false);
    }

    @Transactional
    public ClassDto assignTeacher(Long classId, Long teacherId) {
        CourseClass c = find(classId);
        c.setTeacher(teacherId == null ? null : findTeacher(teacherId));
        return toDto(c, true, false);
    }

    @Transactional
    public void delete(Long id) {
        CourseClass c = find(id);
        for (LearningMaterial m : materialRepository.findByCourseClassIdOrderByCreatedAtDesc(id)) {
            fileStorage.delete(m.getFilePath());
            materialRepository.delete(m);
        }
        enrollmentRepository.deleteByClassId(id);
        announcementRepository.deleteByClassId(id);
        paymentRepository.clearClass(id);
        classRepository.delete(c);
    }

    // ---------- teacher ----------

    @Transactional(readOnly = true)
    public List<ClassDto> listForTeacher(User teacher) {
        return classRepository.findByTeacherIdOrderByNameAsc(teacher.getId()).stream()
                .map(c -> toDto(c, true, false)).toList();
    }

    // ---------- student ----------

    /** Active classes; codes hidden so students must get the code from their teacher. */
    @Transactional(readOnly = true)
    public List<ClassDto> listAvailableForStudent(User student) {
        Set<Long> joined = enrolledClassIds(student);
        return classRepository.findByActiveTrueOrderByNameAsc().stream()
                .map(c -> toDto(c, false, joined.contains(c.getId()))).toList();
    }

    @Transactional(readOnly = true)
    public List<ClassDto> listEnrolledForStudent(User student) {
        return enrollmentRepository.findByStudentIdOrderByEnrolledAtDesc(student.getId()).stream()
                .map(e -> toDto(e.getCourseClass(), false, true)).toList();
    }

    @Transactional(readOnly = true)
    public ClassDto getForUser(Long classId, User user) {
        CourseClass c = findAccessible(classId, user);
        return toDto(c, user.getRole() != Role.STUDENT, user.getRole() == Role.STUDENT);
    }

    public Set<Long> enrolledClassIds(User student) {
        return enrollmentRepository.findByStudentIdOrderByEnrolledAtDesc(student.getId()).stream()
                .map(e -> e.getCourseClass().getId()).collect(Collectors.toSet());
    }

    // ---------- helpers ----------

    private void apply(CourseClass c, ClassRequest req) {
        c.setName(req.name().trim());
        c.setCourseCode(req.courseCode().trim().toUpperCase());
        c.setDescription(trimToNull(req.description()));
        c.setSchedule(trimToNull(req.schedule()));
        c.setFee(req.fee());
        if (req.active() != null) {
            c.setActive(req.active());
        }
        c.setTeacher(req.teacherId() == null ? null : findTeacher(req.teacherId()));
    }

    private User findTeacher(Long teacherId) {
        User t = userRepository.findById(teacherId).orElseThrow(() -> ApiException.notFound("Teacher"));
        if (t.getRole() != Role.TEACHER) {
            throw ApiException.badRequest("Selected user is not a teacher");
        }
        return t;
    }

    private String generateUniqueCode() {
        String code;
        do {
            StringBuilder sb = new StringBuilder(8);
            for (int i = 0; i < 8; i++) {
                sb.append(CODE_CHARS.charAt(RANDOM.nextInt(CODE_CHARS.length())));
            }
            code = sb.toString();
        } while (classRepository.existsByEnrollmentCodeIgnoreCase(code));
        return code;
    }

    /** Builds the response with live student/material counts. Shared with EnrollmentService. */
    ClassDto toDto(CourseClass c, boolean includeCode, boolean enrolled) {
        return ClassDto.from(c, includeCode, enrollmentRepository.countByCourseClassId(c.getId()),
                materialRepository.countByCourseClassId(c.getId()), enrolled);
    }
}
