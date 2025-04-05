// TimeEntryService.java
package com.tushar.demo.timetracker.service;

import com.tushar.demo.timetracker.dto.addTimeEntryRequest;
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

    public TimeEntry createTimeEntry(addTimeEntryRequest request, Users user) {
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
}