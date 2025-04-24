package com.tushar.demo.timetracker.controller;

import com.tushar.demo.timetracker.config.JwtUtils;
import com.tushar.demo.timetracker.dto.request.LoginRequest;
import com.tushar.demo.timetracker.dto.request.SignupRequest;
import com.tushar.demo.timetracker.model.Project;
import com.tushar.demo.timetracker.model.Users;
import com.tushar.demo.timetracker.repository.ProjectRepository;
import com.tushar.demo.timetracker.repository.UserRepository;
import com.tushar.demo.timetracker.service.ProjectService;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
	private final AuthenticationManager authenticationManager;
	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtUtils jwtUtils;
	private final ProjectService projectService;

	@Autowired
	public AuthController(AuthenticationManager authenticationManager, UserRepository userRepository,
			PasswordEncoder passwordEncoder, JwtUtils jwtUtils, ProjectService projectService) {
		this.authenticationManager = authenticationManager;
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtUtils = jwtUtils;
		this.projectService = projectService;
	}

	@PostMapping("/signup")
	public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signupRequest) {
		String normalizedEmail = signupRequest.email().toLowerCase().trim();

		if (userRepository.existsByEmail(normalizedEmail)) {
			return ResponseEntity.status(HttpStatus.CONFLICT)
					.body(Map.of("error", "EMAIL_EXISTS", "message", "This email is already registered"));
		}

		Users newUser = new Users();
		newUser.setName(signupRequest.name().trim());
		newUser.setEmail(normalizedEmail);
		newUser.setPassword(passwordEncoder.encode(signupRequest.password()));
		newUser.setEmailVerified(false);
		try {
			Users savedUser = userRepository.save(newUser);
			logger.info("New user registered: {}", savedUser.getEmail());

			projectService.createDefaultProject(savedUser);
	        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
	            "message", "Registration successful - please verify your email",
	            "userId", savedUser.getId()
	        ));
	    } catch (DataIntegrityViolationException e) {
	        logger.error("Database error during registration", e);
	        return ResponseEntity.internalServerError().body(Map.of("error", "REGISTRATION_FAILED"));
	    }
	}

	// V1
	@PostMapping("/login")
	public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
		try {
			String normalizedEmail = loginRequest.email().toLowerCase().trim();
			Authentication authentication = authenticationManager.authenticate(
					new UsernamePasswordAuthenticationToken(normalizedEmail, loginRequest.password().trim()));
			SecurityContextHolder.getContext().setAuthentication(authentication);
			UserDetails userDetails = (UserDetails) authentication.getPrincipal();

			String jwt = jwtUtils.generateToken(userDetails);
			Users user = userRepository.findByEmail(normalizedEmail)
					.orElseThrow(() -> new UsernameNotFoundException("User not found"));

			return ResponseEntity.ok(Map.of("token", jwt, "user",
					Map.of("id", user.getId(), "name", user.getName(), "email", user.getEmail())));

		} catch (AuthenticationException e) {
			logger.warn("Failed login attempt for email: {}", loginRequest.email());
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
					.body(Map.of("error", "INVALID_CREDENTIALS", "message", "Invalid email or password"));
		}
	}

	@GetMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        if (jwtUtils.validateToken(token)) {
            String email = jwtUtils.getUsernameFromToken(token);
            Users user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found"));
            return ResponseEntity.ok(Map.of(
                "valid", true,
                "user", Map.of("id", user.getId(), "name", user.getName(), "email", user.getEmail())
            ));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("valid", false));
    }
}