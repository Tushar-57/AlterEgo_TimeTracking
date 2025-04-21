package com.tushar.demo.timetracker.dto.request;

import java.util.Map;

public record ApiResponse<T>(
	    boolean success,
	    String message,
	    T data,
	    Map<String, String> errors
	) {
	    public static <T> ApiResponse<T> success(T data, String message) {
	        return new ApiResponse<>(true, message, data, null);
	    }

	    public static <T> ApiResponse<T> error(String message, Map<String, String> errors) {
	        return new ApiResponse<>(false, message, null, errors);
	    }
	}