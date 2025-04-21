package com.tushar.demo.timetracker.controller;

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

import com.tushar.demo.timetracker.exception.ResourceNotFoundException;
import com.tushar.demo.timetracker.model.Project;
import com.tushar.demo.timetracker.model.Users;
import com.tushar.demo.timetracker.repository.ProjectRepository;
import com.tushar.demo.timetracker.repository.UserRepository;

//ProjectController.java
@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class ProjectController {
 
 private final ProjectRepository projectRepository;
 private final UserRepository userRepository;

 @Autowired
 public ProjectController(ProjectRepository projectRepository, UserRepository userRepository) {
     this.projectRepository = projectRepository;
     this.userRepository = userRepository;
 }

 @GetMapping
 public ResponseEntity<List<Project>> getUserProjects(Authentication authentication) {
	    if (authentication == null || !authentication.isAuthenticated()) {
	        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
	    }
	    Users user = userRepository.findByEmail(authentication.getName())
	        .orElseThrow(() -> new ResourceNotFoundException("User not found"));
	        
	    List<Project> projects = projectRepository.findByUser(user);
	    return ResponseEntity.ok(projects);
	}

 @PostMapping
 public ResponseEntity<Project> createProject(@RequestBody Project project, Authentication authentication) {
     Users user = userRepository.findByEmail(authentication.getName())
             .orElseThrow(() -> new ResourceNotFoundException("User not found"));
     project.setUser(user);
     Project savedProject = projectRepository.save(project);
     return ResponseEntity.status(HttpStatus.CREATED).body(savedProject);
 }
 @PutMapping("/{id}")
 public ResponseEntity<Project> updateProject(
     @PathVariable Long id,
     @RequestBody Project project,
     Authentication authentication
 ) {
     Users user = userRepository.findByEmail(authentication.getName())
             .orElseThrow(() -> new ResourceNotFoundException("User not found"));
     Project existing = projectRepository.findByIdAndUser(id, user)
             .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
     
     existing.setName(project.getName());
     existing.setColor(project.getColor());
     existing.setClient(project.getClient());
     
     return ResponseEntity.ok(projectRepository.save(existing));
 }

 @PreAuthorize("#authentication.principal.username == @userRepository.findById(#id).get().email")
 @DeleteMapping("/{id}")
 public ResponseEntity<Void> deleteProject(
     @PathVariable Long id,
     Authentication authentication) {
     Users user = userRepository.findByEmail(authentication.getName())
             .orElseThrow(() -> new ResourceNotFoundException("User not found"));
     Project project = projectRepository.findByIdAndUser(id, user)
             .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
     
     projectRepository.delete(project);
     return ResponseEntity.noContent().build();
 }

 // Add other CRUD endpoints as needed
}