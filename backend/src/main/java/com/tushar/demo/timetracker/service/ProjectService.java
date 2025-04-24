// ProjectService.java
package com.tushar.demo.timetracker.service;

import com.tushar.demo.timetracker.dto.request.ProjectRequest;
import com.tushar.demo.timetracker.model.Project;
import com.tushar.demo.timetracker.model.Users;

import java.util.List;

public interface ProjectService {
    List<Project> getUserProjects(Users user);
    Project createProject(ProjectRequest request, Users user);
    Project updateProject(Long id, ProjectRequest request, Users user);
    void deleteProject(Long id, Users user);
	Project createDefaultProject(Users savedUser);
}