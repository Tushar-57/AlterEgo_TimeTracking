package com.tushar.demo.timetracker.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class AvailabilityEntity {
    @Column(name = "work_hours_start")
    private String workHoursStart;

    @Column(name = "work_hours_end")
    private String workHoursEnd;

    @Column(name = "dnd_hours_start")
    private String dndHoursStart;

    @Column(name = "dnd_hours_end")
    private String dndHoursEnd;

    @Column(name = "check_in_preferred_time")
    private String checkInPreferredTime;

    @Column(name = "check_in_frequency")
    private String checkInFrequency;

    @Column
    private String timezone;

    public AvailabilityEntity() {}
    public AvailabilityEntity(String workHoursStart, String workHoursEnd, String dndHoursStart, String dndHoursEnd,
                             String checkInPreferredTime, String checkInFrequency, String timezone) {
        this.workHoursStart = workHoursStart;
        this.workHoursEnd = workHoursEnd;
        this.dndHoursStart = dndHoursStart;
        this.dndHoursEnd = dndHoursEnd;
        this.checkInPreferredTime = checkInPreferredTime;
        this.checkInFrequency = checkInFrequency;
        this.timezone = timezone;
    }

    // Getters and setters
    public String getWorkHoursStart() { return workHoursStart; }
    public void setWorkHoursStart(String workHoursStart) { this.workHoursStart = workHoursStart; }
    public String getWorkHoursEnd() { return workHoursEnd; }
    public void setWorkHoursEnd(String workHoursEnd) { this.workHoursEnd = workHoursEnd; }
    public String getDndHoursStart() { return dndHoursStart; }
    public void setDndHoursStart(String dndHoursStart) { this.dndHoursStart = dndHoursStart; }
    public String getDndHoursEnd() { return dndHoursEnd; }
    public void setDndHoursEnd(String dndHoursEnd) { this.dndHoursEnd = dndHoursEnd; }
    public String getCheckInPreferredTime() { return checkInPreferredTime; }
    public void setCheckInPreferredTime(String checkInPreferredTime) { this.checkInPreferredTime = checkInPreferredTime; }
    public String getCheckInFrequency() { return checkInFrequency; }
    public void setCheckInFrequency(String checkInFrequency) { this.checkInFrequency = checkInFrequency; }
    public String getTimezone() { return timezone; }
    public void setTimezone(String timezone) { this.timezone = timezone; }
}