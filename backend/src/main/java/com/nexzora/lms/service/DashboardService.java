package com.nexzora.lms.service;

import com.nexzora.lms.dto.Responses.EnrollmentDto;
import com.nexzora.lms.entity.PaymentStatus;
import com.nexzora.lms.entity.Role;
import com.nexzora.lms.entity.User;
import com.nexzora.lms.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

/** Summary numbers shown on each role's dashboard. */
@Service
public class DashboardService {

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
    public Map<String, Object> admin(User admin) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("students", userRepository.countByRole(Role.STUDENT));
        m.put("teachers", userRepository.countByRole(Role.TEACHER));
        m.put("classes", classRepository.count());
        m.put("enrollments", enrollmentRepository.count());
        m.put("totalPaid", paymentRepository.sumByStatus(PaymentStatus.PAID));
        m.put("totalPending", paymentRepository.sumByStatus(PaymentStatus.PENDING)
                .add(paymentRepository.sumByStatus(PaymentStatus.OVERDUE)));
        m.put("recentEnrollments", enrollmentRepository.findAllByOrderByEnrolledAtDesc().stream()
                .limit(5).map(EnrollmentDto::from).toList());
        m.put("recentAnnouncements", announcementService.listFor(admin).stream().limit(5).toList());
        return m;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> teacher(User teacher) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("classes", classRepository.countByTeacherId(teacher.getId()));
        m.put("students", enrollmentRepository.countDistinctStudentsByTeacher(teacher.getId()));
        m.put("materials", materialRepository.countByCourseClassTeacherId(teacher.getId()));
        m.put("myClasses", classService.listForTeacher(teacher));
        m.put("recentAnnouncements", announcementService.listFor(teacher).stream().limit(5).toList());
        return m;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> student(User student) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("enrolledClasses", enrollmentRepository.countByStudentId(student.getId()));
        m.put("totalPaid", paymentRepository.sumByStudentAndStatus(student.getId(), PaymentStatus.PAID));
        m.put("totalPending", paymentRepository.sumByStudentAndStatus(student.getId(), PaymentStatus.PENDING)
                .add(paymentRepository.sumByStudentAndStatus(student.getId(), PaymentStatus.OVERDUE)));
        m.put("myClasses", classService.listEnrolledForStudent(student));
        m.put("recentAnnouncements", announcementService.listFor(student).stream().limit(5).toList());
        return m;
    }
}
