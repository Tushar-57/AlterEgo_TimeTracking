// ProjectServiceImpl.java
package com.tushar.demo.timetracker.service.impl;

import com.tushar.demo.timetracker.dto.request.ProjectRequest;
import com.tushar.demo.timetracker.exception.ConflictException;
import com.tushar.demo.timetracker.exception.ResourceNotFoundException;
import com.tushar.demo.timetracker.model.Project;
import com.tushar.demo.timetracker.model.Users;
import com.tushar.demo.timetracker.repository.ProjectRepository;
import com.tushar.demo.timetracker.service.ProjectService;

import java.util.List;

import org.springframework.stereotype.Service;

@Service
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;

    public ProjectServiceImpl(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }
    
    @Override
    public Project createDefaultProject(Users user) {
        if (projectRepository.findByNameAndUser("No Project", user).isPresent()) {
            throw new ConflictException("Default project already exists");
        }

        Project project = new Project();
        project.setName("No Project");
        project.setColor("#cccccc");
        project.setClient("Personal");
        project.setUser(user);
        project.setDefault(true);
        
        return projectRepository.save(project);
    }

    @Override
    public List<Project> getUserProjects(Users user) {
        return projectRepository.findByUser(user);
    }

    @Override
    public Project createProject(ProjectRequest request, Users user) {
        // Check for existing project name
    	if ("No Project".equalsIgnoreCase(request.name())) {
            throw new ConflictException("Project name 'No Project' is reserved");
        }
        if (projectRepository.findByNameAndUser(request.name(), user).isPresent()) {
            throw new ConflictException("Project name already exists");
        }

        Project project = new Project();
        project.setName(request.name());
        project.setColor(request.color());
        project.setClient(request.client());
        project.setUser(user);
        
        return projectRepository.save(project);
    }

    @Override
    public Project updateProject(Long id, ProjectRequest request, Users user) {
        Project project = projectRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        // Check if new name conflicts with other projects
        if ("No Project".equalsIgnoreCase(request.name())) {
            throw new ConflictException("Cannot rename project to 'No Project'");
        }
        if (!project.getName().equals(request.name()) && 
            projectRepository.findByNameAndUser(request.name(), user).isPresent()) {
            throw new ConflictException("Project name already exists");
        }

        project.setName(request.name());
        project.setColor(request.color());
        project.setClient(request.client());
        
        return projectRepository.save(project);
    }

    @Override
    public void deleteProject(Long id, Users user) {
        Project project = projectRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        if (project.isDefault()) {
            throw new ConflictException("Cannot delete default project");
        }

        projectRepository.delete(project);
    }
    

}