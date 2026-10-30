package com.nexzora.lms.repository;

import com.nexzora.lms.entity.LearningMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface LearningMaterialRepository extends JpaRepository<LearningMaterial, Long> {

    List<LearningMaterial> findByCourseClassIdOrderByCreatedAtDesc(Long classId);

    long countByCourseClassTeacherId(Long teacherId);

    long countByCourseClassId(Long classId);

    @Modifying
    @Query("update LearningMaterial m set m.uploadedBy = null where m.uploadedBy.id = :userId")
    void clearUploader(Long userId);
}
