package com.tushar.demo.timetracker.model;

import java.util.Set;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;

@Entity
public class Workspace {
	    @Id @GeneratedValue
	    private Long id;
	    private String name;
	    private boolean premium;
	    
	    @ManyToMany
	    private Set<Users> members;
	}
