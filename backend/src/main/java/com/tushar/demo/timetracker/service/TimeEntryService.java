package com.tushar.demo.timetracker.service;

import com.tushar.demo.timetracker.dto.request.StartTimeEntryRequest;
import com.tushar.demo.timetracker.model.TimeEntry;
import com.tushar.demo.timetracker.model.Users;

import java.time.LocalDateTime;
import java.util.List;

public interface TimeEntryService {
    TimeEntry startTimeEntry(StartTimeEntryRequest request, Users user);
    TimeEntry stopTimer(Long id, Users user, LocalDateTime manualEnd);
    List<TimeEntry> getTimeEntriesBetweenDates(Users user, LocalDateTime start, LocalDateTime end);
    TimeEntry getActiveTimer(Users user);
    // Add the new method
    List<TimeEntry> getRecentTimeEntries(Users user, int limit);
}