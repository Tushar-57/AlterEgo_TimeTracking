package com.tushar.demo.timetracker.service.impl;

import com.tushar.demo.timetracker.dto.request.StartTimeEntryRequest;
import com.tushar.demo.timetracker.exception.ConflictException;
import com.tushar.demo.timetracker.exception.NoActiveTimerException;
import com.tushar.demo.timetracker.exception.ResourceNotFoundException;
import com.tushar.demo.timetracker.model.Project;
import com.tushar.demo.timetracker.model.Tags;
import com.tushar.demo.timetracker.model.TimeEntry;
import com.tushar.demo.timetracker.model.Users;
import com.tushar.demo.timetracker.repository.ProjectRepository;
import com.tushar.demo.timetracker.repository.TagsRepository;
import com.tushar.demo.timetracker.repository.TimeEntryRepository;
import com.tushar.demo.timetracker.service.TimeEntryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class TimeEntryServiceImpl implements TimeEntryService {
    private static final Logger logger = LoggerFactory.getLogger(TimeEntryServiceImpl.class);

    private final TimeEntryRepository timeEntryRepository;
    private final ProjectRepository projectRepository;
    private final TagsRepository tagRepository;

    public TimeEntryServiceImpl(TimeEntryRepository timeEntryRepository, 
                                ProjectRepository projectRepository, 
                                TagsRepository tagRepository) {
        this.timeEntryRepository = timeEntryRepository;
        this.projectRepository = projectRepository;
        this.tagRepository = tagRepository;
    }

    @Override
    public TimeEntry startTimeEntry(StartTimeEntryRequest request, Users user) {
        logger.info("Starting time entry for user: {}, projectId: {}, description: {}", 
                    user.getEmail(), request.getProjectId(), request.getDescription());

        // Check if user already has an active timer
        Optional<TimeEntry> activeTimer = timeEntryRepository.findByUserIdAndEndTimeIsNull(user.getId());
        if (activeTimer.isPresent()) {
            logger.warn("User {} already has an active timer with ID: {}", user.getEmail(), activeTimer.get().getId());
            throw new ConflictException("Cannot start a new timer. An active timer already exists.");
        }

        // Validate project (allow null)
        Project project = null;
        if (request.getProjectId() != null) {
            project = projectRepository.findById(request.getProjectId())
                    .orElseThrow(() -> {
                        logger.error("Project with ID {} not found for user: {}", request.getProjectId(), user.getEmail());
                        return new ResourceNotFoundException("Project not found with ID: " + request.getProjectId());
                    });
        }

        // Validate tags
        List<Long> tagIds = new ArrayList<>();
        if (request.getTagIds() != null && !request.getTagIds().isEmpty()) {
            List<Tags> tags = tagRepository.findAllById(request.getTagIds());
            if (tags.size() != request.getTagIds().size()) {
                logger.error("Some tags not found for IDs: {} for user: {}", request.getTagIds(), user.getEmail());
                throw new ResourceNotFoundException("One or more tags not found");
            }
            tagIds = tags.stream().map(Tags::getId).toList();
        }

        // Create new time entry
        TimeEntry timeEntry = new TimeEntry();
        timeEntry.setUser(user);
        timeEntry.setProject(project);
        timeEntry.setTagIds(tagIds);
        timeEntry.setDescription(request.getDescription());
        timeEntry.setStartTime(LocalDateTime.now());
        timeEntry.setIsActive(true);
        timeEntry.setEndTime(null);

        TimeEntry savedEntry = timeEntryRepository.save(timeEntry);
        logger.info("Successfully started time entry with ID: {} for user: {}", savedEntry.getId(), user.getEmail());
        return savedEntry;
    }

    @Override
    public TimeEntry stopTimer(Long id, Users user, LocalDateTime manualEnd) {
        logger.info("Stopping time entry with ID: {} for user: {}", id, user.getEmail());

        TimeEntry timeEntry = timeEntryRepository.findById(id)
                .orElseThrow(() -> {
                    logger.error("Time entry with ID {} not found for user: {}", id, user.getEmail());
                    return new ResourceNotFoundException("Time entry not found with ID: " + id);
                });

        if (!timeEntry.getUser().getId().equals(user.getId())) {
            logger.error("User {} attempted to stop time entry {} that they do not own", user.getEmail(), id);
            throw new ResourceNotFoundException("Time entry not found with ID: " + id);
        }

        if (timeEntry.getEndTime() != null) {
            logger.warn("Time entry {} for user {} is already stopped", id, user.getEmail());
            throw new ConflictException("Time entry is already stopped");
        }

        LocalDateTime endTime = (manualEnd != null && manualEnd.isAfter(timeEntry.getStartTime())) 
                               ? manualEnd 
                               : LocalDateTime.now();
        if (endTime.isBefore(timeEntry.getStartTime())) {
            logger.error("End time {} is before start time {} for time entry {}", 
                         endTime, timeEntry.getStartTime(), id);
            throw new IllegalArgumentException("End time cannot be before start time");
        }
        timeEntry.setEndTime(endTime);
        
        // Calculate duration
        timeEntry.setDuration(Duration.between(timeEntry.getStartTime(), timeEntry.getEndTime()).getSeconds());
        timeEntry.setIsActive(false);
        TimeEntry updatedEntry = timeEntryRepository.save(timeEntry);
        logger.info("Successfully stopped time entry with ID: {} for user: {}", id, user.getEmail());
        return updatedEntry;
    }

    @Override
    public List<TimeEntry> getTimeEntriesBetweenDates(Users user, LocalDateTime start, LocalDateTime end) {
        logger.info("Fetching time entries for user: {} from {} to {}", user.getEmail(), start, end);

        if (start.isAfter(end)) {
            logger.error("Start time {} is after end time {} for user: {}", start, end, user.getEmail());
            throw new IllegalArgumentException("Start time cannot be after end time");
        }

        List<TimeEntry> entries = timeEntryRepository.findByUserIdAndStartTimeBetween(user.getId(), start, end);
        logger.info("Found {} time entries for user: {} from {} to {}", 
                    entries.size(), user.getEmail(), start, end);
        return entries;
    }

    @Override
    public TimeEntry getActiveTimer(Users user) {
        logger.info("Fetching active timer for user: {}", user.getEmail());

        Optional<TimeEntry> activeTimer = timeEntryRepository.findByUserIdAndEndTimeIsNull(user.getId());
        if (activeTimer.isEmpty()) {
            logger.info("No active timer found for user: {}", user.getEmail());
            throw new NoActiveTimerException();
        }

        logger.info("Found active timer with ID: {} for user: {}", activeTimer.get().getId(), user.getEmail());
        return activeTimer.get();
    }

    @Override
    public List<TimeEntry> getRecentTimeEntries(Users user, int limit) {
        logger.info("Fetching up to {} recent time entries for user: {}", limit, user.getEmail());
        List<TimeEntry> entries = timeEntryRepository.findTopByUserIdOrderByStartTimeDesc(user.getId(), limit);
        logger.info("Found {} recent time entries for user: {}", entries.size(), user.getEmail());
        return entries;
    }

    @Override
    public TimeEntry updateTimerPosition(Long timerId, Users user, String positionTop, String positionLeft) {
        TimeEntry timeEntry = timeEntryRepository.findByIdAndUser(timerId, user)
                .orElseThrow(() -> new IllegalArgumentException("Timer not found or does not belong to user"));
        timeEntry.setPositionTop(positionTop);
        timeEntry.setPositionLeft(positionLeft);
        logger.info("Updating position for timer: {} to top: {}, left: {}", timerId, positionTop, positionLeft);
        return timeEntryRepository.save(timeEntry);
    }
}