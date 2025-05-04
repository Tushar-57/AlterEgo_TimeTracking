package com.tushar.demo.timetracker.assistant.domain.agent;

import com.tushar.demo.timetracker.dto.request.ProjectRequest;
import com.tushar.demo.timetracker.model.Project;
import com.tushar.demo.timetracker.model.Users;
import com.tushar.demo.timetracker.repository.UserRepository;
import com.tushar.demo.timetracker.service.ProjectService;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.service.SystemMessage;
import org.springframework.stereotype.Component;

interface ProjectExtractor {
    @SystemMessage("""
        Your role is to extract project details from the user's command.
        Extract:
        - name: The project name (e.g., "Sprint 5").
        - description: The project description, if mentioned (e.g., "New feature development").
        Return a Project object.
        If description is not mentioned, set it to an empty string.
        """)
    Project extractProject(String command);
}

@Component
public class ProjectAgent {
    private final ProjectExtractor extractor;
    private final ProjectService projectService;
    private final UserRepository userRepository;

    public ProjectAgent(ChatLanguageModel chatLanguageModel, ProjectService projectService, UserRepository userRepository) {
        this.extractor = AiServices.builder(ProjectExtractor.class)
                .chatLanguageModel(chatLanguageModel)
                .build();
        this.projectService = projectService;
        this.userRepository = userRepository;
    }

    public Project processProjectCommand(String userId, String command) {
        Project project = extractor.extractProject(command);
        Users user = userRepository.findByEmail(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        ProjectRequest projectRequest = new ProjectRequest(project.getName(), project.getColor(), project.getClient());
        return projectService.createProject(projectRequest, user);
    }
}