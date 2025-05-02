package com.tushar.demo.timetracker.model;

import com.tushar.demo.timetracker.dto.request.OnboardingRequestDTO;
import com.tushar.demo.timetracker.dto.response.OnboardingResponseDTO;
import jakarta.persistence.*;
import java.util.List;
import java.util.stream.Collectors;

@Entity
@Table(name = "onboarding")
public class OnboardingEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;

    @Column(nullable = false)
    private String role;

    @Embedded
    private MentorEntity mentor;

    @Column(name = "preferred_tone")
    private String preferredTone;

    @Column(name = "coach_avatar")
    private String coachAvatar;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "onboarding_id")
    private List<GoalEntity> goals;

    @Embedded
    private AvailabilityEntity schedule;
    @Embedded
    private PlannerEntity planner;

    // Mapping methods
    public static OnboardingEntity fromRequestDTO(OnboardingRequestDTO dto, Users user) {
        OnboardingEntity entity = new OnboardingEntity();
        entity.setUser(user);
        entity.setRole(dto.getRole());
        entity.setMentor(new MentorEntity(
                dto.getMentor().getArchetype(),
                dto.getMentor().getStyle(),
                dto.getMentor().getName(),
                dto.getMentor().getAvatar()
        ));
        entity.setPreferredTone(dto.getPreferredTone());
        entity.setCoachAvatar(dto.getCoachAvatar());
        entity.setSchedule(new AvailabilityEntity(
                dto.getSchedule().getWorkHours().getStart(),
                dto.getSchedule().getWorkHours().getEnd(),
                dto.getSchedule().getDndHours().getStart(),
                dto.getSchedule().getDndHours().getEnd(),
                dto.getSchedule().getCheckIn().getPreferredTime(),
                dto.getSchedule().getCheckIn().getFrequency(),
                dto.getSchedule().getTimezone()
        ));

        List<GoalEntity> goalEntities = dto.getGoals().stream().map(goal -> new GoalEntity(
                goal.getId(),
                goal.getTitle(),
                goal.getDescription(),
                goal.getCategory(),
                goal.getPriority(),
                goal.getMilestones(),
                goal.getEndDate(),
                goal.getEstimatedEffortHours(),
                goal.getWhyItMatters(),
                new SmartCriteriaEntity(
                        goal.getSmartCriteria().getSpecific().isChecked(),
                        goal.getSmartCriteria().getSpecific().getNote(),
                        goal.getSmartCriteria().getMeasurable().isChecked(),
                        goal.getSmartCriteria().getMeasurable().getNote(),
                        goal.getSmartCriteria().getAchievable().isChecked(),
                        goal.getSmartCriteria().getAchievable().getNote(),
                        goal.getSmartCriteria().getRelevant().isChecked(),
                        goal.getSmartCriteria().getRelevant().getNote(),
                        goal.getSmartCriteria().getTimeBound().isChecked(),
                        goal.getSmartCriteria().getTimeBound().getNote()
                )
        )).collect(Collectors.toList());
        entity.setGoals(goalEntities);

        PlannerEntity plannerEntity = new PlannerEntity();
        plannerEntity.setGoals(goalEntities);
        plannerEntity.setAvailability(new PlannerAvailabilityEntity(
                dto.getSchedule().getWorkHours().getStart(),
                dto.getSchedule().getWorkHours().getEnd(),
                dto.getSchedule().getDndHours().getStart(),
                dto.getSchedule().getDndHours().getEnd(),
                dto.getSchedule().getCheckIn().getPreferredTime(),
                dto.getSchedule().getCheckIn().getFrequency(),
                dto.getSchedule().getTimezone()
        ));
        plannerEntity.setRemindersEnabled(dto.getPlanner().getNotifications().isRemindersEnabled());
        plannerEntity.setCalendarSync(dto.getPlanner().getIntegrations() != null && dto.getPlanner().getIntegrations().isCalendarSync());
        plannerEntity.setTaskManagementSync(dto.getPlanner().getIntegrations() != null && dto.getPlanner().getIntegrations().isTaskManagementSync());
        entity.setPlanner(plannerEntity);

        return entity;
    }

    public OnboardingResponseDTO toResponseDTO() {
        return new OnboardingResponseDTO(id, "Onboarding data saved successfully");
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Users getUser() { return user; }
    public void setUser(Users user) { this.user = user; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public MentorEntity getMentor() { return mentor; }
    public void setMentor(MentorEntity mentor) { this.mentor = mentor; }
    public String getPreferredTone() { return preferredTone; }
    public void setPreferredTone(String preferredTone) { this.preferredTone = preferredTone; }
    public String getCoachAvatar() { return coachAvatar; }
    public void setCoachAvatar(String coachAvatar) { this.coachAvatar = coachAvatar; }
    public AvailabilityEntity getSchedule() { return schedule; }
    public void setSchedule(AvailabilityEntity schedule) { this.schedule = schedule; }
    public List<GoalEntity> getGoals() { return goals; }
    public void setGoals(List<GoalEntity> goals) { this.goals = goals; }
    public PlannerEntity getPlanner() { return planner; }
    public void setPlanner(PlannerEntity planner) { this.planner = planner; }

	public Object getName() {
		return mentor.getName();
	}

}