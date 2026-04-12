package com.tushar.demo.timetracker.logging;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.UUID;

/**
 * Servlet filter that sets up request correlation IDs for distributed tracing.
 * Generates or extracts request IDs and sets user context for logging.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestCorrelationFilter implements Filter {

    public static final String REQUEST_ID_HEADER = "X-Request-ID";
    public static final String USER_ID_HEADER = "X-User-ID";

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        // Initialization if needed
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        // Extract or generate request ID
        String requestId = httpRequest.getHeader(REQUEST_ID_HEADER);
        if (requestId == null || requestId.isEmpty()) {
            requestId = generateRequestId();
        }

        // Set request ID in response header for client tracking
        httpResponse.setHeader(REQUEST_ID_HEADER, requestId);

        // Extract user ID from header or JWT (fallback)
        String userId = httpRequest.getHeader(USER_ID_HEADER);
        if (userId == null || userId.isEmpty()) {
            userId = extractUserFromContext();
        }

        // Set context for logging
        LogContext.setRequestId(requestId);
        LogContext.setUserId(userId);

        try {
            // Continue the filter chain
            chain.doFilter(request, response);
        } finally {
            // Clear context after request completes
            LogContext.clear();
        }
    }

    @Override
    public void destroy() {
        // Cleanup if needed
    }

    /**
     * Generate a unique request ID.
     */
    private String generateRequestId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }

    /**
     * Extract user ID from security context (Spring Security).
     */
    private String extractUserFromContext() {
        try {
            org.springframework.security.core.context.SecurityContext context =
                    org.springframework.security.core.context.SecurityContextHolder.getContext();

            if (context.getAuthentication() != null && context.getAuthentication().isAuthenticated()) {
                String username = context.getAuthentication().getName();
                if (username != null && !username.isEmpty() && !"anonymousUser".equals(username)) {
                    return username;
                }
            }
        } catch (Exception e) {
            // Security context not available
        }
        return "";
    }
}
