package com.tushar.demo.timetracker.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.time.LocalDate;
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
    @Column(name = "start_time", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = true)
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime endTime;

    @Column(name = "entry_date")
    private LocalDate entryDate;

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

    @Transient
    private String linkedGoal;

    @Transient
    private Integer focusScore;

    @Transient
    private Integer energyScore;

    @Transient
    private String blockers;

    @Transient
    private String contextNotes;

    @Transient
    private String aiDetail;

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
        if (startTime != null) {
            this.entryDate = startTime.toLocalDate();
        }

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
    public LocalDate getEntryDate() { return entryDate; }
    public void setEntryDate(LocalDate entryDate) { this.entryDate = entryDate; }
    public Long getDuration() { return duration; }
    public void setDuration(Long duration) { this.duration = duration; }
    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
    public List<Long> getTagIds() { return tagIds; }
    public void setTagIds(List<Long> tagIds) {
        this.tagIds = tagIds == null ? new ArrayList<>() : new ArrayList<>(tagIds);
    }
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
    public String getLinkedGoal() { return linkedGoal; }
    public void setLinkedGoal(String linkedGoal) { this.linkedGoal = linkedGoal; }
    public Integer getFocusScore() { return focusScore; }
    public void setFocusScore(Integer focusScore) { this.focusScore = focusScore; }
    public Integer getEnergyScore() { return energyScore; }
    public void setEnergyScore(Integer energyScore) { this.energyScore = energyScore; }
    public String getBlockers() { return blockers; }
    public void setBlockers(String blockers) { this.blockers = blockers; }
    public String getContextNotes() { return contextNotes; }
    public void setContextNotes(String contextNotes) { this.contextNotes = contextNotes; }
    public String getAiDetail() { return aiDetail; }
    public void setAiDetail(String aiDetail) { this.aiDetail = aiDetail; }
    public Users getUser() { return user; }
    public void setUser(Users user) { this.user = user; }
}