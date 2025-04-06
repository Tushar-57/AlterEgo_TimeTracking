// TimeEntryService.java
package com.tushar.demo.timetracker.service;

import com.tushar.demo.timetracker.dto.addTimeEntryRequest;
import com.tushar.demo.timetracker.exception.NoActiveTimerException;
import com.tushar.demo.timetracker.exception.ResourceNotFoundException;
import com.tushar.demo.timetracker.model.TimeEntry;
import com.tushar.demo.timetracker.model.Users;
import com.tushar.demo.timetracker.repository.TimeEntryRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class TimeEntryService {

    private final TimeEntryRepository timeEntryRepository;

    public TimeEntryService(TimeEntryRepository timeEntryRepository) {
        this.timeEntryRepository = timeEntryRepository;
    }

    public TimeEntry createTimeEntry(addTimeEntryRequest request, Users user) throws NoActiveTimerException {
    	if (!user.isEnabled()) {
            throw new SecurityException("User account disabled");
        }
    	if (request.startTime() == null && hasActiveTimer(user)) {
            throw new NoActiveTimerException();
        }
        TimeEntry entry = new TimeEntry();
        entry.setTaskDescription(request.taskDescription());
        entry.setStartTime(request.startTime());
        entry.setEndTime(request.endTime());
        entry.setCategory(request.category());
        entry.setUser(user);
        return timeEntryRepository.save(entry);
    }

    public List<TimeEntry> getTimeEntriesBetweenDates(Users user, LocalDateTime start, LocalDateTime end) {
        return timeEntryRepository.findByUserAndStartTimeBetween(user, start, end);
    }
    public TimeEntry getActiveTimer(Users user) {
        return timeEntryRepository.findByUserAndEndTimeIsNull(user)
            .orElseThrow(NoActiveTimerException::new);
    }

    public TimeEntry stopTimer(Long id, Users user, LocalDateTime manualEnd) {
        return timeEntryRepository.findByIdAndUser(id, user)
            .map(entry -> {
                entry.setEndTime(manualEnd != null ? manualEnd : LocalDateTime.now());
                return timeEntryRepository.save(entry);
            })
            .orElseThrow(() -> new ResourceNotFoundException("Timer not found"));
    }
    private boolean hasActiveTimer(Users user) {
        return timeEntryRepository.findByUserAndEndTimeIsNull(user).isPresent();
    }

    public List<String> getDescriptionSuggestions(String query, Users user) {
        return List.of("Meeting", "Development", "Research"); // Placeholder
    }
}