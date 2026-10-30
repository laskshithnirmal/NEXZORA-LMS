package com.nexzora.lms.service;

import com.nexzora.lms.dto.Responses.ClassDto;
import com.nexzora.lms.dto.Responses.EnrollmentDto;
import com.nexzora.lms.entity.CourseClass;
import com.nexzora.lms.entity.Enrollment;
import com.nexzora.lms.entity.User;
import com.nexzora.lms.exception.ApiException;
import com.nexzora.lms.repository.CourseClassRepository;
import com.nexzora.lms.repository.EnrollmentRepository;
import com.nexzora.lms.repository.LearningMaterialRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final CourseClassRepository classRepository;
    private final LearningMaterialRepository materialRepository;
    private final ClassService classService;

    public EnrollmentService(EnrollmentRepository enrollmentRepository, CourseClassRepository classRepository,
                             LearningMaterialRepository materialRepository, ClassService classService) {
        this.enrollmentRepository = enrollmentRepository;
        this.classRepository = classRepository;
        this.materialRepository = materialRepository;
        this.classService = classService;
    }

    @Transactional
    public ClassDto enrollWithCode(User student, String code) {
        CourseClass c = classRepository.findByEnrollmentCodeIgnoreCase(code.trim())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Invalid enrollment code"));
        if (!c.isActive()) {
            throw ApiException.badRequest("This class is not accepting enrollments");
        }
        if (enrollmentRepository.existsByStudentIdAndCourseClassId(student.getId(), c.getId())) {
            throw ApiException.conflict("You are already enrolled in this class");
        }
        enrollmentRepository.save(new Enrollment(student, c));
        return ClassDto.from(c, false, enrollmentRepository.countByCourseClassId(c.getId()),
                materialRepository.countByCourseClassId(c.getId()), true);
    }

    @Transactional(readOnly = true)
    public List<EnrollmentDto> listAll() {
        return enrollmentRepository.findAllByOrderByEnrolledAtDesc().stream().map(EnrollmentDto::from).toList();
    }

    /** Students of a class, for its teacher (or an admin). */
    @Transactional(readOnly = true)
    public List<EnrollmentDto> listForClass(Long classId, User user) {
        classService.findAccessible(classId, user);
        return enrollmentRepository.findByCourseClassIdOrderByEnrolledAtDesc(classId).stream()
                .map(EnrollmentDto::from).toList();
    }

    @Transactional
    public void delete(Long id) {
        if (!enrollmentRepository.existsById(id)) {
            throw ApiException.notFound("Enrollment");
        }
        enrollmentRepository.deleteById(id);
    }
}
