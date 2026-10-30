package com.nexzora.lms.repository;

import com.nexzora.lms.entity.CourseClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CourseClassRepository extends JpaRepository<CourseClass, Long> {

    List<CourseClass> findAllByOrderByCreatedAtDesc();

    List<CourseClass> findByActiveTrueOrderByNameAsc();

    List<CourseClass> findByTeacherIdOrderByNameAsc(Long teacherId);

    Optional<CourseClass> findByEnrollmentCodeIgnoreCase(String enrollmentCode);

    boolean existsByEnrollmentCodeIgnoreCase(String enrollmentCode);

    long countByTeacherId(Long teacherId);

    @Modifying
    @Query("update CourseClass c set c.teacher = null where c.teacher.id = :teacherId")
    void unassignTeacher(Long teacherId);
}
