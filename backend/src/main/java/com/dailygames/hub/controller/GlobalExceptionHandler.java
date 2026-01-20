package com.dailygames.hub.controller;

import lombok.AllArgsConstructor;
import lombok.Data;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        String errorCode = generateErrorCode("ARG");
        logger.warn("IllegalArgumentException [{}]: {}", errorCode, ex.getMessage());
        return ResponseEntity.badRequest()
            .body(new ErrorResponse("Bad Request", ex.getMessage(), errorCode));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(BadCredentialsException ex) {
        String errorCode = generateErrorCode("AUTH");
        logger.warn("BadCredentialsException [{}]: {}", errorCode, ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(new ErrorResponse("Unauthorized", "Invalid username or password", errorCode));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrity(DataIntegrityViolationException ex) {
        String errorCode = generateErrorCode("DATA");
        logger.error("DataIntegrityViolationException [{}]: {}", errorCode, ex.getMessage(), ex);

        String message = "Database constraint violation";
        if (ex.getMessage() != null) {
            if (ex.getMessage().contains("username")) {
                message = "Username already exists";
            } else if (ex.getMessage().contains("email")) {
                message = "Email already exists";
            }
        }
        return ResponseEntity.badRequest()
            .body(new ErrorResponse("Data Error", message, errorCode));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        String errorCode = generateErrorCode("VAL");
        logger.warn("ValidationException [{}]: {}", errorCode, ex.getMessage());

        Map<String, Object> response = new HashMap<>();
        Map<String, String> errors = new HashMap<>();

        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        response.put("error", "Validation Failed");
        response.put("errorCode", errorCode);
        response.put("details", errors);
        return ResponseEntity.badRequest().body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        String errorCode = generateErrorCode("ERR");
        logger.error("Unhandled exception [{}]: {}", errorCode, ex.getMessage(), ex);

        // Include actual error message for debugging (in production, you might want to hide this)
        String message = ex.getMessage() != null ? ex.getMessage() : "An unexpected error occurred";
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(new ErrorResponse("Internal Server Error", message, errorCode));
    }

    private String generateErrorCode(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    @Data
    @AllArgsConstructor
    public static class ErrorResponse {
        private String error;
        private String message;
        private String errorCode;
    }
}
