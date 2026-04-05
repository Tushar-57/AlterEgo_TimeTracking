package com.tushar.demo.timetracker.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import com.tushar.demo.timetracker.service.impl.UserDetailsServiceImpl;
import com.tushar.demo.timetracker.model.Users;
import com.tushar.demo.timetracker.repository.UserRepository;

import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthFilter.class);
    private final JwtUtils jwtUtils;
    private final UserDetailsServiceImpl userDetailsService;
    private final UserRepository userRepository;

    @Value("${app.auth.cookie.name:auth_token}")
    private String authCookieName;

    public JwtAuthFilter(JwtUtils jwtUtils, UserDetailsServiceImpl userDetailsService, UserRepository userRepository) {
        this.jwtUtils = jwtUtils;
        this.userDetailsService = userDetailsService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                    HttpServletResponse response, 
                                    FilterChain filterChain) 
        throws ServletException, IOException {
        
        try {
            String jwt = parseBearerJwt(request);
            if ((!StringUtils.hasText(jwt) || !jwtUtils.validateToken(jwt))) {
                jwt = parseCookieJwt(request);
            }

            logger.debug("Processing request for {}", request.getRequestURI());
            if (jwt != null && !jwt.isEmpty() && jwtUtils.validateToken(jwt)) {
                String email = jwtUtils.getUsernameFromToken(jwt);

                Users user = userRepository.findByEmail(email).orElse(null);
                if (user == null) {
                    logger.warn("JWT subject does not map to an existing user: {}", email);
                    filterChain.doFilter(request, response);
                    return;
                }

                if (!jwtUtils.isTokenVersionValid(jwt, user.getTokenVersion())) {
                    logger.info("Rejected stale JWT for user {} due to token version mismatch", email);
                    filterChain.doFilter(request, response);
                    return;
                }

                UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                logger.debug("Authenticated user: {}", email);
                
                UsernamePasswordAuthenticationToken authentication = 
                    new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities());
                        
                authentication.setDetails(
                    new WebAuthenticationDetailsSource().buildDetails(request));
                
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } else {
                logger.debug("No valid JWT token found for request: {}", request.getRequestURI());
            }
        } catch (Exception e) {
            logger.error("Cannot set user authentication for request {}: {}", request.getRequestURI(), e.getMessage());
        }
        
        filterChain.doFilter(request, response);
    }

    private String parseBearerJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");
        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            String token = headerAuth.substring(7).trim();
            if ("cookie-session".equalsIgnoreCase(token) || "session".equalsIgnoreCase(token) || "1".equals(token)) {
                return null;
            }
            return token;
        }

        return null;
    }

    private String parseCookieJwt(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (authCookieName.equals(cookie.getName()) && StringUtils.hasText(cookie.getValue())) {
                    return cookie.getValue();
                }
            }
        }

        return null;
    }
}