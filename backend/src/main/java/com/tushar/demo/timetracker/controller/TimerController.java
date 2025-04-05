package com.tushar.demo.timetracker.controller;

import com.tushar.demo.timetracker.config.JwtUtils;
import com.tushar.demo.timetracker.dto.LoginRequest;
import com.tushar.demo.timetracker.dto.SignupRequest;
import com.tushar.demo.timetracker.dto.addTimeEntryRequest;
import com.tushar.demo.timetracker.model.TimeEntry;
import com.tushar.demo.timetracker.model.Users;
import com.tushar.demo.timetracker.repository.UserRepository;
import com.tushar.demo.timetracker.service.TimeEntryService;
import com.tushar.demo.timetracker.service.UserDetailsServiceImpl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import org.springframework.security.core.userdetails.UserDetails;

@RestController
@RequestMapping("/api/auth")
public class TimerController {

	private final TimeEntryService timeEntryService;
    private final UserDetailsServiceImpl userDetailsService;

    public TimerController(TimeEntryService timeEntryService, UserDetailsServiceImpl userDetailsService) {
        this.timeEntryService = timeEntryService;
        this.userDetailsService = userDetailsService;
    }

    @PostMapping
    public ResponseEntity<TimeEntry> createTimeEntry(
            @RequestBody addTimeEntryRequest request,
            Authentication authentication) {
        
        Users user = userDetailsService.getCurrentUser(authentication);
        TimeEntry entry = timeEntryService.createTimeEntry(request, user);
        return ResponseEntity.ok(entry);
    }

    @GetMapping
    public ResponseEntity<List<TimeEntry>> getTimeEntries(
            @RequestParam LocalDate start,
            @RequestParam LocalDate end,
            Authentication authentication) {
        
        Users user = userDetailsService.getCurrentUser(authentication);
        LocalDateTime startDateTime = start.atStartOfDay();
        LocalDateTime endDateTime = end.atTime(23, 59, 59);
        
        List<TimeEntry> entries = timeEntryService.getTimeEntriesBetweenDates(
                user, 
                startDateTime, 
                endDateTime
        );
        return ResponseEntity.ok(entries);
    }
}