package com.nexzora.lms.service;

import com.nexzora.lms.dto.Requests.AnnouncementRequest;
import com.nexzora.lms.dto.Responses.AnnouncementDto;
import com.nexzora.lms.entity.Announcement;
import com.nexzora.lms.entity.CourseClass;
import com.nexzora.lms.entity.Role;
import com.nexzora.lms.entity.User;
import com.nexzora.lms.exception.ApiException;
import com.nexzora.lms.repository.AnnouncementRepository;
import com.nexzora.lms.repository.CourseClassRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Service
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final CourseClassRepository classRepository;
    private final ClassService classService;

    public AnnouncementService(AnnouncementRepository announcementRepository,
                               CourseClassRepository classRepository, ClassService classService) {
        this.announcementRepository = announcementRepository;
        this.classRepository = classRepository;
        this.classService = classService;
    }

    /** Admins see all; teachers see global + their classes; students see global + enrolled classes. */
    @Transactional(readOnly = true)
    public List<AnnouncementDto> listFor(User user) {
        List<Announcement> list = switch (user.getRole()) {
            case ADMIN -> announcementRepository.findAllByOrderByCreatedAtDesc();
            case TEACHER -> announcementRepository.findVisibleForClasses(withSentinel(
                    classRepository.findByTeacherIdOrderByNameAsc(user.getId()).stream().map(CourseClass::getId).toList()));
            case STUDENT -> announcementRepository.findVisibleForClasses(withSentinel(classService.enrolledClassIds(user)));
        };
        return list.stream().map(AnnouncementDto::from).toList();
    }

    @Transactional
    public AnnouncementDto create(User author, AnnouncementRequest req) {
        CourseClass target = null;
        if (req.classId() != null) {
            target = classService.findAccessible(req.classId(), author);
        } else if (author.getRole() == Role.TEACHER) {
            throw ApiException.badRequest("Please choose one of your classes");
        }
        Announcement a = new Announcement();
        a.setTitle(req.title().trim());
        a.setContent(req.content().trim());
        a.setAuthor(author);
        a.setCourseClass(target);
        return AnnouncementDto.from(announcementRepository.save(a));
    }

    @Transactional
    public void delete(Long id, User user) {
        Announcement a = announcementRepository.findById(id).orElseThrow(() -> ApiException.notFound("Announcement"));
        boolean own = a.getAuthor() != null && a.getAuthor().getId().equals(user.getId());
        if (user.getRole() != Role.ADMIN && !own) {
            throw ApiException.forbidden("You can only delete your own announcements");
        }
        announcementRepository.delete(a);
    }

    /** Adds an id that never exists so the IN clause is never empty. */
    private static Collection<Long> withSentinel(Collection<Long> ids) {
        List<Long> list = new ArrayList<>(ids);
        list.add(-1L);
        return list;
    }
}
