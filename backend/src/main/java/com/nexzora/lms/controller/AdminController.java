package com.nexzora.lms.controller;

import com.nexzora.lms.dto.Requests.*;
import com.nexzora.lms.dto.Responses.*;
import com.nexzora.lms.entity.Role;
import com.nexzora.lms.security.CurrentUser;
import com.nexzora.lms.service.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** All endpoints here require ROLE_ADMIN (enforced in SecurityConfig). */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final DashboardService dashboardService;
    private final UserService userService;
    private final ClassService classService;
    private final EnrollmentService enrollmentService;
    private final PaymentService paymentService;
    private final AnnouncementService announcementService;
    private final MaterialService materialService;

    public AdminController(DashboardService dashboardService, UserService userService, ClassService classService,
                           EnrollmentService enrollmentService, PaymentService paymentService,
                           AnnouncementService announcementService, MaterialService materialService) {
        this.dashboardService = dashboardService;
        this.userService = userService;
        this.classService = classService;
        this.enrollmentService = enrollmentService;
        this.paymentService = paymentService;
        this.announcementService = announcementService;
        this.materialService = materialService;
    }

    @GetMapping("/dashboard")
    public AdminDashboardDto dashboard() {
        return dashboardService.admin(CurrentUser.get());
    }

    // ----- users (students & teachers) -----

    @GetMapping("/users")
    public List<UserDto> users(@RequestParam Role role) {
        return userService.list(role);
    }

    @PostMapping("/users")
    @ResponseStatus(HttpStatus.CREATED)
    public UserDto createUser(@Valid @RequestBody UserRequest req) {
        return userService.create(req);
    }

    @PutMapping("/users/{id}")
    public UserDto updateUser(@PathVariable Long id, @Valid @RequestBody UserRequest req) {
        return userService.update(id, req);
    }

    @DeleteMapping("/users/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(@PathVariable Long id) {
        userService.delete(id, CurrentUser.get());
    }

    // ----- classes -----

    @GetMapping("/classes")
    public List<ClassDto> classes() {
        return classService.listAll();
    }

    @PostMapping("/classes")
    @ResponseStatus(HttpStatus.CREATED)
    public ClassDto createClass(@Valid @RequestBody ClassRequest req) {
        return classService.create(req);
    }

    @PutMapping("/classes/{id}")
    public ClassDto updateClass(@PathVariable Long id, @Valid @RequestBody ClassRequest req) {
        return classService.update(id, req);
    }

    @PutMapping("/classes/{id}/teacher")
    public ClassDto assignTeacher(@PathVariable Long id, @RequestBody AssignTeacherRequest req) {
        return classService.assignTeacher(id, req.teacherId());
    }

    @DeleteMapping("/classes/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteClass(@PathVariable Long id) {
        classService.delete(id);
    }

    @GetMapping("/classes/{id}/students")
    public List<EnrollmentDto> classStudents(@PathVariable Long id) {
        return enrollmentService.listForClass(id, CurrentUser.get());
    }

    @GetMapping("/classes/{id}/materials")
    public List<MaterialDto> classMaterials(@PathVariable Long id) {
        return materialService.listForClass(id, CurrentUser.get());
    }

    // ----- enrollments -----

    @GetMapping("/enrollments")
    public List<EnrollmentDto> enrollments() {
        return enrollmentService.listAll();
    }

    @DeleteMapping("/enrollments/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteEnrollment(@PathVariable Long id) {
        enrollmentService.delete(id);
    }

    // ----- payments -----

    @GetMapping("/payments")
    public List<PaymentDto> payments() {
        return paymentService.listAll();
    }

    @PostMapping("/payments")
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentDto createPayment(@Valid @RequestBody PaymentRequest req) {
        return paymentService.create(req);
    }

    @PutMapping("/payments/{id}")
    public PaymentDto updatePayment(@PathVariable Long id, @Valid @RequestBody PaymentRequest req) {
        return paymentService.update(id, req);
    }

    @DeleteMapping("/payments/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePayment(@PathVariable Long id) {
        paymentService.delete(id);
    }

    // ----- announcements -----

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
