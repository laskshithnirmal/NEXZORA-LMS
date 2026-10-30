package com.nexzora.lms.repository;

import com.nexzora.lms.entity.Payment;
import com.nexzora.lms.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findAllByOrderByPaymentDateDescIdDesc();

    List<Payment> findByStudentIdOrderByPaymentDateDescIdDesc(Long studentId);

    @Query("select coalesce(sum(p.amount), 0) from Payment p where p.status = :status")
    BigDecimal sumByStatus(PaymentStatus status);

    @Query("select coalesce(sum(p.amount), 0) from Payment p where p.student.id = :studentId and p.status = :status")
    BigDecimal sumByStudentAndStatus(Long studentId, PaymentStatus status);

    @Modifying
    @Query("delete from Payment p where p.student.id = :studentId")
    void deleteByStudentId(Long studentId);

    @Modifying
    @Query("update Payment p set p.courseClass = null where p.courseClass.id = :classId")
    void clearClass(Long classId);
}
