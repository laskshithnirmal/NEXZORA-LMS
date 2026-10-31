package com.nexzora.lms.service;

import com.nexzora.lms.dto.Responses.AdminDashboardDto;
import com.nexzora.lms.dto.Responses.AnnouncementDto;
import com.nexzora.lms.dto.Responses.EnrollmentDto;
import com.nexzora.lms.dto.Responses.StudentDashboardDto;
import com.nexzora.lms.dto.Responses.TeacherDashboardDto;
import com.nexzora.lms.entity.PaymentStatus;
import com.nexzora.lms.entity.Role;
import com.nexzora.lms.entity.User;
import com.nexzora.lms.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/** Summary numbers shown on each role's dashboard. */
@Service
public class DashboardService {

    private static final int RECENT_LIMIT = 5;

    private final UserRepository userRepository;
    private final CourseClassRepository classRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final LearningMaterialRepository materialRepository;
    private final PaymentRepository paymentRepository;
    private final AnnouncementService announcementService;
    private final ClassService classService;

    public DashboardService(UserRepository userRepository, CourseClassRepository classRepository,
                            EnrollmentRepository enrollmentRepository, LearningMaterialRepository materialRepository,
                            PaymentRepository paymentRepository, AnnouncementService announcementService,
                            ClassService classService) {
        this.userRepository = userRepository;
        this.classRepository = classRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.materialRepository = materialRepository;
        this.paymentRepository = paymentRepository;
        this.announcementService = announcementService;
        this.classService = classService;
    }

    @Transactional(readOnly = true)
    public AdminDashboardDto admin(User admin) {
        BigDecimal outstanding = paymentRepository.sumByStatus(PaymentStatus.PENDING)
                .add(paymentRepository.sumByStatus(PaymentStatus.OVERDUE));
        return new AdminDashboardDto(
                userRepository.countByRole(Role.STUDENT),
                userRepository.countByRole(Role.TEACHER),
                classRepository.count(),
                enrollmentRepository.count(),
                paymentRepository.sumByStatus(PaymentStatus.PAID),
                outstanding,
                enrollmentRepository.findTop5ByOrderByEnrolledAtDesc().stream().map(EnrollmentDto::from).toList(),
                recentAnnouncements(admin));
    }

    @Transactional(readOnly = true)
    public TeacherDashboardDto teacher(User teacher) {
        return new TeacherDashboardDto(
                classRepository.countByTeacherId(teacher.getId()),
                enrollmentRepository.countDistinctStudentsByTeacher(teacher.getId()),
                materialRepository.countByCourseClassTeacherId(teacher.getId()),
                classService.listForTeacher(teacher),
                recentAnnouncements(teacher));
    }

    @Transactional(readOnly = true)
    public StudentDashboardDto student(User student) {
        Long id = student.getId();
        BigDecimal outstanding = paymentRepository.sumByStudentAndStatus(id, PaymentStatus.PENDING)
                .add(paymentRepository.sumByStudentAndStatus(id, PaymentStatus.OVERDUE));
        return new StudentDashboardDto(
                enrollmentRepository.countByStudentId(id),
                paymentRepository.sumByStudentAndStatus(id, PaymentStatus.PAID),
                outstanding,
                classService.listEnrolledForStudent(student),
                recentAnnouncements(student));
    }

    private List<AnnouncementDto> recentAnnouncements(User user) {
        return announcementService.listFor(user).stream().limit(RECENT_LIMIT).toList();
    }
}
