// TimeEntry.java
package com.tushar.demo.timetracker.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.PastOrPresent;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.Duration;

@Entity
public class TimeEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Task description is required")
    private String taskDescription;

    @NotNull(message = "Start time is required")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime startTime;

    @Column(nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @FutureOrPresent(message = "End time must be in the future")
    private LocalDateTime endTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private Users user;

    private String category;
    private Long duration; // In seconds
    @ElementCollection
    private List<String> tags = new ArrayList<>();

    @ManyToOne
    private Project project;

    private boolean billable;
    private String client;
    
    @AssertTrue(message = "End time must be after start time")
    public boolean isEndTimeValid() {
        return endTime == null || endTime.isAfter(startTime);
    }

    
    @PrePersist
    @PreUpdate
    private void calculateDuration() {
        if (startTime != null && endTime != null && endTime.isAfter(startTime)) {
            this.duration = Duration.between(startTime, endTime).getSeconds();
        } else {
            this.duration = 0L;
        }
    }

    // Getters and Setters
    public Long getId() { return id; }
	public String getTaskDescription() { return taskDescription; }
	public void setTaskDescription(String taskDescription) { this.taskDescription = taskDescription; }
	public LocalDateTime getStartTime() { return startTime; }
	public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
	public LocalDateTime getEndTime() { return endTime; }
	public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
	public Users getUser() { return user; }
	public void setUser(Users user) { this.user = user; }
	public String getCategory() { return category; }
	public void setCategory(String category) { this.category = category; }
	public Long getDuration() { return duration; }
}