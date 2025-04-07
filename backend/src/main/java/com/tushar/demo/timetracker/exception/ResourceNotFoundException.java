// ResourceNotFoundException.java
package com.tushar.demo.timetracker.exception;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}