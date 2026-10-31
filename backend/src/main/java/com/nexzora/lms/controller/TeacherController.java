package com.nexzora.lms.controller;

import com.nexzora.lms.dto.Requests.AnnouncementRequest;
import com.nexzora.lms.dto.Requests.VideoMaterialRequest;
import com.nexzora.lms.dto.Responses.*;
import com.nexzora.lms.security.CurrentUser;
import com.nexzora.lms.service.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/** All endpoints here require ROLE_TEACHER. Class-level ownership is checked in the services. */
@RestController
@RequestMapping("/api/teacher")
public class TeacherController {

    private final DashboardService dashboardService;
    private final ClassService classService;
    private final EnrollmentService enrollmentService;
    private final MaterialService materialService;
    private final AnnouncementService announcementService;

    public TeacherController(DashboardService dashboardService, ClassService classService,
                             EnrollmentService enrollmentService, MaterialService materialService,
                             AnnouncementService announcementService) {
        this.dashboardService = dashboardService;
        this.classService = classService;
        this.enrollmentService = enrollmentService;
        this.materialService = materialService;
        this.announcementService = announcementService;
    }

    @GetMapping("/dashboard")
    public TeacherDashboardDto dashboard() {
        return dashboardService.teacher(CurrentUser.get());
    }

    @GetMapping("/classes")
    public List<ClassDto> classes() {
        return classService.listForTeacher(CurrentUser.get());
    }

    @GetMapping("/classes/{id}")
    public ClassDto classDetail(@PathVariable Long id) {
        return classService.getForUser(id, CurrentUser.get());
    }

    @GetMapping("/classes/{id}/students")
    public List<EnrollmentDto> students(@PathVariable Long id) {
        return enrollmentService.listForClass(id, CurrentUser.get());
    }

    @GetMapping("/classes/{id}/materials")
    public List<MaterialDto> materials(@PathVariable Long id) {
        return materialService.listForClass(id, CurrentUser.get());
    }

    @PostMapping(value = "/classes/{id}/materials/pdf", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public MaterialDto uploadPdf(@PathVariable Long id,
                                 @RequestParam String title,
                                 @RequestParam(required = false) String description,
                                 @RequestParam("file") MultipartFile file) {
        return materialService.uploadPdf(id, CurrentUser.get(), title, description, file);
    }

    @PostMapping("/classes/{id}/materials/video")
    @ResponseStatus(HttpStatus.CREATED)
    public MaterialDto addVideo(@PathVariable Long id, @Valid @RequestBody VideoMaterialRequest req) {
        return materialService.addVideo(id, CurrentUser.get(), req);
    }

    @DeleteMapping("/materials/{materialId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMaterial(@PathVariable Long materialId) {
        materialService.delete(materialId, CurrentUser.get());
    }

    @GetMapping("/announcements")
    public List<AnnouncementDto> announcements() {
        return announcementService.listFor(CurrentUser.get());
    }

    @PostMapping("/announcements")
    @ResponseStatus(HttpStatus.CREATED)
    public AnnouncementDto createAnnouncement(@Valid @RequestBody AnnouncementRequest req) {
        return announcementService.create(CurrentUser.get(), req);
    }

    @DeleteMapping("/announcements/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAnnouncement(@PathVariable Long id) {
        announcementService.delete(id, CurrentUser.get());
    }
}
