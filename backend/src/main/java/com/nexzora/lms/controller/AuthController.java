package com.nexzora.lms.controller;

import com.nexzora.lms.dto.Requests.LoginRequest;
import com.nexzora.lms.dto.Requests.RegisterRequest;
import com.nexzora.lms.dto.Responses.AuthResponse;
import com.nexzora.lms.dto.Responses.UserDto;
import com.nexzora.lms.security.CurrentUser;
import com.nexzora.lms.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/auth/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    @PostMapping("/auth/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest req) {
        return authService.registerStudent(req);
    }

    @GetMapping("/auth/me")
    public UserDto me() {
        return UserDto.from(CurrentUser.get());
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "UP");
    }
}
