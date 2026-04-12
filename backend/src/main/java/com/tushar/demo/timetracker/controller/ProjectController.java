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
import com.tushar.demo.timetracker.integration.AgenticKnowledgeSyncService;
import com.tushar.demo.timetracker.model.Project;
import com.tushar.demo.timetracker.model.Users;
import com.tushar.demo.timetracker.repository.ProjectRepository;
import com.tushar.demo.timetracker.repository.UserRepository;
import com.tushar.demo.timetracker.service.ProjectService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:5173}", allowCredentials = "true")
public class ProjectController {

 private final ProjectService projectService;
 private final UserRepository userRepository;
 private final ProjectRepository projectRepository;
 private final AgenticKnowledgeSyncService agenticKnowledgeSyncService;

 @Autowired
 public ProjectController(
         ProjectService projectService,
         UserRepository userRepository,
         ProjectRepository projectRepository,
         AgenticKnowledgeSyncService agenticKnowledgeSyncService) {
     this.projectService = projectService;
     this.userRepository = userRepository;
     this.projectRepository = projectRepository;
     this.agenticKnowledgeSyncService = agenticKnowledgeSyncService;
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
     Project created = projectService.createProject(request, user);
     agenticKnowledgeSyncService.syncProject(created, user, "create_project");
     return ResponseEntity.status(HttpStatus.CREATED).body(created);
 }

 @PutMapping("/{id}")
 public ResponseEntity<Project> updateProject(
         @PathVariable Long id,
         @Valid @RequestBody ProjectRequest request,
         Authentication authentication
 ) {
     Users user = getUserFromAuth(authentication);
     Project updated = projectService.updateProject(id, request, user);
     agenticKnowledgeSyncService.syncProject(updated, user, "update_project");
     return ResponseEntity.ok(updated);
 }

 @DeleteMapping("/{id}")
 public ResponseEntity<Void> deleteProject(
         @PathVariable Long id,
         Authentication authentication
 ) {
     Users user = getUserFromAuth(authentication);

     Project existing = projectRepository.findByIdAndUser(id, user)
         .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

     projectService.deleteProject(id, user);
     agenticKnowledgeSyncService.syncProjectDeletion(id, existing.getName(), user, "delete_project");
     return ResponseEntity.noContent().build();
 }

 private Users getUserFromAuth(Authentication authentication) {
     if (authentication == null || authentication.getName() == null) {
         throw new ResourceNotFoundException("User not authenticated");
     }
     return userRepository.findByEmail(authentication.getName())
             .orElseThrow(() -> new ResourceNotFoundException("User not found"));
 }
}