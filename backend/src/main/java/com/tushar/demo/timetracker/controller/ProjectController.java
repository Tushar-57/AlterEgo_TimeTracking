package com.tushar.demo.timetracker.controller;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tushar.demo.timetracker.model.Project;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class ProjectController {
    
//    @GetMapping("getProjects")
//    public List<Project> getProjects(Authentication authentication) {
//        // Implement project fetching logic
//    }
}