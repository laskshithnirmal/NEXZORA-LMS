package com.nexzora.lms.service;

import com.nexzora.lms.dto.Requests.PaymentRequest;
import com.nexzora.lms.dto.Responses.PaymentDto;
import com.nexzora.lms.entity.CourseClass;
import com.nexzora.lms.entity.Payment;
import com.nexzora.lms.entity.Role;
import com.nexzora.lms.entity.User;
import com.nexzora.lms.exception.ApiException;
import com.nexzora.lms.repository.CourseClassRepository;
import com.nexzora.lms.repository.EnrollmentRepository;
import com.nexzora.lms.repository.PaymentRepository;
import com.nexzora.lms.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

import static com.nexzora.lms.util.TextUtils.trimToNull;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final CourseClassRepository classRepository;
    private final EnrollmentRepository enrollmentRepository;

    public PaymentService(PaymentRepository paymentRepository, UserRepository userRepository,
                          CourseClassRepository classRepository, EnrollmentRepository enrollmentRepository) {
        this.paymentRepository = paymentRepository;
        this.userRepository = userRepository;
        this.classRepository = classRepository;
        this.enrollmentRepository = enrollmentRepository;
    }

    @Transactional(readOnly = true)
    public List<PaymentDto> listAll() {
        return paymentRepository.findAllByOrderByPaymentDateDescIdDesc().stream().map(PaymentDto::from).toList();
    }

    @Transactional(readOnly = true)
    public List<PaymentDto> listForStudent(User student) {
        return paymentRepository.findByStudentIdOrderByPaymentDateDescIdDesc(student.getId()).stream()
                .map(PaymentDto::from).toList();
    }

    @Transactional
    public PaymentDto create(PaymentRequest req) {
        Payment p = new Payment();
        apply(p, req);
        return PaymentDto.from(paymentRepository.save(p));
    }

    @Transactional
    public PaymentDto update(Long id, PaymentRequest req) {
        Payment p = paymentRepository.findById(id).orElseThrow(() -> ApiException.notFound("Payment"));
        apply(p, req);
        return PaymentDto.from(p);
    }

    @Transactional
    public void delete(Long id) {
        if (!paymentRepository.existsById(id)) {
            throw ApiException.notFound("Payment");
        }
        paymentRepository.deleteById(id);
    }

    private void apply(Payment p, PaymentRequest req) {
        User student = userRepository.findById(req.studentId()).orElseThrow(() -> ApiException.notFound("Student"));
        if (student.getRole() != Role.STUDENT) {
            throw ApiException.badRequest("Payments can only be recorded for students");
        }
        CourseClass courseClass = req.classId() == null ? null
                : classRepository.findById(req.classId()).orElseThrow(() -> ApiException.notFound("Class"));
        if (courseClass != null && linkChanged(p, student, courseClass)
                && !enrollmentRepository.existsByStudentIdAndCourseClassId(student.getId(), courseClass.getId())) {
            throw ApiException.badRequest("The student is not enrolled in the selected class");
        }
        p.setStudent(student);
        p.setCourseClass(courseClass);
        p.setAmount(req.amount());
        p.setStatus(req.status());
        p.setMethod(trimToNull(req.method()));
        p.setReference(trimToNull(req.reference()));
        p.setDescription(trimToNull(req.description()));
        p.setPaymentDate(req.paymentDate());
    }

    /**
     * True for a new payment, or when an edit changes the student or class. Unchanged links on an
     * existing record are not re-checked, so an old payment stays editable after the student leaves the class.
     */
    private static boolean linkChanged(Payment p, User student, CourseClass courseClass) {
        if (p.getId() == null) {
            return true;
        }
        Long oldClassId = p.getCourseClass() == null ? null : p.getCourseClass().getId();
        return !p.getStudent().getId().equals(student.getId()) || !Objects.equals(oldClassId, courseClass.getId());
    }
}
