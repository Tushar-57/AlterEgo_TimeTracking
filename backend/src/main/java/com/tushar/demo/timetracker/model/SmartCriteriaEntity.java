package com.tushar.demo.timetracker.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class SmartCriteriaEntity {
    @Column(name = "specific_checked")
    private boolean specificChecked;

    @Column(name = "specific_note")
    private String specificNote;

    @Column(name = "measurable_checked")
    private boolean measurableChecked;

    @Column(name = "measurable_note")
    private String measurableNote;

    @Column(name = "achievable_checked")
    private boolean achievableChecked;

    @Column(name = "achievable_note")
    private String achievableNote;

    @Column(name = "relevant_checked")
    private boolean relevantChecked;

    @Column(name = "relevant_note")
    private String relevantNote;

    @Column(name = "time_bound_checked")
    private boolean timeBoundChecked;

    @Column(name = "time_bound_note")
    private String timeBoundNote;

    public SmartCriteriaEntity() {}
    public SmartCriteriaEntity(boolean specificChecked, String specificNote, boolean measurableChecked, String measurableNote,
                              boolean achievableChecked, String achievableNote, boolean relevantChecked, String relevantNote,
                              boolean timeBoundChecked, String timeBoundNote) {
        this.specificChecked = specificChecked;
        this.specificNote = specificNote;
        this.measurableChecked = measurableChecked;
        this.measurableNote = measurableNote;
        this.achievableChecked = achievableChecked;
        this.achievableNote = achievableNote;
        this.relevantChecked = relevantChecked;
        this.relevantNote = relevantNote;
        this.timeBoundChecked = timeBoundChecked;
        this.timeBoundNote = timeBoundNote;
    }

    // Getters and setters
    public boolean isSpecificChecked() { return specificChecked; }
    public void setSpecificChecked(boolean specificChecked) { this.specificChecked = specificChecked; }
    public String getSpecificNote() { return specificNote; }
    public void setSpecificNote(String specificNote) { this.specificNote = specificNote; }
    public boolean isMeasurableChecked() { return measurableChecked; }
    public void setMeasurableChecked(boolean measurableChecked) { this.measurableChecked = measurableChecked; }
    public String getMeasurableNote() { return measurableNote; }
    public void setMeasurableNote(String measurableNote) { this.measurableNote = measurableNote; }
    public boolean isAchievableChecked() { return achievableChecked; }
    public void setAchievableChecked(boolean achievableChecked) { this.achievableChecked = achievableChecked; }
    public String getAchievableNote() { return achievableNote; }
    public void setAchievableNote(String achievableNote) { this.achievableNote = achievableNote; }
    public boolean isRelevantChecked() { return relevantChecked; }
    public void setRelevantChecked(boolean relevantChecked) { this.relevantChecked = relevantChecked; }
    public String getRelevantNote() { return relevantNote; }
    public void setRelevantNote(String relevantNote) { this.relevantNote = relevantNote; }
    public boolean isTimeBoundChecked() { return timeBoundChecked; }
    public void setTimeBoundChecked(boolean timeBoundChecked) { this.timeBoundChecked = timeBoundChecked; }
    public String getTimeBoundNote() { return timeBoundNote; }
    public void setTimeBoundNote(String timeBoundNote) { this.timeBoundNote = timeBoundNote; }
}