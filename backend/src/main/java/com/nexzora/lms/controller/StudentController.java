package com.nexzora.lms.controller;

import com.nexzora.lms.dto.Requests.EnrollRequest;
import com.nexzora.lms.dto.Responses.*;
import com.nexzora.lms.security.CurrentUser;
import com.nexzora.lms.service.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** All endpoints here require ROLE_STUDENT. Enrollment is checked in the services. */
@RestController
@RequestMapping("/api/student")
public class StudentController {

    private final DashboardService dashboardService;
    private final ClassService classService;
    private final EnrollmentService enrollmentService;
    private final MaterialService materialService;
    private final AnnouncementService announcementService;
    private final PaymentService paymentService;

    public StudentController(DashboardService dashboardService, ClassService classService,
                             EnrollmentService enrollmentService, MaterialService materialService,
                             AnnouncementService announcementService, PaymentService paymentService) {
        this.dashboardService = dashboardService;
        this.classService = classService;
        this.enrollmentService = enrollmentService;
        this.materialService = materialService;
        this.announcementService = announcementService;
        this.paymentService = paymentService;
    }

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard() {
        return dashboardService.student(CurrentUser.get());
    }

    @GetMapping("/classes/available")
    public List<ClassDto> available() {
        return classService.listAvailableForStudent(CurrentUser.get());
    }

    @GetMapping("/classes")
    public List<ClassDto> enrolled() {
        return classService.listEnrolledForStudent(CurrentUser.get());
    }

    @GetMapping("/classes/{id}")
    public ClassDto classDetail(@PathVariable Long id) {
        return classService.getForUser(id, CurrentUser.get());
    }

    @PostMapping("/enroll")
    @ResponseStatus(HttpStatus.CREATED)
    public ClassDto enroll(@Valid @RequestBody EnrollRequest req) {
        return enrollmentService.enrollWithCode(CurrentUser.get(), req.enrollmentCode());
    }

    @GetMapping("/classes/{id}/materials")
    public List<MaterialDto> materials(@PathVariable Long id) {
        return materialService.listForClass(id, CurrentUser.get());
    }

    @GetMapping("/announcements")
    public List<AnnouncementDto> announcements() {
        return announcementService.listFor(CurrentUser.get());
    }

    @GetMapping("/payments")
    public List<PaymentDto> payments() {
        return paymentService.listForStudent(CurrentUser.get());
    }
}
