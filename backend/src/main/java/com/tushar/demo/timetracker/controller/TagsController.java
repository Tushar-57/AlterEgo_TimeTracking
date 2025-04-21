package com.tushar.demo.timetracker.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
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

import com.tushar.demo.timetracker.dto.request.TagCreateRequest;
import com.tushar.demo.timetracker.exception.ResourceNotFoundException;
import com.tushar.demo.timetracker.model.Project;
import com.tushar.demo.timetracker.model.Tags;
import com.tushar.demo.timetracker.model.Users;
import com.tushar.demo.timetracker.repository.ProjectRepository;
import com.tushar.demo.timetracker.repository.TagsRepository;
import com.tushar.demo.timetracker.repository.UserRepository;

import jakarta.validation.Valid;

//ProjectController.java
@RestController
@RequestMapping("/api/tags")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class TagsController {

	private final UserRepository userRepository;
	private final TagsRepository tagsRepository;

	@Autowired
	public TagsController(UserRepository userRepository, TagsRepository tagsRepository) {
		this.userRepository = userRepository;
		this.tagsRepository = tagsRepository;
	}

	@GetMapping
	public ResponseEntity<List<Tags>> getUserTags(Authentication authentication) {
		Users user = userRepository.findByEmail(authentication.getName())
				.orElseThrow(() -> new ResourceNotFoundException("User not found"));
		return ResponseEntity.ok(tagsRepository.findByUser(user)); // Fixed user-specific query
	}

	@PostMapping
	public ResponseEntity<?> createUserTag(@Valid @RequestBody TagCreateRequest tagRequest, Authentication authentication) {
	    Users user = userRepository.findByEmail(authentication.getName())
	            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

	    if (tagsRepository.findByNameAndUser(tagRequest.name(), user).isPresent()) {
	        return ResponseEntity.status(HttpStatus.CONFLICT).body("Tag name already exists");
	    }

	    Tags tag = new Tags();
	    tag.setName(tagRequest.name());
	    tag.setColor(tagRequest.color());
	    tag.setUser(user); // Set user from authentication

	    Tags savedTag = tagsRepository.save(tag);
	    return ResponseEntity.status(HttpStatus.CREATED).body(savedTag);
	}

	@PutMapping("/{id}")
	public ResponseEntity<Tags> updateTag(@PathVariable Long id, @Valid @RequestBody Tags tagDetails,
			Authentication authentication) {
		Users user = userRepository.findByEmail(authentication.getName())
				.orElseThrow(() -> new ResourceNotFoundException("User not found"));

		Tags existingTag = tagsRepository.findByIdAndUser(id, user)
				.orElseThrow(() -> new ResourceNotFoundException("Tag not found"));

		existingTag.setName(tagDetails.getName());
		existingTag.setColor(tagDetails.getColor());

		return ResponseEntity.ok(tagsRepository.save(existingTag));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> deleteTag(@PathVariable Long id, Authentication authentication) {
		Users user = userRepository.findByEmail(authentication.getName())
				.orElseThrow(() -> new ResourceNotFoundException("User not found"));

		Tags tag = tagsRepository.findByIdAndUser(id, user)
				.orElseThrow(() -> new ResourceNotFoundException("Tag not found"));

		tagsRepository.delete(tag);
		return ResponseEntity.noContent().build();
	}
}