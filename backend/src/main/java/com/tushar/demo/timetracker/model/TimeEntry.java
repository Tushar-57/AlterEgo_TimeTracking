package com.tushar.demo.timetracker.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.FutureOrPresent;

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
    private String description;

    @NotNull(message = "Start time is required")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime startTime;

//    @FutureOrPresent(message = "End time must be in the future")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @NotNull(message = "End time must be in the future")
    private LocalDateTime endTime;

    private Long duration;
    
    @ManyToOne
    private Project project;

    @ElementCollection
    private List<Long> tagIds = new ArrayList<>(); // Changed from List<String> tags to List<Long> tagIds

    private boolean billable;
    private String client;
    private boolean active;
    
    @Column(name = "position_top")
    private String positionTop;

    @Column(name = "position_left")
    private String positionLeft;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private Users user;

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

    public Long getId() { return id; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
    public Long getDuration() { return duration; }
    public void setDuration(Long duration) { this.duration = duration; }
    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
    public List<Long> getTagIds() { return tagIds; }
    public void setTagIds(List<Long> tagIds) { this.tagIds = tagIds; }
    public boolean isBillable() { return billable; }
    public void setBillable(boolean billable) { this.billable = billable; }
    public String getClient() { return client; }
    public void setClient(String client) { this.client = client; }
    public boolean getIsActive() { return active; }
    public void setIsActive(boolean isActive) { this.active = isActive; }
    public String getPositionTop() { return positionTop; }
    public void setPositionTop(String positionTop) { this.positionTop = positionTop; }
    public String getPositionLeft() { return positionLeft; }
    public void setPositionLeft(String positionLeft) { this.positionLeft = positionLeft; }
    public Users getUser() { return user; }
    public void setUser(Users user) { this.user = user; }
}