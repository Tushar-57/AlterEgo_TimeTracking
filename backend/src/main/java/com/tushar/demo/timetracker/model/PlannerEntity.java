package com.tushar.demo.timetracker.model;

import jakarta.persistence.*;
import java.util.List;

@Embeddable
public class PlannerEntity {
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "planner_id")
    private List<GoalEntity> goals;

    @Embedded
    private PlannerAvailabilityEntity availability;

    @Column(name = "reminders_enabled")
    private boolean remindersEnabled;

    @Column(name = "calendar_sync")
    private boolean calendarSync;

    @Column(name = "task_management_sync")
    private boolean taskManagementSync;

    // Getters and setters
    public List<GoalEntity> getGoals() { return goals; }
    public void setGoals(List<GoalEntity> goals) { this.goals = goals; }
    public PlannerAvailabilityEntity getAvailability() { return availability; }
    public void setAvailability(PlannerAvailabilityEntity availability) { this.availability = availability; }
    public boolean isRemindersEnabled() { return remindersEnabled; }
    public void setRemindersEnabled(boolean remindersEnabled) { this.remindersEnabled = remindersEnabled; }
    public boolean isCalendarSync() { return calendarSync; }
    public void setCalendarSync(boolean calendarSync) { this.calendarSync = calendarSync; }
    public boolean isTaskManagementSync() { return taskManagementSync; }
    public void setTaskManagementSync(boolean taskManagementSync) { this.taskManagementSync = taskManagementSync; }
}