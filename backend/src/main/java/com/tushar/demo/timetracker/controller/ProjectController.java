package com.tushar.demo.timetracker.controller;
//
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tushar.demo.timetracker.dto.request.ProjectRequest;
import com.tushar.demo.timetracker.exception.ResourceNotFoundException;
import com.tushar.demo.timetracker.model.Project;
import com.tushar.demo.timetracker.model.Users;
import com.tushar.demo.timetracker.repository.ProjectRepository;
import com.tushar.demo.timetracker.repository.UserRepository;
import com.tushar.demo.timetracker.service.ProjectService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class ProjectController {

 private final ProjectService projectService;
 private final UserRepository userRepository;

 @Autowired
 public ProjectController(ProjectService projectService, UserRepository userRepository) {
     this.projectService = projectService;
     this.userRepository = userRepository;
 }

 @GetMapping("/userProjects")
 public ResponseEntity<List<Project>> getUserProjects(Authentication authentication) {
     Users user = getUserFromAuth(authentication);
     return ResponseEntity.ok(projectService.getUserProjects(user));
 }

 @PostMapping
 public ResponseEntity<Project> createProject(
         @Valid @RequestBody ProjectRequest request,
         Authentication authentication
 ) {
     Users user = getUserFromAuth(authentication);
     return ResponseEntity.status(HttpStatus.CREATED)
             .body(projectService.createProject(request, user));
 }

 @PutMapping("/{id}")
 public ResponseEntity<Project> updateProject(
         @PathVariable Long id,
         @Valid @RequestBody ProjectRequest request,
         Authentication authentication
 ) {
     Users user = getUserFromAuth(authentication);
     return ResponseEntity.ok(projectService.updateProject(id, request, user));
 }

 @DeleteMapping("/{id}")
 public ResponseEntity<Void> deleteProject(
         @PathVariable Long id,
         Authentication authentication
 ) {
     Users user = getUserFromAuth(authentication);
     projectService.deleteProject(id, user);
     return ResponseEntity.noContent().build();
 }

 private Users getUserFromAuth(Authentication authentication) {
     return userRepository.findByEmail(authentication.getName())
             .orElseThrow(() -> new ResourceNotFoundException("User not found"));
 }
}