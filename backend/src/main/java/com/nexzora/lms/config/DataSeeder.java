package com.nexzora.lms.config;

import com.nexzora.lms.entity.*;
import com.nexzora.lms.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Creates the first admin account on an empty database and, optionally, a little demo data
 * (one teacher, one student, two classes) so the app can be explored right away.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final CourseClassRepository classRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AnnouncementRepository announcementRepository;
    private final PaymentRepository paymentRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email}")
    private String adminEmail;
    @Value("${app.admin.password}")
    private String adminPassword;
    @Value("${app.seed-demo-data:false}")
    private boolean seedDemoData;

    public DataSeeder(UserRepository userRepository, CourseClassRepository classRepository,
                      EnrollmentRepository enrollmentRepository, AnnouncementRepository announcementRepository,
                      PaymentRepository paymentRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.classRepository = classRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.announcementRepository = announcementRepository;
        this.paymentRepository = paymentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.countByRole(Role.ADMIN) == 0) {
            User admin = newUser("System Administrator", adminEmail, adminPassword, Role.ADMIN);
            log.info("Created default admin account: {} (change the password via ADMIN_PASSWORD)", adminEmail);
            if (seedDemoData && classRepository.count() == 0) {
                seedDemo(admin);
            }
        }
    }

    private void seedDemo(User admin) {
        User teacher = newUser("Dr. Kamal Perera", "teacher@nexzora.lk", "Teacher@123", Role.TEACHER);
        User student = newUser("Nethmi Silva", "student@nexzora.lk", "Student@123", Role.STUDENT);

        CourseClass se = newClass("Software Engineering", "SE2012", "SE2026A",
                "Requirements, design, testing and agile development practices.", "Mon & Wed 9:00-11:00",
                new BigDecimal("15000.00"), teacher);
        newClass("Database Systems", "CS2050", "DB2026A",
                "Relational modelling, SQL, normalization and transactions.", "Tue 13:00-16:00",
                new BigDecimal("12000.00"), teacher);

        enrollmentRepository.save(new Enrollment(student, se));

        Announcement welcome = new Announcement();
        welcome.setTitle("Welcome to NEXZORA LMS");
        welcome.setContent("The new semester starts next Monday. Please check your class materials regularly.");
        welcome.setAuthor(admin);
        announcementRepository.save(welcome);

        Payment p = new Payment();
        p.setStudent(student);
        p.setCourseClass(se);
        p.setAmount(new BigDecimal("15000.00"));
        p.setStatus(PaymentStatus.PAID);
        p.setMethod("Bank Transfer");
        p.setReference("TXN-1001");
        p.setDescription("Semester fee - Software Engineering");
        p.setPaymentDate(LocalDate.now());
        paymentRepository.save(p);

        log.info("Seeded demo data: teacher@nexzora.lk / Teacher@123, student@nexzora.lk / Student@123");
    }

    private User newUser(String name, String email, String password, Role role) {
        User u = new User();
        u.setFullName(name);
        u.setEmail(email.toLowerCase());
        u.setPassword(passwordEncoder.encode(password));
        u.setRole(role);
        return userRepository.save(u);
    }

    private CourseClass newClass(String name, String courseCode, String enrollCode, String description,
                                 String schedule, BigDecimal fee, User teacher) {
        CourseClass c = new CourseClass();
        c.setName(name);
        c.setCourseCode(courseCode);
        c.setEnrollmentCode(enrollCode);
        c.setDescription(description);
        c.setSchedule(schedule);
        c.setFee(fee);
        c.setTeacher(teacher);
        return classRepository.save(c);
    }
}
