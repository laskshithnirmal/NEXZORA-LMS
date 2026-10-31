package com.nexzora.lms;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * End-to-end walk through the main features of every role, against an in-memory database.
 */
@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class LmsIntegrationTest {

    @Autowired
    MockMvc mvc;
    @Autowired
    ObjectMapper json;

    // ---------- helpers ----------

    private JsonNode call(MockHttpServletRequestBuilder req, String token, Object body, int expectedStatus) throws Exception {
        if (token != null) req.header("Authorization", "Bearer " + token);
        if (body != null) req.contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body));
        String res = mvc.perform(req).andExpect(status().is(expectedStatus)).andReturn().getResponse().getContentAsString();
        return res.isBlank() ? null : json.readTree(res);
    }

    private String login(String email, String password) throws Exception {
        return call(post("/api/auth/login"), null, Map.of("email", email, "password", password), 200).get("token").asText();
    }

    private String register(String name, String email) throws Exception {
        return call(post("/api/auth/register"), null,
                Map.of("fullName", name, "email", email, "password", "secret123"), 201).get("token").asText();
    }

    // ---------- tests ----------

    @Test
    void authenticationAndRoleBasedAccess() throws Exception {
        // Seeded admin can log in; wrong password is rejected.
        String admin = login("admin@test.lk", "Admin@123");
        JsonNode bad = call(post("/api/auth/login"), null, Map.of("email", "admin@test.lk", "password", "nope"), 401);
        assertThat(bad.get("message").asText()).isEqualTo("Invalid email or password");

        // Registration validation errors are reported per field.
        JsonNode invalid = call(post("/api/auth/register"), null,
                Map.of("fullName", "A", "email", "not-an-email", "password", "123"), 400);
        assertThat(invalid.get("errors").has("fullName")).isTrue();
        assertThat(invalid.get("errors").has("email")).isTrue();
        assertThat(invalid.get("errors").has("password")).isTrue();

        // Students self-register; duplicate email is a conflict.
        String student = register("Test Student", "student1@test.lk");
        call(post("/api/auth/register"), null,
                Map.of("fullName", "Dup", "email", "STUDENT1@test.lk", "password", "secret123"), 409);

        JsonNode me = call(get("/api/auth/me"), student, null, 200);
        assertThat(me.get("role").asText()).isEqualTo("STUDENT");
        assertThat(me.has("password")).isFalse();

        // Role enforcement.
        call(get("/api/admin/dashboard"), null, null, 401);
        call(get("/api/admin/dashboard"), "garbage.token.value", null, 401);
        call(get("/api/admin/dashboard"), student, null, 403);
        call(get("/api/teacher/dashboard"), student, null, 403);
        call(get("/api/student/dashboard"), admin, null, 403);
        call(get("/api/admin/dashboard"), admin, null, 200);
        call(get("/api/student/dashboard"), student, null, 200);

        // Deactivated users can no longer log in.
        JsonNode created = call(post("/api/admin/users"), admin, Map.of(
                "fullName", "Inactive Teacher", "email", "inactive@test.lk", "password", "secret123",
                "role", "TEACHER", "active", false), 201);
        assertThat(created.get("active").asBoolean()).isFalse();
        call(post("/api/auth/login"), null, Map.of("email", "inactive@test.lk", "password", "secret123"), 403);
    }

    @Test
    void fullClassWorkflow() throws Exception {
        String admin = login("admin@test.lk", "Admin@123");

        // --- Admin creates a teacher and a class, then assigns the teacher ---
        JsonNode teacherUser = call(post("/api/admin/users"), admin, Map.of(
                "fullName", "Dr. Teacher", "email", "teacher@test.lk", "password", "secret123", "role", "TEACHER"), 201);
        long teacherId = teacherUser.get("id").asLong();

        call(post("/api/admin/classes"), admin, Map.of("name", "", "courseCode", "", "fee", -5), 400);

        JsonNode cls = call(post("/api/admin/classes"), admin, Map.of(
                "name", "Software Engineering", "courseCode", "se2012", "fee", 15000,
                "description", "Intro to SE", "schedule", "Mon 9-11"), 201);
        long classId = cls.get("id").asLong();
        String code = cls.get("enrollmentCode").asText();
        assertThat(code).hasSize(8);
        assertThat(cls.get("courseCode").asText()).isEqualTo("SE2012");

        JsonNode assigned = call(put("/api/admin/classes/" + classId + "/teacher"), admin, Map.of("teacherId", teacherId), 200);
        assertThat(assigned.get("teacherName").asText()).isEqualTo("Dr. Teacher");

        String teacher = login("teacher@test.lk", "secret123");
        JsonNode teacherClasses = call(get("/api/teacher/classes"), teacher, null, 200);
        assertThat(teacherClasses).hasSize(1);
        assertThat(teacherClasses.get(0).get("enrollmentCode").asText()).isEqualTo(code);

        // --- Student browses (code hidden) and joins with the code ---
        String student = register("Alice Student", "alice@test.lk");
        String outsider = register("Bob Outsider", "bob@test.lk");

        JsonNode available = call(get("/api/student/classes/available"), student, null, 200);
        assertThat(available).hasSize(1);
        assertThat(available.get(0).get("enrollmentCode").isNull()).isTrue();
        assertThat(available.get(0).get("enrolled").asBoolean()).isFalse();

        call(post("/api/student/enroll"), student, Map.of("enrollmentCode", "WRONG123"), 404);
        call(post("/api/student/enroll"), student, Map.of("enrollmentCode", code.toLowerCase()), 201);
        call(post("/api/student/enroll"), student, Map.of("enrollmentCode", code), 409);

        assertThat(call(get("/api/student/classes"), student, null, 200)).hasSize(1);
        assertThat(call(get("/api/teacher/classes/" + classId + "/students"), teacher, null, 200)).hasSize(1);
        assertThat(call(get("/api/admin/enrollments"), admin, null, 200)).hasSize(1);

        // --- Teacher uploads a PDF and adds a video ---
        byte[] pdfBytes = "%PDF-1.4\n%test pdf content\n".getBytes();
        String pdfResponse = mvc.perform(multipart("/api/teacher/classes/" + classId + "/materials/pdf")
                        .file(new MockMultipartFile("file", "week1.pdf", "application/pdf", pdfBytes))
                        .param("title", "Week 1 Notes")
                        .header("Authorization", "Bearer " + teacher))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long pdfId = json.readTree(pdfResponse).get("id").asLong();

        // Non-PDF files are rejected.
        mvc.perform(multipart("/api/teacher/classes/" + classId + "/materials/pdf")
                        .file(new MockMultipartFile("file", "virus.pdf", "application/pdf", "MZ-not-a-pdf".getBytes()))
                        .param("title", "Fake")
                        .header("Authorization", "Bearer " + teacher))
                .andExpect(status().isBadRequest());

        call(post("/api/teacher/classes/" + classId + "/materials/video"), teacher,
                Map.of("title", "Lecture 1", "videoUrl", "ftp://bad"), 400);
        call(post("/api/teacher/classes/" + classId + "/materials/video"), teacher,
                Map.of("title", "Lecture 1", "videoUrl", "https://www.youtube.com/watch?v=dQw4w9WgXcQ"), 201);

        // --- Student accesses materials; outsider cannot ---
        JsonNode materials = call(get("/api/student/classes/" + classId + "/materials"), student, null, 200);
        assertThat(materials).hasSize(2);

        byte[] downloaded = mvc.perform(get("/api/materials/" + pdfId + "/file").header("Authorization", "Bearer " + student))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andReturn().getResponse().getContentAsByteArray();
        assertThat(downloaded).isEqualTo(pdfBytes);

        call(get("/api/student/classes/" + classId + "/materials"), outsider, null, 403);
        call(get("/api/materials/" + pdfId + "/file"), outsider, null, 403);

        // --- Announcements: admin global + teacher class-specific ---
        call(post("/api/admin/announcements"), admin, Map.of("title", "Welcome", "content", "Semester begins"), 201);
        call(post("/api/teacher/announcements"), teacher, Map.of("title", "No class", "content", "Missing class"), 400);
        call(post("/api/teacher/announcements"), teacher,
                Map.of("title", "Quiz", "content", "Quiz on Friday", "classId", classId), 201);

        assertThat(call(get("/api/student/announcements"), student, null, 200)).hasSize(2);
        assertThat(call(get("/api/student/announcements"), outsider, null, 200)).hasSize(1); // only the global one

        // --- Payments ---
        call(post("/api/admin/payments"), admin, Map.of("studentId", 999, "amount", 0, "status", "PAID"), 400);
        long studentId = call(get("/api/auth/me"), student, null, 200).get("id").asLong();
        JsonNode payment = call(post("/api/admin/payments"), admin, Map.of(
                "studentId", studentId, "classId", classId, "amount", 15000, "status", "PAID",
                "method", "Cash", "paymentDate", "2026-10-01"), 201);
        call(put("/api/admin/payments/" + payment.get("id").asLong()), admin, Map.of(
                "studentId", studentId, "classId", classId, "amount", 7500, "status", "PENDING",
                "paymentDate", "2026-10-02"), 200);

        JsonNode myPayments = call(get("/api/student/payments"), student, null, 200);
        assertThat(myPayments).hasSize(1);
        assertThat(myPayments.get(0).get("status").asText()).isEqualTo("PENDING");
        assertThat(call(get("/api/student/payments"), outsider, null, 200)).isEmpty();

        // --- Dashboards ---
        JsonNode adminDash = call(get("/api/admin/dashboard"), admin, null, 200);
        assertThat(adminDash.get("students").asLong()).isEqualTo(2);
        assertThat(adminDash.get("enrollments").asLong()).isEqualTo(1);
        JsonNode teacherDash = call(get("/api/teacher/dashboard"), teacher, null, 200);
        assertThat(teacherDash.get("materials").asLong()).isEqualTo(2);
        JsonNode studentDash = call(get("/api/student/dashboard"), student, null, 200);
        assertThat(studentDash.get("totalPending").decimalValue()).isEqualByComparingTo("7500");

        // --- Deleting the teacher unassigns the class; deleting the class cleans up ---
        call(delete("/api/admin/users/" + teacherId), admin, null, 204);
        JsonNode afterTeacherDelete = call(get("/api/admin/classes"), admin, null, 200);
        assertThat(afterTeacherDelete.get(0).get("teacherId").isNull()).isTrue();

        call(delete("/api/admin/classes/" + classId), admin, null, 204);
        assertThat(call(get("/api/admin/enrollments"), admin, null, 200)).isEmpty();
        assertThat(call(get("/api/student/classes"), student, null, 200)).isEmpty();
        assertThat(call(get("/api/student/payments"), student, null, 200).get(0).get("classId").isNull()).isTrue();
    }

    @Test
    void editingDeletingAndOwnershipRules() throws Exception {
        String admin = login("admin@test.lk", "Admin@123");
        long adminId = call(get("/api/auth/me"), admin, null, 200).get("id").asLong();

        // --- Users: update, email conflict, admin cannot delete themselves ---
        long teacherAId = call(post("/api/admin/users"), admin, Map.of(
                "fullName", "Teacher A", "email", "a@test.lk", "password", "secret123", "role", "TEACHER"), 201).get("id").asLong();
        call(post("/api/admin/users"), admin, Map.of(
                "fullName", "Teacher B", "email", "b@test.lk", "password", "secret123", "role", "TEACHER"), 201);

        JsonNode renamed = call(put("/api/admin/users/" + teacherAId), admin, Map.of(
                "fullName", "Dr. Teacher A", "email", "a@test.lk", "phone", "0771234567", "role", "TEACHER"), 200);
        assertThat(renamed.get("fullName").asText()).isEqualTo("Dr. Teacher A");
        assertThat(renamed.get("phone").asText()).isEqualTo("0771234567");
        call(put("/api/admin/users/" + teacherAId), admin, Map.of(
                "fullName", "Dr. Teacher A", "email", "B@test.lk", "role", "TEACHER"), 409);
        call(delete("/api/admin/users/" + adminId), admin, null, 400);

        // --- Classes: update ---
        JsonNode cls = call(post("/api/admin/classes"), admin, Map.of(
                "name", "Databases", "courseCode", "CS2050", "fee", 12000, "teacherId", teacherAId), 201);
        long classId = cls.get("id").asLong();
        String code = cls.get("enrollmentCode").asText();
        JsonNode updatedClass = call(put("/api/admin/classes/" + classId), admin, Map.of(
                "name", "Database Systems", "courseCode", "CS2050", "fee", 6500, "teacherId", teacherAId), 200);
        assertThat(updatedClass.get("name").asText()).isEqualTo("Database Systems");
        assertThat(updatedClass.get("fee").decimalValue()).isEqualByComparingTo("6500");
        assertThat(updatedClass.get("enrollmentCode").asText()).isEqualTo(code); // blank code keeps the old one

        // --- Teacher ownership: B cannot see or change A's class ---
        String teacherA = login("a@test.lk", "secret123");
        String teacherB = login("b@test.lk", "secret123");
        call(get("/api/teacher/classes/" + classId), teacherB, null, 403);
        call(get("/api/teacher/classes/" + classId + "/students"), teacherB, null, 403);
        call(post("/api/teacher/classes/" + classId + "/materials/video"), teacherB,
                Map.of("title", "Intruder", "videoUrl", "https://vimeo.com/1"), 403);

        long videoId = call(post("/api/teacher/classes/" + classId + "/materials/video"), teacherA,
                Map.of("title", "ER modelling", "videoUrl", "https://vimeo.com/123456"), 201).get("id").asLong();
        call(delete("/api/teacher/materials/" + videoId), teacherB, null, 403);
        call(delete("/api/teacher/materials/" + videoId), teacherA, null, 204);
        call(delete("/api/teacher/materials/" + videoId), teacherA, null, 404);

        long announcementId = call(post("/api/teacher/announcements"), teacherA,
                Map.of("title", "Lab", "content", "Lab moved to Friday", "classId", classId), 201).get("id").asLong();
        call(post("/api/teacher/announcements"), teacherB,
                Map.of("title", "Spoof", "content", "Not my class", "classId", classId), 403);
        call(delete("/api/teacher/announcements/" + announcementId), teacherB, null, 403);
        call(delete("/api/teacher/announcements/" + announcementId), teacherA, null, 204);

        // --- Students: the code stays hidden after joining ---
        String student = register("Enrolled Student", "enrolled@test.lk");
        register("Other Student", "other@test.lk");
        call(post("/api/student/enroll"), student, Map.of("enrollmentCode", code), 201);
        assertThat(call(get("/api/student/classes/" + classId), student, null, 200).get("enrollmentCode").isNull()).isTrue();

        long studentId = call(get("/api/auth/me"), student, null, 200).get("id").asLong();
        long otherId = call(get("/api/admin/users?role=STUDENT"), admin, null, 200).findValues("id").stream()
                .mapToLong(JsonNode::asLong).filter(id -> id != studentId).findFirst().orElseThrow();

        // --- Payments: class-linked payments require an enrollment; delete works ---
        call(post("/api/admin/payments"), admin, Map.of(
                "studentId", otherId, "classId", classId, "amount", 6500, "status", "PAID", "paymentDate", "2026-10-01"), 400);
        call(post("/api/admin/payments"), admin, Map.of(
                "studentId", otherId, "amount", 500, "status", "PAID", "paymentDate", "2026-10-01"), 201);
        long paymentId = call(post("/api/admin/payments"), admin, Map.of(
                "studentId", studentId, "classId", classId, "amount", 6500, "status", "PENDING", "paymentDate", "2026-10-01"), 201)
                .get("id").asLong();

        // --- Enrollments: delete removes access ---
        long enrollmentId = call(get("/api/admin/enrollments"), admin, null, 200).get(0).get("id").asLong();
        call(delete("/api/admin/enrollments/" + enrollmentId), admin, null, 204);
        call(delete("/api/admin/enrollments/" + enrollmentId), admin, null, 404);
        call(get("/api/student/classes/" + classId), student, null, 403);

        // An existing payment stays editable after the student leaves the class...
        call(put("/api/admin/payments/" + paymentId), admin, Map.of(
                "studentId", studentId, "classId", classId, "amount", 6500, "status", "PAID", "paymentDate", "2026-10-05"), 200);
        // ...but it cannot be moved to a class the student is not enrolled in.
        call(put("/api/admin/payments/" + paymentId), admin, Map.of(
                "studentId", otherId, "classId", classId, "amount", 6500, "status", "PAID", "paymentDate", "2026-10-05"), 400);

        call(delete("/api/admin/payments/" + paymentId), admin, null, 204);
        call(delete("/api/admin/payments/" + paymentId), admin, null, 404);
        assertThat(call(get("/api/student/payments"), student, null, 200)).isEmpty();
    }
}
