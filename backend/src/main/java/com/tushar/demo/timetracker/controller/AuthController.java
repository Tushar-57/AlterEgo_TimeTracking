package com.tushar.demo.timetracker.controller;

import com.tushar.demo.timetracker.config.JwtUtils;
import com.tushar.demo.timetracker.dto.request.EmailVerificationConfirmRequest;
import com.tushar.demo.timetracker.dto.request.EmailVerificationRequest;
import com.tushar.demo.timetracker.dto.request.LoginRequest;
import com.tushar.demo.timetracker.dto.request.PasswordResetConfirmRequest;
import com.tushar.demo.timetracker.dto.request.PasswordResetRequest;
import com.tushar.demo.timetracker.dto.request.SignupRequest;
import com.tushar.demo.timetracker.model.Users;
import com.tushar.demo.timetracker.repository.UserRepository;
import com.tushar.demo.timetracker.service.AuthEmailValidationService;
import com.tushar.demo.timetracker.service.MailerooEmailService;
import com.tushar.demo.timetracker.service.ProjectService;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.util.StringUtils;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
	private static final SecureRandom SECURE_RANDOM = new SecureRandom();

	private final AuthenticationManager authenticationManager;
	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtUtils jwtUtils;
	private final ProjectService projectService;
	private final AuthEmailValidationService authEmailValidationService;
	private final MailerooEmailService mailerooEmailService;

	@Value("${app.auth.cookie.name:auth_token}")
	private String authCookieName;

	@Value("${app.auth.cookie.max-age-seconds:86400}")
	private long authCookieMaxAgeSeconds;

	@Value("${app.auth.cookie.same-site:Lax}")
	private String authCookieSameSite;

	@Value("${app.auth.cookie.secure:false}")
	private boolean forceSecureCookie;

	@Value("${app.auth.password-reset.code-ttl-minutes:15}")
	private long resetCodeTtlMinutes;

	@Value("${app.auth.password-reset.max-attempts:5}")
	private int resetMaxAttempts;

	@Value("${app.auth.password-reset.dev-return-code:false}")
	private boolean returnResetCodeInResponse;

	@Value("${app.auth.email-verification.code-ttl-minutes:10}")
	private long emailVerificationCodeTtlMinutes;

	@Value("${app.auth.email-verification.max-attempts:5}")
	private int emailVerificationMaxAttempts;

	@Value("${app.auth.email-verification.dev-return-code:false}")
	private boolean returnVerificationCodeInResponse;

	@Value("${app.auth.email-verification.require-before-login:true}")
	private boolean requireVerifiedEmailForLogin;

	public AuthController(AuthenticationManager authenticationManager, UserRepository userRepository,
			PasswordEncoder passwordEncoder, JwtUtils jwtUtils, ProjectService projectService,
			AuthEmailValidationService authEmailValidationService,
			MailerooEmailService mailerooEmailService) {
		this.authenticationManager = authenticationManager;
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtUtils = jwtUtils;
		this.projectService = projectService;
		this.authEmailValidationService = authEmailValidationService;
		this.mailerooEmailService = mailerooEmailService;
	}

	@PostMapping("/signup")
	public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signupRequest) {
		String normalizedEmail = normalizeEmail(signupRequest.email());
		String verificationCode = null;

		AuthEmailValidationService.ValidationResult emailValidation =
			authEmailValidationService.validateForSignup(normalizedEmail);
		if (!emailValidation.isValid()) {
			return ResponseEntity.badRequest().body(
				Map.of(
					"error", "INVALID_EMAIL",
					"message", "Please provide a valid email address with a deliverable domain"
				)
			);
		}

		Optional<Users> existingUser = userRepository.findByEmail(normalizedEmail);
		if (existingUser.isPresent()) {
			Users currentUser = existingUser.get();
			if (!currentUser.isEmailVerified()) {
				verificationCode = issueAndSendEmailVerification(currentUser);
			}
			logger.info("Signup requested for existing email: {}", normalizedEmail);
			return genericSignupAcceptedResponse(verificationCode);
		}

		Users newUser = new Users();
		newUser.setName(signupRequest.name().trim());
		newUser.setEmail(normalizedEmail);
		newUser.setPassword(passwordEncoder.encode(signupRequest.password()));
		newUser.setEmailVerified(false);
		newUser.setOnboardingCompleted(false);
		try {
			Users savedUser = userRepository.save(newUser);
			logger.info("New user registered: {}", savedUser.getEmail());

			projectService.createDefaultProject(savedUser);
			verificationCode = issueAndSendEmailVerification(savedUser);
			return genericSignupAcceptedResponse(verificationCode);
	    } catch (DataIntegrityViolationException e) {
			logger.warn("Signup conflict detected for email {}", normalizedEmail);
			Optional<Users> conflictUser = userRepository.findByEmail(normalizedEmail);
			if (conflictUser.isPresent() && !conflictUser.get().isEmailVerified()) {
				verificationCode = issueAndSendEmailVerification(conflictUser.get());
			}
			return genericSignupAcceptedResponse(verificationCode);
	    }
	}

	// V1
	@PostMapping("/login")
	public ResponseEntity<?> authenticateUser(
			@Valid @RequestBody LoginRequest loginRequest,
			HttpServletRequest request,
			HttpServletResponse response) {
		try {
			String normalizedEmail = normalizeEmail(loginRequest.email());
			Authentication authentication = authenticationManager.authenticate(
					new UsernamePasswordAuthenticationToken(normalizedEmail, loginRequest.password().trim()));
			SecurityContextHolder.getContext().setAuthentication(authentication);
			Users user = userRepository.findByEmail(normalizedEmail)
					.orElseThrow(() -> new UsernameNotFoundException("User not found"));

			if (requireVerifiedEmailForLogin && !user.isEmailVerified()) {
				String verificationCode = issueAndSendEmailVerification(user);
				return unverifiedEmailResponse(verificationCode);
			}

			String jwt = jwtUtils.generateToken(user.getEmail(), user.getTokenVersion());
			addAuthCookie(response, jwt, isSecureRequest(request));

			return ResponseEntity.ok(Map.of(
					"message", "Login successful",
					"user", Map.of(
						"id", user.getId(),
						"name", user.getName(),
						"email", user.getEmail(),
						"onboardingCompleted", user.isOnboardingCompleted()
					)
			));

		} catch (AuthenticationException e) {
			logger.warn("Failed login attempt for email: {}", loginRequest.email());
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
					.body(Map.of("error", "INVALID_CREDENTIALS", "message", "Invalid email or password"));
		}
	}

	@GetMapping("/validate")
	public ResponseEntity<?> validateToken(
			@RequestHeader(value = "Authorization", required = false) String authHeader,
			HttpServletRequest request) {
		String token = extractToken(authHeader, extractCookieToken(request));

		if (token == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
					.body(Map.of("valid", false, "message", "Missing or invalid Authorization header"));
		}

		if (jwtUtils.validateToken(token)) {
			String email = jwtUtils.getUsernameFromToken(token);
			Users user = userRepository.findByEmail(email)
					.orElseThrow(() -> new UsernameNotFoundException("User not found"));

			if (!jwtUtils.isTokenVersionValid(token, user.getTokenVersion())) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
					.body(Map.of("valid", false, "message", "Session has been revoked"));
			}

			if (requireVerifiedEmailForLogin && !user.isEmailVerified()) {
				return ResponseEntity.status(HttpStatus.FORBIDDEN)
					.body(Map.of(
						"valid", false,
						"error", "EMAIL_NOT_VERIFIED",
						"message", "Please verify your email before continuing"
					));
			}

			return ResponseEntity.ok(Map.of(
					"valid", true,
					"user", Map.of("id", user.getId(), "name", user.getName(), "email", user.getEmail(), "onboardingCompleted", user.isOnboardingCompleted())
			));
		}
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("valid", false));
	}

	@PostMapping("/logout")
	public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
		addLogoutCookie(response, isSecureRequest(request));
		SecurityContextHolder.clearContext();
		return ResponseEntity.ok(Map.of("message", "Logged out"));
	}

	@PostMapping("/logout-all")
	public ResponseEntity<?> logoutAllDevices(
			Authentication authentication,
			HttpServletRequest request,
			HttpServletResponse response) {
		if (authentication == null || !StringUtils.hasText(authentication.getName())) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
				.body(Map.of("error", "UNAUTHORIZED", "message", "Authentication required"));
		}

		String email = normalizeEmail(authentication.getName());
		Users user = userRepository.findByEmail(email)
			.orElseThrow(() -> new UsernameNotFoundException("User not found"));

		user.setTokenVersion(user.getTokenVersion() + 1);
		user.setTokenInvalidated(false);
		userRepository.save(user);

		addLogoutCookie(response, isSecureRequest(request));
		SecurityContextHolder.clearContext();

		return ResponseEntity.ok(Map.of("message", "Logged out from all devices"));
	}

	@PostMapping("/email-verification/request")
	public ResponseEntity<?> requestEmailVerification(@Valid @RequestBody EmailVerificationRequest verificationRequest) {
		String normalizedEmail = normalizeEmail(verificationRequest.email());
		String verificationCode = null;

		Optional<Users> userOptional = userRepository.findByEmail(normalizedEmail);
		if (userOptional.isPresent() && !userOptional.get().isEmailVerified()) {
			verificationCode = issueAndSendEmailVerification(userOptional.get());
			logger.info("Email verification requested for user {}", normalizedEmail);
		}

		Map<String, Object> responsePayload = new HashMap<>();
		responsePayload.put("message", "If the account exists, a verification code has been sent. Please check inbox and spam folder.");
		if (returnVerificationCodeInResponse && verificationCode != null) {
			responsePayload.put("devCode", verificationCode);
		}

		return ResponseEntity.status(HttpStatus.ACCEPTED).body(responsePayload);
	}

	@PostMapping("/email-verification/confirm")
	public ResponseEntity<?> confirmEmailVerification(@Valid @RequestBody EmailVerificationConfirmRequest verificationConfirmRequest) {
		String normalizedEmail = normalizeEmail(verificationConfirmRequest.email());
		Users user = userRepository.findByEmail(normalizedEmail).orElse(null);

		if (user == null) {
			return invalidEmailVerificationCodeResponse();
		}

		if (user.isEmailVerified()) {
			return ResponseEntity.ok(Map.of("message", "Email is already verified. You can sign in."));
		}

		if (user.getEmailVerificationAttempts() >= emailVerificationMaxAttempts || hasEmailVerificationCodeExpired(user)) {
			clearEmailVerificationState(user);
			userRepository.save(user);
			return invalidEmailVerificationCodeResponse();
		}

		boolean codeMatches = passwordEncoder.matches(
			emailVerificationCodeSecret(verificationConfirmRequest.code()),
			user.getEmailVerificationCodeHash() == null ? "" : user.getEmailVerificationCodeHash()
		);

		if (!codeMatches) {
			user.setEmailVerificationAttempts(user.getEmailVerificationAttempts() + 1);
			userRepository.save(user);
			return invalidEmailVerificationCodeResponse();
		}

		user.setEmailVerified(true);
		user.setEmailVerifiedAt(Instant.now());
		clearEmailVerificationState(user);
		userRepository.save(user);

		return ResponseEntity.ok(Map.of("message", "Email verified successfully. You can now sign in."));
	}

	@PostMapping("/password-reset/request")
	public ResponseEntity<?> requestPasswordReset(@Valid @RequestBody PasswordResetRequest resetRequest) {
		String normalizedEmail = normalizeEmail(resetRequest.email());
		String generatedCode = null;

		Optional<Users> userOptional = userRepository.findByEmail(normalizedEmail);
		if (userOptional.isPresent()) {
			Users user = userOptional.get();
			generatedCode = generateOtpCode();

			user.setPasswordResetCodeHash(passwordEncoder.encode(resetCodeSecret(generatedCode)));
			user.setPasswordResetCodeExpiresAt(Instant.now().plus(Duration.ofMinutes(resetCodeTtlMinutes)));
			user.setPasswordResetAttempts(0);
			userRepository.save(user);

			MailerooEmailService.DeliveryResult deliveryResult = mailerooEmailService.sendPasswordResetCode(
				user.getEmail(),
				user.getName(),
				generatedCode,
				resetCodeTtlMinutes
			);
			if (!deliveryResult.sent()) {
				logger.warn("Password reset email delivery did not complete for {}: {}", normalizedEmail, deliveryResult.message());
			}

			logger.info("Password reset requested for user {}", normalizedEmail);
		}

		Map<String, Object> responsePayload = new HashMap<>();
		responsePayload.put("message", "If the account exists, a password reset code has been sent. Please check inbox and spam folder.");
		if (returnResetCodeInResponse && generatedCode != null) {
			responsePayload.put("devCode", generatedCode);
		}

		return ResponseEntity.status(HttpStatus.ACCEPTED).body(responsePayload);
	}

	@PostMapping("/password-reset/confirm")
	public ResponseEntity<?> confirmPasswordReset(
			@Valid @RequestBody PasswordResetConfirmRequest resetConfirmRequest,
			HttpServletRequest request,
			HttpServletResponse response) {
		String normalizedEmail = normalizeEmail(resetConfirmRequest.email());
		Users user = userRepository.findByEmail(normalizedEmail).orElse(null);

		if (user == null) {
			return invalidResetCodeResponse();
		}

		if (user.getPasswordResetAttempts() >= resetMaxAttempts || hasResetCodeExpired(user)) {
			clearPasswordResetState(user);
			userRepository.save(user);
			return invalidResetCodeResponse();
		}

		boolean codeMatches = passwordEncoder.matches(
			resetCodeSecret(resetConfirmRequest.code()),
			user.getPasswordResetCodeHash() == null ? "" : user.getPasswordResetCodeHash()
		);

		if (!codeMatches) {
			user.setPasswordResetAttempts(user.getPasswordResetAttempts() + 1);
			userRepository.save(user);
			return invalidResetCodeResponse();
		}

		user.setPassword(passwordEncoder.encode(resetConfirmRequest.newPassword()));
		user.setTokenVersion(user.getTokenVersion() + 1);
		clearPasswordResetState(user);
		userRepository.save(user);

		addLogoutCookie(response, isSecureRequest(request));
		SecurityContextHolder.clearContext();

		return ResponseEntity.ok(Map.of("message", "Password updated successfully. Please sign in again."));
	}

	private ResponseEntity<?> genericSignupAcceptedResponse(String verificationCode) {
		Map<String, Object> responsePayload = new HashMap<>();
		responsePayload.put("message", "If the signup details are valid, we have sent a verification code to your email. Please check inbox and spam folder.");
		if (returnVerificationCodeInResponse && verificationCode != null) {
			responsePayload.put("devCode", verificationCode);
		}
		return ResponseEntity.status(HttpStatus.ACCEPTED).body(responsePayload);
	}

	private ResponseEntity<?> unverifiedEmailResponse(String verificationCode) {
		Map<String, Object> responsePayload = new HashMap<>();
		responsePayload.put("error", "EMAIL_NOT_VERIFIED");
		responsePayload.put("message", "Please verify your email before signing in. A new code has been sent if your account exists. Check inbox and spam folder.");
		if (returnVerificationCodeInResponse && verificationCode != null) {
			responsePayload.put("devCode", verificationCode);
		}
		return ResponseEntity.status(HttpStatus.FORBIDDEN).body(responsePayload);
	}

	private ResponseEntity<?> invalidEmailVerificationCodeResponse() {
		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
			"error", "INVALID_EMAIL_VERIFICATION_CODE",
			"message", "Verification code is invalid or expired"
		));
	}

	private ResponseEntity<?> invalidResetCodeResponse() {
		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
			"error", "INVALID_RESET_CODE",
			"message", "Reset code is invalid or expired"
		));
	}

	private String issueAndSendEmailVerification(Users user) {
		String verificationCode = generateOtpCode();

		user.setEmailVerificationCodeHash(passwordEncoder.encode(emailVerificationCodeSecret(verificationCode)));
		user.setEmailVerificationCodeExpiresAt(Instant.now().plus(Duration.ofMinutes(emailVerificationCodeTtlMinutes)));
		user.setEmailVerificationAttempts(0);
		userRepository.save(user);

		MailerooEmailService.DeliveryResult deliveryResult = mailerooEmailService.sendVerificationCode(
			user.getEmail(),
			user.getName(),
			verificationCode,
			emailVerificationCodeTtlMinutes
		);

		if (!deliveryResult.sent()) {
			logger.warn("Email verification delivery did not complete for {}: {}", user.getEmail(), deliveryResult.message());
		}

		return verificationCode;
	}

	private String extractToken(String authHeader, String authCookieToken) {
		if (authHeader != null && authHeader.startsWith("Bearer ")) {
			String token = authHeader.substring(7).trim();
			if (!token.isEmpty() && !"cookie-session".equalsIgnoreCase(token) && !"session".equalsIgnoreCase(token)
					&& !"1".equals(token)) {
				return token;
			}
		}

		if (authCookieToken != null && !authCookieToken.isBlank()) {
			return authCookieToken.trim();
		}

		return null;
	}

	private String extractCookieToken(HttpServletRequest request) {
		if (request.getCookies() == null) {
			return null;
		}

		for (jakarta.servlet.http.Cookie cookie : request.getCookies()) {
			if (authCookieName.equals(cookie.getName()) && StringUtils.hasText(cookie.getValue())) {
				return cookie.getValue().trim();
			}
		}

		return null;
	}

	private void addAuthCookie(HttpServletResponse response, String token, boolean secureRequest) {
		ResponseCookie cookie = buildCookie(token, authCookieMaxAgeSeconds, secureRequest);
		response.addHeader("Set-Cookie", cookie.toString());
	}

	private void addLogoutCookie(HttpServletResponse response, boolean secureRequest) {
		ResponseCookie cookie = buildCookie("", 0, secureRequest);
		response.addHeader("Set-Cookie", cookie.toString());
	}

	private ResponseCookie buildCookie(String token, long maxAgeSeconds, boolean secureRequest) {
		boolean secure = secureRequest || forceSecureCookie;
		String sameSite = normalizeSameSite(authCookieSameSite, secure);

		ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(authCookieName, token)
				.httpOnly(true)
				.secure(secure)
				.path("/")
				.sameSite(sameSite);

		if (maxAgeSeconds <= 0) {
			builder.maxAge(Duration.ZERO);
		} else {
			builder.maxAge(Duration.ofSeconds(maxAgeSeconds));
		}

		return builder.build();
	}

	private boolean isSecureRequest(HttpServletRequest request) {
		String forwardedProto = request.getHeader("X-Forwarded-Proto");
		return request.isSecure() || "https".equalsIgnoreCase(forwardedProto);
	}

	private String normalizeSameSite(String configuredValue, boolean secure) {
		if (configuredValue == null || configuredValue.isBlank()) {
			return secure ? "None" : "Lax";
		}

		if ("None".equalsIgnoreCase(configuredValue)) {
			return secure ? "None" : "Lax";
		}

		if ("Strict".equalsIgnoreCase(configuredValue)) {
			return "Strict";
		}

		return "Lax";
	}

	private String normalizeEmail(String email) {
		return email == null ? "" : email.toLowerCase().trim();
	}

	private String generateOtpCode() {
		return String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
	}

	private String emailVerificationCodeSecret(String rawCode) {
		return "email-verification-code::" + rawCode;
	}

	private String resetCodeSecret(String rawCode) {
		return "reset-code::" + rawCode;
	}

	private boolean hasEmailVerificationCodeExpired(Users user) {
		if (user.getEmailVerificationCodeHash() == null || user.getEmailVerificationCodeExpiresAt() == null) {
			return true;
		}

		return Instant.now().isAfter(user.getEmailVerificationCodeExpiresAt());
	}

	private void clearEmailVerificationState(Users user) {
		user.setEmailVerificationCodeHash(null);
		user.setEmailVerificationCodeExpiresAt(null);
		user.setEmailVerificationAttempts(0);
	}

	private boolean hasResetCodeExpired(Users user) {
		if (user.getPasswordResetCodeHash() == null || user.getPasswordResetCodeExpiresAt() == null) {
			return true;
		}

		return Instant.now().isAfter(user.getPasswordResetCodeExpiresAt());
	}

	private void clearPasswordResetState(Users user) {
		user.setPasswordResetCodeHash(null);
		user.setPasswordResetCodeExpiresAt(null);
		user.setPasswordResetAttempts(0);
	}
}