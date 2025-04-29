package com.tushar.demo.timetracker.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "goals")
public class GoalEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long goalId;

    @Column
    private String id; // Keep this for your custom ID (e.g., "goal1")

    @Column
    private String title;

    @Column
    private String description;

    @Column
    private String category;

    @Column
    private String priority;

    @ElementCollection
    @CollectionTable(name = "goal_milestones", joinColumns = @JoinColumn(name = "goal_id"))
    @Column(name = "milestone")
    private List<String> milestones;

    @Column(name = "end_date")
    private String endDate;

    @Column(name = "estimated_effort_hours")
    private Integer estimatedEffortHours;

    @Column(name = "why_it_matters")
    private String whyItMatters;

    @Embedded
    private SmartCriteriaEntity smartCriteria;

    public GoalEntity() {}
    public GoalEntity(String id, String title, String description, String category, String priority,
                      List<String> milestones, String endDate, Integer estimatedEffortHours, String whyItMatters,
                      SmartCriteriaEntity smartCriteria) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.category = category;
        this.priority = priority;
        this.milestones = milestones;
        this.endDate = endDate;
        this.estimatedEffortHours = estimatedEffortHours;
        this.whyItMatters = whyItMatters;
        this.smartCriteria = smartCriteria;
    }

    // Getters and setters
    public Long getGoalId() { return goalId; }
    public void setGoalId(Long goalId) { this.goalId = goalId; }
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public List<String> getMilestones() { return milestones; }
    public void setMilestones(List<String> milestones) { this.milestones = milestones; }
    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }
    public Integer getEstimatedEffortHours() { return estimatedEffortHours; }
    public void setEstimatedEffortHours(Integer estimatedEffortHours) { this.estimatedEffortHours = estimatedEffortHours; }
    public String getWhyItMatters() { return whyItMatters; }
    public void setWhyItMatters(String whyItMatters) { this.whyItMatters = whyItMatters; }
    public SmartCriteriaEntity getSmartCriteria() { return smartCriteria; }
    public void setSmartCriteria(SmartCriteriaEntity smartCriteria) { this.smartCriteria = smartCriteria; }
}