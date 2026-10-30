package com.nexzora.lms.service;

import com.nexzora.lms.dto.Requests.PaymentRequest;
import com.nexzora.lms.dto.Responses.PaymentDto;
import com.nexzora.lms.entity.Payment;
import com.nexzora.lms.entity.Role;
import com.nexzora.lms.entity.User;
import com.nexzora.lms.exception.ApiException;
import com.nexzora.lms.repository.CourseClassRepository;
import com.nexzora.lms.repository.PaymentRepository;
import com.nexzora.lms.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final CourseClassRepository classRepository;

    public PaymentService(PaymentRepository paymentRepository, UserRepository userRepository,
                          CourseClassRepository classRepository) {
        this.paymentRepository = paymentRepository;
        this.userRepository = userRepository;
        this.classRepository = classRepository;
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
        p.setStudent(student);
        p.setCourseClass(req.classId() == null ? null
                : classRepository.findById(req.classId()).orElseThrow(() -> ApiException.notFound("Class")));
        p.setAmount(req.amount());
        p.setStatus(req.status());
        p.setMethod(trimToNull(req.method()));
        p.setReference(trimToNull(req.reference()));
        p.setDescription(trimToNull(req.description()));
        p.setPaymentDate(req.paymentDate());
    }

    private static String trimToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
