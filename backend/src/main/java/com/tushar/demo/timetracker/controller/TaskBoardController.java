package com.tushar.demo.timetracker.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tushar.demo.timetracker.exception.ResourceNotFoundException;
import com.tushar.demo.timetracker.integration.AgenticSyncOutboxService;
import com.tushar.demo.timetracker.model.TaskBoardState;
import com.tushar.demo.timetracker.model.Users;
import com.tushar.demo.timetracker.repository.TaskBoardStateRepository;
import com.tushar.demo.timetracker.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/task-board")
public class TaskBoardController {
    private static final Logger logger = LoggerFactory.getLogger(TaskBoardController.class);

    private static final int MAX_TASK_ITEMS = 2000;

    private final UserRepository userRepository;
    private final TaskBoardStateRepository taskBoardStateRepository;
    private final ObjectMapper objectMapper;
    private final AgenticSyncOutboxService agenticSyncOutboxService;

    public TaskBoardController(
            UserRepository userRepository,
            TaskBoardStateRepository taskBoardStateRepository,
            ObjectMapper objectMapper,
            AgenticSyncOutboxService agenticSyncOutboxService) {
        this.userRepository = userRepository;
        this.taskBoardStateRepository = taskBoardStateRepository;
        this.objectMapper = objectMapper;
        this.agenticSyncOutboxService = agenticSyncOutboxService;
    }

    @GetMapping("/state")
    public ResponseEntity<?> getTaskBoardState(Authentication authentication) {
        try {
            Users user = resolveUser(authentication);
            TaskBoardState state = taskBoardStateRepository.findTopByUserOrderByUpdatedAtDesc(user).orElse(null);

            if (state == null || state.getTasksJson() == null || state.getTasksJson().isBlank()) {
                return ResponseEntity.ok(Map.of("tasks", List.of()));
            }

            List<Object> tasks = objectMapper.readValue(state.getTasksJson(), new TypeReference<>() {});
            return ResponseEntity.ok(Map.of(
                    "tasks", tasks,
                    "updatedAt", state.getUpdatedAt() != null ? state.getUpdatedAt().toString() : null
            ));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Not found", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Processing failed", "message", e.getMessage()));
        }
    }

    @PutMapping("/state")
    public ResponseEntity<?> updateTaskBoardState(
            @RequestBody(required = false) Map<String, Object> payload,
            Authentication authentication) {
        try {
            Users user = resolveUser(authentication);
            List<Object> tasks = payload != null && payload.get("tasks") instanceof List<?> list
                    ? List.copyOf(list)
                    : List.of();

            if (tasks.size() > MAX_TASK_ITEMS) {
                return ResponseEntity.badRequest()
                        .body(Map.of(
                                "error", "Validation failed",
                                "message", "Task payload exceeds supported size"
                        ));
            }

            String tasksJson = objectMapper.writeValueAsString(tasks);

            TaskBoardState state = taskBoardStateRepository.findTopByUserOrderByUpdatedAtDesc(user)
                    .orElseGet(TaskBoardState::new);
            state.setUser(user);
            state.setTasksJson(tasksJson);

            TaskBoardState saved = taskBoardStateRepository.save(state);

            // Bug 2: enqueue task board snapshot to Agentic_Lyf
            try {
                AgenticSyncOutboxService.EnqueueResult queueResult =
                        agenticSyncOutboxService.enqueueTaskBoardSync(tasksJson, user, "update_task_board_state");
                if (!queueResult.accepted()) {
                    logger.debug("Task board sync not queued for user {}: {}", user.getEmail(), queueResult.message());
                }
            } catch (Exception syncError) {
                logger.warn("Task board Agentic enqueue failed for user {}: {}", user.getEmail(), syncError.getMessage());
            }

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "tasksCount", tasks.size(),
                    "updatedAt", saved.getUpdatedAt() != null ? saved.getUpdatedAt().toString() : null
            ));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Not found", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Processing failed", "message", e.getMessage()));
        }
    }

    private Users resolveUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
