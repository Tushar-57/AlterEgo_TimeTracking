package com.tushar.demo.timetracker.config;

import java.util.Arrays;
import java.util.List;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.security.web.header.writers.StaticHeadersWriter;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;


@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthEntryPoint authEntryPoint;
    private final JwtAuthFilter jwtAuthFilter;
    private final AuthRateLimitFilter authRateLimitFilter;

    @Value("${app.cors.allowed-origin-patterns:http://localhost:5173,http://localhost:3000,http://localhost:8088,https://*.vercel.app,https://*.netlify.app}")
    private String allowedOriginPatternsProperty;

    @Value("${app.security.csp.policy:default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'}")
    private String contentSecurityPolicy;

    @Value("${app.security.frame.same-origin:false}")
    private boolean allowSameOriginFrames;
    
    public SecurityConfig(
            JwtAuthEntryPoint authEntryPoint,
            JwtAuthFilter jwtAuthFilter,
            AuthRateLimitFilter authRateLimitFilter) {
        this.authEntryPoint = authEntryPoint;
        this.jwtAuthFilter = jwtAuthFilter;
        this.authRateLimitFilter = authRateLimitFilter;
    }
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource())) // Use custom CORS config
            .csrf(csrf -> csrf.disable())
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint(authEntryPoint)
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers(
                    "/api/auth/signup",
                    "/api/auth/login",
                    "/api/auth/validate",
                    "/api/auth/email-verification/request",
                    "/api/auth/email-verification/confirm",
                    "/api/auth/password-reset/request",
                    "/api/auth/password-reset/confirm",
                    "/h2-console/**",
                    "/health",
                    "/api/health"
                ).permitAll()
                .requestMatchers("/api/auth/logout", "/api/auth/logout-all").authenticated()
                .requestMatchers("/api/onboarding/**").authenticated()
                .anyRequest().authenticated()
            )
            .headers(headers -> {
                if (allowSameOriginFrames) {
                    headers.frameOptions(frame -> frame.sameOrigin());
                } else {
                    headers.frameOptions(frame -> frame.deny());
                }
                headers.contentTypeOptions(contentTypeOptions -> {});
                headers.referrerPolicy(referrer ->
                    referrer.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN)
                );
                headers.contentSecurityPolicy(csp -> csp.policyDirectives(contentSecurityPolicy));
                headers.addHeaderWriter(
                    new StaticHeadersWriter("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
                );
                headers.httpStrictTransportSecurity(hsts ->
                    hsts.includeSubDomains(true)
                        .preload(true)
                        .maxAgeInSeconds(31536000)
                );
            })
            .addFilterBefore(authRateLimitFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterAfter(jwtAuthFilter, AuthRateLimitFilter.class);

        return http.build();
    }

    // Add this bean definition
    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(parseAllowedOriginPatterns());
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.addExposedHeader("Authorization"); // Add this line
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config); // Apply to all endpoints
        return source;
    }

    private List<String> parseAllowedOriginPatterns() {
        return Arrays.stream(allowedOriginPatternsProperty.split(","))
            .map(String::trim)
            .filter(pattern -> !pattern.isEmpty())
            .toList();
    }

    @Bean
    public AuthenticationManager authenticationManager(
        AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

}