package com.tushar.demo.timetracker.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
public class MailerooEmailService {

    private static final Logger logger = LoggerFactory.getLogger(MailerooEmailService.class);

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final boolean mailEnabled;
    private final String mailerooBaseUrl;
    private final String apiKey;
    private final String fromEmail;
    private final String fromName;
    private final boolean failOnDeliveryError;
    private final int requestTimeoutMs;

    public MailerooEmailService(
        ObjectMapper objectMapper,
        @Value("${app.mail.enabled:true}") boolean mailEnabled,
        @Value("${app.mail.maileroo.base-url:https://smtp.maileroo.com/api/v2}") String mailerooBaseUrl,
        @Value("${app.mail.maileroo.api-key:}") String apiKey,
        @Value("${app.mail.from-email:}") String fromEmail,
        @Value("${app.mail.from-name:AlterEgo}") String fromName,
        @Value("${app.mail.fail-on-delivery-error:false}") boolean failOnDeliveryError,
        @Value("${app.mail.request-timeout-ms:5000}") int requestTimeoutMs
    ) {
        this.objectMapper = objectMapper;
        this.mailEnabled = mailEnabled;
        this.mailerooBaseUrl = mailerooBaseUrl;
        this.apiKey = apiKey;
        this.fromEmail = fromEmail;
        this.fromName = fromName;
        this.failOnDeliveryError = failOnDeliveryError;
        this.requestTimeoutMs = requestTimeoutMs;
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofMillis(Math.max(requestTimeoutMs, 1000)))
            .build();
    }

    public DeliveryResult sendVerificationCode(String recipientEmail, String recipientName, String code, long codeTtlMinutes) {
        String safeName = StringUtils.hasText(recipientName) ? recipientName.trim() : "there";
        String subject = "Verify your AlterEgo account";

        String plainBody = String.join("\n", List.of(
            "Hi " + safeName + ",",
            "",
            "Your AlterEgo verification code is: " + code,
            "This code expires in " + codeTtlMinutes + " minutes.",
            "",
            "If you do not see this email in your inbox, check your spam or junk folder.",
            "",
            "If you did not create this account, you can safely ignore this email."
        ));

        String htmlBody = "<p>Hi " + escapeHtml(safeName) + ",</p>"
            + "<p>Your AlterEgo verification code is:</p>"
            + "<p style='font-size:24px;font-weight:700;letter-spacing:2px;margin:12px 0;'>" + escapeHtml(code) + "</p>"
            + "<p>This code expires in " + codeTtlMinutes + " minutes.</p>"
            + "<p>If you do not see this email in your inbox, please check your spam or junk folder.</p>"
            + "<p>If you did not create this account, you can safely ignore this email.</p>";

        return sendBasicEmail(recipientEmail, safeName, subject, plainBody, htmlBody, Map.of("flow", "email_verification"));
    }

    public DeliveryResult sendPasswordResetCode(String recipientEmail, String recipientName, String code, long codeTtlMinutes) {
        String safeName = StringUtils.hasText(recipientName) ? recipientName.trim() : "there";
        String subject = "Reset your AlterEgo password";

        String plainBody = String.join("\n", List.of(
            "Hi " + safeName + ",",
            "",
            "Your AlterEgo password reset code is: " + code,
            "This code expires in " + codeTtlMinutes + " minutes.",
            "",
            "If you do not see this email in your inbox, check your spam or junk folder.",
            "",
            "If you did not request this password reset, you can safely ignore this email."
        ));

        String htmlBody = "<p>Hi " + escapeHtml(safeName) + ",</p>"
            + "<p>Your AlterEgo password reset code is:</p>"
            + "<p style='font-size:24px;font-weight:700;letter-spacing:2px;margin:12px 0;'>" + escapeHtml(code) + "</p>"
            + "<p>This code expires in " + codeTtlMinutes + " minutes.</p>"
            + "<p>If you do not see this email in your inbox, please check your spam or junk folder.</p>"
            + "<p>If you did not request this password reset, you can safely ignore this email.</p>";

        return sendBasicEmail(recipientEmail, safeName, subject, plainBody, htmlBody, Map.of("flow", "password_reset"));
    }

    private DeliveryResult sendBasicEmail(
        String recipientEmail,
        String recipientName,
        String subject,
        String plain,
        String html,
        Map<String, String> tags
    ) {
        if (!mailEnabled) {
            logger.info("Mail delivery is disabled. Skipping outbound email for {}", recipientEmail);
            return DeliveryResult.failed("MAIL_DISABLED");
        }

        if (!StringUtils.hasText(apiKey) || !StringUtils.hasText(fromEmail)) {
            logger.warn("Maileroo is not configured (missing API key or from email). Skipping outbound email for {}", recipientEmail);
            return DeliveryResult.failed("MAIL_NOT_CONFIGURED");
        }

        Map<String, Object> payload = Map.of(
            "from", Map.of(
                "address", fromEmail.trim(),
                "display_name", fromName
            ),
            "to", List.of(Map.of(
                "address", recipientEmail,
                "display_name", recipientName
            )),
            "subject", subject,
            "plain", plain,
            "html", html,
            "tracking", false,
            "tags", tags
        );

        String endpoint = normalizeBaseUrl(mailerooBaseUrl) + "/emails";

        try {
            String requestBody = objectMapper.writeValueAsString(payload);
            HttpRequest request = HttpRequest.newBuilder(URI.create(endpoint))
                .timeout(Duration.ofMillis(Math.max(requestTimeoutMs, 1000)))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey.trim())
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            String providerMessage = extractMessage(response.body());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                logger.info("Maileroo delivery accepted for {} with status {}", recipientEmail, response.statusCode());
                return DeliveryResult.sent(providerMessage == null ? "EMAIL_QUEUED" : providerMessage);
            }

            String failureMessage = "Maileroo delivery failed with status " + response.statusCode() + " for " + recipientEmail;
            logger.warn("{}; response={} ", failureMessage, truncate(response.body(), 400));
            return handleFailure(failureMessage + (providerMessage == null ? "" : " - " + providerMessage));
        } catch (IOException | InterruptedException ex) {
            if (ex instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }

            String failureMessage = "Maileroo delivery error for " + recipientEmail + ": " + ex.getMessage();
            logger.error(failureMessage);
            return handleFailure(failureMessage);
        }
    }

    private DeliveryResult handleFailure(String message) {
        if (failOnDeliveryError) {
            throw new IllegalStateException(message);
        }
        return DeliveryResult.failed(message);
    }

    private String normalizeBaseUrl(String baseUrl) {
        String normalized = StringUtils.hasText(baseUrl) ? baseUrl.trim() : "https://smtp.maileroo.com/api/v2";
        if (normalized.endsWith("/")) {
            return normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }

    private String extractMessage(String responseBody) {
        if (!StringUtils.hasText(responseBody)) {
            return null;
        }

        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode messageNode = root.get("message");
            if (messageNode != null && messageNode.isTextual()) {
                return messageNode.asText();
            }
        } catch (IOException ex) {
            logger.debug("Unable to parse Maileroo response body: {}", ex.getMessage());
        }

        return null;
    }

    private String truncate(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength) + "...";
    }

    private String escapeHtml(String input) {
        if (input == null) {
            return "";
        }

        return input
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&#39;");
    }

    public record DeliveryResult(boolean sent, String message) {
        public static DeliveryResult sent(String message) {
            return new DeliveryResult(true, message);
        }

        public static DeliveryResult failed(String message) {
            return new DeliveryResult(false, message);
        }
    }
}
