package com.tushar.demo.timetracker.exception;

import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.validation.ObjectError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalApiExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(MethodArgumentNotValidException exception) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        String firstMessage = null;

        for (FieldError fieldError : exception.getBindingResult().getFieldErrors()) {
            String message = fieldError.getDefaultMessage();
            // Keep the first message seen for a field; don't let a later generic one clobber it.
            fieldErrors.putIfAbsent(fieldError.getField(), message);
            if (firstMessage == null && message != null && !message.isBlank()) {
                firstMessage = message;
            }
        }

        // Class-level constraints (e.g. @AssertTrue "End time must be after start time")
        // land as global errors, not field errors — surface them too.
        for (ObjectError globalError : exception.getBindingResult().getGlobalErrors()) {
            String message = globalError.getDefaultMessage();
            if (message != null && !message.isBlank()) {
                fieldErrors.putIfAbsent(globalError.getObjectName(), message);
                if (firstMessage == null) {
                    firstMessage = message;
                }
            }
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("success", false);
        payload.put("error", "VALIDATION_FAILED");
        // Give the client the specific reason so forms can show it verbatim,
        // instead of a generic "one or more fields are invalid".
        payload.put("message", firstMessage != null ? firstMessage : "One or more fields are invalid");
        payload.put("fieldErrors", fieldErrors);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(payload);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraintViolation(ConstraintViolationException exception) {
        String firstMessage = exception.getConstraintViolations().stream()
                .map(violation -> violation.getMessage())
                .filter(message -> message != null && !message.isBlank())
                .findFirst()
                .orElse("Request validation failed");

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("success", false);
        payload.put("error", "VALIDATION_FAILED");
        payload.put("message", firstMessage);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(payload);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrityViolation(DataIntegrityViolationException exception) {
        // A unique/foreign-key constraint bounced the write (duplicate name under a
        // race, deleting a row that's still referenced, etc.). Return a clean 409
        // instead of leaking a stack-trace 500 to the UI.
        Map<String, Object> payload = new HashMap<>();
        payload.put("success", false);
        payload.put("error", "CONFLICT");
        payload.put("message", "This change conflicts with existing data and could not be saved");

        return ResponseEntity.status(HttpStatus.CONFLICT).body(payload);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleUnreadableBody(HttpMessageNotReadableException exception) {
        // Malformed JSON, a wrong-typed field (e.g. "abc" for a number), or an
        // empty body on an endpoint that requires one. Without this handler Spring
        // returns a bare 400 with no parseable envelope and the UI shows nothing.
        Map<String, Object> payload = new HashMap<>();
        payload.put("success", false);
        payload.put("error", "MALFORMED_REQUEST");
        payload.put("message", "Request body is missing or malformed");

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(payload);
    }
}
