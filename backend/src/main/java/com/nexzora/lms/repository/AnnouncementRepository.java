package com.nexzora.lms.repository;

import com.nexzora.lms.entity.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;

public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    List<Announcement> findAllByOrderByCreatedAtDesc();

    /** Global announcements plus those posted to any of the given classes. */
    @Query("select a from Announcement a where a.courseClass is null or a.courseClass.id in :classIds order by a.createdAt desc")
    List<Announcement> findVisibleForClasses(Collection<Long> classIds);

    @Modifying
    @Query("update Announcement a set a.author = null where a.author.id = :userId")
    void clearAuthor(Long userId);

    @Modifying
    @Query("delete from Announcement a where a.courseClass.id = :classId")
    void deleteByClassId(Long classId);
}
