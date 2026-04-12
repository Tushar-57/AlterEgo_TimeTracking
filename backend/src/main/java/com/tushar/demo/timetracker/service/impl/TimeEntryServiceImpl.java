package com.tushar.demo.timetracker.service.impl;

import com.tushar.demo.timetracker.dto.request.StartTimeEntryRequest;
import com.tushar.demo.timetracker.dto.request.addTimeEntryRequest;
import com.tushar.demo.timetracker.exception.ConflictException;
import com.tushar.demo.timetracker.exception.NoActiveTimerException;
import com.tushar.demo.timetracker.exception.ResourceNotFoundException;
import com.tushar.demo.timetracker.model.Project;
import com.tushar.demo.timetracker.model.Tags;
import com.tushar.demo.timetracker.model.TimeEntry;
import com.tushar.demo.timetracker.model.TimeEntryDetail;
import com.tushar.demo.timetracker.model.Users;
import com.tushar.demo.timetracker.repository.ProjectRepository;
import com.tushar.demo.timetracker.repository.TagsRepository;
import com.tushar.demo.timetracker.repository.TimeEntryRepository;
import com.tushar.demo.timetracker.repository.TimeEntryDetailRepository;
import com.tushar.demo.timetracker.service.TimeEntryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class TimeEntryServiceImpl implements TimeEntryService {
    private static final Logger logger = LoggerFactory.getLogger(TimeEntryServiceImpl.class);

    private final TimeEntryRepository timeEntryRepository;
    private final ProjectRepository projectRepository;
    private final TagsRepository tagRepository;
    private final TimeEntryDetailRepository timeEntryDetailRepository;

    public TimeEntryServiceImpl(TimeEntryRepository timeEntryRepository, 
                                ProjectRepository projectRepository, 
                                TagsRepository tagRepository,
                                TimeEntryDetailRepository timeEntryDetailRepository) {
        this.timeEntryRepository = timeEntryRepository;
        this.projectRepository = projectRepository;
        this.tagRepository = tagRepository;
        this.timeEntryDetailRepository = timeEntryDetailRepository;
    }

    @Override
    @Transactional
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
            tagIds = new ArrayList<>(tags.stream().map(Tags::getId).toList());
        }

        // Create new time entry
        TimeEntry timeEntry = new TimeEntry();
        timeEntry.setUser(user);
        timeEntry.setProject(project);
        timeEntry.setTagIds(tagIds);
        timeEntry.setDescription(request.getDescription());
        timeEntry.setStartTime(request.getStartTime());
        timeEntry.setBillable(request.isBillable());
        timeEntry.setIsActive(true);
        timeEntry.setEndTime(null);

        TimeEntry savedEntry = timeEntryRepository.save(timeEntry);
        logger.info("Successfully started time entry with ID: {} for user: {}", savedEntry.getId(), user.getEmail());
        return enrichWithDetail(savedEntry);
    }

    @Override
    @Transactional
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
            logger.info("Time entry {} for user {} is already stopped; returning existing entry", id, user.getEmail());
            if (timeEntry.getIsActive()) {
                timeEntry.setIsActive(false);
                return timeEntryRepository.save(timeEntry);
            }
            return timeEntry;
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
        timeEntry.setPositionTop(timeEntry.getPositionTop());
        timeEntry.setPositionLeft(timeEntry.getPositionLeft());
        timeEntry.setIsActive(false);
        TimeEntry updatedEntry = timeEntryRepository.save(timeEntry);
        logger.info("Successfully stopped time entry with ID: {} for user: {}", id, user.getEmail());
        return enrichWithDetail(updatedEntry);
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
        return enrichWithDetails(entries);
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
        return enrichWithDetail(activeTimer.get());
    }

    @Override
    public List<TimeEntry> getRecentTimeEntries(Users user, int limit) {
        logger.info("Fetching up to {} recent time entries for user: {}", limit, user.getEmail());
        List<TimeEntry> entries = timeEntryRepository.findTopByUserIdOrderByStartTimeDesc(user.getId(), limit);
        logger.info("Found {} recent time entries for user: {}", entries.size(), user.getEmail());
        return enrichWithDetails(entries);
    }

    @Override
    @Transactional
    public TimeEntry updateTimerPosition(Long timerId, Users user, String positionTop, String positionLeft) {
        TimeEntry timeEntry = timeEntryRepository.findByIdAndUser(timerId, user)
                .orElseThrow(() -> new IllegalArgumentException("Timer not found or does not belong to user"));
        timeEntry.setPositionTop(positionTop);
        timeEntry.setPositionLeft(positionLeft);
        logger.info("Updating position for timer: {} to top: {}, left: {}", timerId, positionTop, positionLeft);
        return enrichWithDetail(timeEntryRepository.save(timeEntry));
    }
    
    @Override
    @Transactional
    public TimeEntry addTimeEntry(addTimeEntryRequest request, Users user) {
        logger.info("Adding time entry for user: {}, projectId: {}, description: {}", 
                    user.getEmail(), request.getProjectId(), request.getDescription());

        if (!request.getEndTime().isAfter(request.getStartTime())) {
            logger.warn("Invalid manual time entry range for user {}: startTime={}, endTime={}",
                    user.getEmail(), request.getStartTime(), request.getEndTime());
            throw new IllegalArgumentException("End time must be after start time");
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
            tagIds = new ArrayList<>(tags.stream().map(Tags::getId).toList());
        }

        // Create new time entry
        TimeEntry timeEntry = new TimeEntry();
        timeEntry.setUser(user);
        timeEntry.setProject(project);
        timeEntry.setTagIds(tagIds);
        timeEntry.setDescription(request.getDescription());
        timeEntry.setStartTime(request.getStartTime());
        timeEntry.setEndTime(request.getEndTime());
        timeEntry.setBillable(request.isBillable());
        timeEntry.setPositionTop(request.getPositionTop());
        timeEntry.setPositionLeft(request.getPositionLeft());
        timeEntry.setIsActive(false);

        TimeEntry savedEntry = timeEntryRepository.save(timeEntry);
        upsertEntryDetail(savedEntry, request);
        logger.info("Successfully added time entry with ID: {} for user: {}", savedEntry.getId(), user.getEmail());
        return enrichWithDetail(savedEntry);
    }

    @Override
    @Transactional
    public TimeEntry updateTimeEntry(Long timerId, addTimeEntryRequest request, Users user) {
        logger.info("Updating time entry {} for user: {}", timerId, user.getEmail());

        if (!request.getEndTime().isAfter(request.getStartTime())) {
            logger.warn("Invalid update range for user {}: startTime={}, endTime={}",
                    user.getEmail(), request.getStartTime(), request.getEndTime());
            throw new IllegalArgumentException("End time must be after start time");
        }

        TimeEntry timeEntry = timeEntryRepository.findByIdAndUser(timerId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Time entry not found with ID: " + timerId));

        Project project = null;
        if (request.getProjectId() != null) {
            project = projectRepository.findById(request.getProjectId())
                    .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + request.getProjectId()));
        }

        List<Long> tagIds = new ArrayList<>();
        if (request.getTagIds() != null && !request.getTagIds().isEmpty()) {
            List<Tags> tags = tagRepository.findAllById(request.getTagIds());
            if (tags.size() != request.getTagIds().size()) {
                throw new ResourceNotFoundException("One or more tags not found");
            }
            tagIds = new ArrayList<>(tags.stream().map(Tags::getId).toList());
        }

        timeEntry.setDescription(request.getDescription());
        timeEntry.setStartTime(request.getStartTime());
        timeEntry.setEndTime(request.getEndTime());
        timeEntry.setProject(project);
        timeEntry.setTagIds(tagIds);
        timeEntry.setBillable(request.isBillable());
        timeEntry.setPositionTop(request.getPositionTop());
        timeEntry.setPositionLeft(request.getPositionLeft());
        timeEntry.setIsActive(false);

        TimeEntry updatedEntry = timeEntryRepository.save(timeEntry);
        upsertEntryDetail(updatedEntry, request);
        logger.info("Successfully updated time entry {} for user: {}", timerId, user.getEmail());
        return enrichWithDetail(updatedEntry);
    }

    @Override
    @Transactional
    public void deleteTimeEntry(Long timerId, Users user) {
        logger.info("Deleting time entry {} for user: {}", timerId, user.getEmail());

        TimeEntry timeEntry = timeEntryRepository.findByIdAndUser(timerId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Time entry not found with ID: " + timerId));

        timeEntryDetailRepository.findByTimeEntryId(timerId)
                .ifPresent(timeEntryDetailRepository::delete);

        timeEntryRepository.delete(timeEntry);
        logger.info("Successfully deleted time entry {} for user: {}", timerId, user.getEmail());
    }

    @Override
    @Transactional
    public TimeEntry continueTimeEntry(Long timerId, Users user) {
        logger.info("Continuing time entry {} for user: {}", timerId, user.getEmail());

        Optional<TimeEntry> activeTimer = timeEntryRepository.findByUserIdAndEndTimeIsNull(user.getId());
        if (activeTimer.isPresent()) {
            logger.warn("User {} already has an active timer with ID: {}", user.getEmail(), activeTimer.get().getId());
            throw new ConflictException("Cannot continue timer. An active timer already exists.");
        }

        TimeEntry sourceEntry = timeEntryRepository.findByIdAndUser(timerId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Time entry not found with ID: " + timerId));

        TimeEntry continuedEntry = new TimeEntry();
        continuedEntry.setUser(user);
        continuedEntry.setDescription(sourceEntry.getDescription());
        continuedEntry.setProject(sourceEntry.getProject());
        continuedEntry.setTagIds(sourceEntry.getTagIds());
        continuedEntry.setBillable(sourceEntry.isBillable());
        continuedEntry.setClient(sourceEntry.getClient());
        continuedEntry.setPositionTop(sourceEntry.getPositionTop());
        continuedEntry.setPositionLeft(sourceEntry.getPositionLeft());
        continuedEntry.setStartTime(LocalDateTime.now());
        continuedEntry.setEndTime(null);
        continuedEntry.setDuration(0L);
        continuedEntry.setIsActive(true);

        TimeEntry savedEntry = timeEntryRepository.save(continuedEntry);

        timeEntryDetailRepository.findByTimeEntryId(sourceEntry.getId()).ifPresent(sourceDetail -> {
            TimeEntryDetail copiedDetail = new TimeEntryDetail();
            copiedDetail.setTimeEntry(savedEntry);
            copiedDetail.setLinkedGoal(sourceDetail.getLinkedGoal());
            copiedDetail.setFocusScore(sourceDetail.getFocusScore());
            copiedDetail.setEnergyScore(sourceDetail.getEnergyScore());
            copiedDetail.setBlockers(sourceDetail.getBlockers());
            copiedDetail.setContextNotes(sourceDetail.getContextNotes());
            copiedDetail.setAiDetail(sourceDetail.getAiDetail());
            timeEntryDetailRepository.save(copiedDetail);
        });

        logger.info("Successfully continued time entry {} as new timer {} for user {}", timerId, savedEntry.getId(), user.getEmail());
        return enrichWithDetail(savedEntry);
    }

    private List<TimeEntry> enrichWithDetails(List<TimeEntry> entries) {
        if (entries == null || entries.isEmpty()) {
            return entries;
        }

        List<Long> entryIds = entries.stream()
                .map(TimeEntry::getId)
                .filter(id -> id != null)
                .toList();

        if (entryIds.isEmpty()) {
            return entries;
        }

        List<TimeEntryDetail> details = timeEntryDetailRepository.findByTimeEntryIdIn(entryIds);
        Map<Long, TimeEntryDetail> detailByEntryId = new HashMap<>();

        for (TimeEntryDetail detail : details) {
            if (detail.getTimeEntry() != null && detail.getTimeEntry().getId() != null) {
                detailByEntryId.put(detail.getTimeEntry().getId(), detail);
            }
        }

        for (TimeEntry entry : entries) {
            if (entry != null && entry.getId() != null) {
                applyDetailToEntry(entry, detailByEntryId.get(entry.getId()));
            }
        }

        return entries;
    }

    private TimeEntry enrichWithDetail(TimeEntry entry) {
        if (entry == null || entry.getId() == null) {
            return entry;
        }

        TimeEntryDetail detail = timeEntryDetailRepository.findByTimeEntryId(entry.getId()).orElse(null);
        applyDetailToEntry(entry, detail);
        return entry;
    }

    private void applyDetailToEntry(TimeEntry entry, TimeEntryDetail detail) {
        if (entry == null) {
            return;
        }

        if (detail == null) {
            entry.setLinkedGoal(null);
            entry.setFocusScore(null);
            entry.setEnergyScore(null);
            entry.setBlockers(null);
            entry.setContextNotes(null);
            entry.setAiDetail(null);
            return;
        }

        entry.setLinkedGoal(detail.getLinkedGoal());
        entry.setFocusScore(detail.getFocusScore());
        entry.setEnergyScore(detail.getEnergyScore());
        entry.setBlockers(detail.getBlockers());
        entry.setContextNotes(detail.getContextNotes());
        entry.setAiDetail(detail.getAiDetail());
    }

    private void upsertEntryDetail(TimeEntry entry, addTimeEntryRequest request) {
        if (entry == null || entry.getId() == null || !hasDetailPayload(request)) {
            return;
        }

        TimeEntryDetail detail = timeEntryDetailRepository
                .findByTimeEntryId(entry.getId())
                .orElseGet(TimeEntryDetail::new);

        detail.setTimeEntry(entry);
        detail.setLinkedGoal(normalizeText(request.getLinkedGoal()));
        detail.setFocusScore(request.getFocusScore());
        detail.setEnergyScore(request.getEnergyScore());
        detail.setBlockers(normalizeText(request.getBlockers()));
        detail.setContextNotes(normalizeText(request.getContextNotes()));
        detail.setAiDetail(normalizeText(request.getAiDetail()));

        timeEntryDetailRepository.save(detail);
    }

    private boolean hasDetailPayload(addTimeEntryRequest request) {
        return request != null
                && (request.getFocusScore() != null
                || request.getEnergyScore() != null
                || normalizeText(request.getLinkedGoal()) != null
                || normalizeText(request.getBlockers()) != null
                || normalizeText(request.getContextNotes()) != null
                || normalizeText(request.getAiDetail()) != null);
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}