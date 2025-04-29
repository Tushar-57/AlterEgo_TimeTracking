package com.tushar.demo.timetracker.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class MentorEntity {
    @Column(nullable = false)
    private String archetype;

    @Column(nullable = false)
    private String style;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String avatar;

    public MentorEntity() {}
    public MentorEntity(String archetype, String style, String name, String avatar) {
        this.archetype = archetype;
        this.style = style;
        this.name = name;
        this.avatar = avatar;
    }

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