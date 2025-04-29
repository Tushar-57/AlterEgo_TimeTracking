package com.tushar.demo.timetracker.dto.request;

import java.util.List;

public class OnboardingRequestDTO {
    private String role;
    private Mentor mentor;
    private String preferredTone;
    private String coachAvatar;
    private Availability schedule;
    private List<Goal> goals;
    private Planner planner;

    // Getters and setters
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public Mentor getMentor() { return mentor; }
    public void setMentor(Mentor mentor) { this.mentor = mentor; }
    public String getPreferredTone() { return preferredTone; }
    public void setPreferredTone(String preferredTone) { this.preferredTone = preferredTone; }
    public String getCoachAvatar() { return coachAvatar; }
    public void setCoachAvatar(String coachAvatar) { this.coachAvatar = coachAvatar; }
    public Availability getSchedule() { return schedule; }
    public void setSchedule(Availability schedule) { this.schedule = schedule; }
    public List<Goal> getGoals() { return goals; }
    public void setGoals(List<Goal> goals) { this.goals = goals; }
    public Planner getPlanner() { return planner; }
    public void setPlanner(Planner planner) { this.planner = planner; }

    public static class Mentor {
        private String archetype;
        private String style;
        private String name;
        private String avatar;

        // Getters and setters
        public String getArchetype() { return archetype; }
        public void setArchetype(String archetype) { this.archetype = archetype; }
        public String getStyle() { return style; }
        public void setStyle(String style) { this.style = style; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getAvatar() { return avatar; }
        public void setAvatar(String avatar) { this.avatar = avatar; }
    }

    public static class Availability {
        private WorkHours workHours;
        private DndHours dndHours;
        private CheckIn checkIn;
        private String timezone;

        // Getters and setters
        public WorkHours getWorkHours() { return workHours; }
        public void setWorkHours(WorkHours workHours) { this.workHours = workHours; }
        public DndHours getDndHours() { return dndHours; }
        public void setDndHours(DndHours dndHours) { this.dndHours = dndHours; }
        public CheckIn getCheckIn() { return checkIn; }
        public void setCheckIn(CheckIn checkIn) { this.checkIn = checkIn; }
        public String getTimezone() { return timezone; }
        public void setTimezone(String timezone) { this.timezone = timezone; }
    }

    public static class WorkHours {
        private String start;
        private String end;

        // Getters and setters
        public String getStart() { return start; }
        public void setStart(String start) { this.start = start; }
        public String getEnd() { return end; }
        public void setEnd(String end) { this.end = end; }
    }

    public static class DndHours {
        private String start;
        private String end;

        // Getters and setters
        public String getStart() { return start; }
        public void setStart(String start) { this.start = start; }
        public String getEnd() { return end; }
        public void setEnd(String end) { this.end = end; }
    }

    public static class CheckIn {
        private String preferredTime;
        private String frequency;

        // Getters and setters
        public String getPreferredTime() { return preferredTime; }
        public void setPreferredTime(String preferredTime) { this.preferredTime = preferredTime; }
        public String getFrequency() { return frequency; }
        public void setFrequency(String frequency) { this.frequency = frequency; }
    }

    public static class Goal {
        private String id;
        private String title;
        private String description;
        private String category;
        private String priority;
        private List<String> milestones;
        private String endDate;
        private Integer estimatedEffortHours;
        private String whyItMatters;
        private SmartCriteria smartCriteria;

        // Getters and setters
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
        public SmartCriteria getSmartCriteria() { return smartCriteria; }
        public void setSmartCriteria(SmartCriteria smartCriteria) { this.smartCriteria = smartCriteria; }
    }

    public static class SmartCriteria {
        private SmartCriteriaField specific;
        private SmartCriteriaField measurable;
        private SmartCriteriaField achievable;
        private SmartCriteriaField relevant;
        private SmartCriteriaField timeBound;

        // Getters and setters
        public SmartCriteriaField getSpecific() { return specific; }
        public void setSpecific(SmartCriteriaField specific) { this.specific = specific; }
        public SmartCriteriaField getMeasurable() { return measurable; }
        public void setMeasurable(SmartCriteriaField measurable) { this.measurable = measurable; }
        public SmartCriteriaField getAchievable() { return achievable; }
        public void setAchievable(SmartCriteriaField achievable) { this.achievable = achievable; }
        public SmartCriteriaField getRelevant() { return relevant; }
        public void setRelevant(SmartCriteriaField relevant) { this.relevant = relevant; }
        public SmartCriteriaField getTimeBound() { return timeBound; }
        public void setTimeBound(SmartCriteriaField timeBound) { this.timeBound = timeBound; }
    }

    public static class SmartCriteriaField {
        private boolean checked;
        private String note;

        // Getters and setters
        public boolean isChecked() { return checked; }
        public void setChecked(boolean checked) { this.checked = checked; }
        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }
    }

    public static class Planner {
        private List<Goal> goals;
        private Availability availability;
        private Notifications notifications;
        private Integrations integrations;

        // Getters and setters
        public List<Goal> getGoals() { return goals; }
        public void setGoals(List<Goal> goals) { this.goals = goals; }
        public Availability getAvailability() { return availability; }
        public void setAvailability(Availability availability) { this.availability = availability; }
        public Notifications getNotifications() { return notifications; }
        public void setNotifications(Notifications notifications) { this.notifications = notifications; }
        public Integrations getIntegrations() { return integrations; }
        public void setIntegrations(Integrations integrations) { this.integrations = integrations; }
    }

    public static class Notifications {
        private boolean remindersEnabled;

        // Getters and setters
        public boolean isRemindersEnabled() { return remindersEnabled; }
        public void setRemindersEnabled(boolean remindersEnabled) { this.remindersEnabled = remindersEnabled; }
    }

    public static class Integrations {
        private boolean calendarSync;
        private boolean taskManagementSync;

        // Getters and setters
        public boolean isCalendarSync() { return calendarSync; }
        public void setCalendarSync(boolean calendarSync) { this.calendarSync = calendarSync; }
        public boolean isTaskManagementSync() { return taskManagementSync; }
        public void setTaskManagementSync(boolean taskManagementSync) { this.taskManagementSync = taskManagementSync; }
    }
}
