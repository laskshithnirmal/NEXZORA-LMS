package com.nexzora.lms.repository;

import com.nexzora.lms.entity.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    List<Enrollment> findAllByOrderByEnrolledAtDesc();

    List<Enrollment> findByStudentIdOrderByEnrolledAtDesc(Long studentId);

    List<Enrollment> findByCourseClassIdOrderByEnrolledAtDesc(Long classId);

    boolean existsByStudentIdAndCourseClassId(Long studentId, Long classId);

    long countByCourseClassId(Long classId);

    long countByStudentId(Long studentId);

    @Query("select count(distinct e.student.id) from Enrollment e where e.courseClass.teacher.id = :teacherId")
    long countDistinctStudentsByTeacher(Long teacherId);

    @Modifying
    @Query("delete from Enrollment e where e.student.id = :studentId")
    void deleteByStudentId(Long studentId);

    @Modifying
    @Query("delete from Enrollment e where e.courseClass.id = :classId")
    void deleteByClassId(Long classId);
}
