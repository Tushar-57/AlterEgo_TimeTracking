package com.tushar.demo.timetracker.service;

import com.tushar.demo.timetracker.dto.request.StartTimeEntryRequest;
import com.tushar.demo.timetracker.model.TimeEntry;
import com.tushar.demo.timetracker.model.Users;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public interface TimeEntryService {
    TimeEntry startTimeEntry(StartTimeEntryRequest request, Users user);
    TimeEntry stopTimer(Long timerId, Users user, LocalDateTime manualEnd);
    TimeEntry getActiveTimer(Users user);
    List<TimeEntry> getRecentTimeEntries(Users user, int limit);
    List<TimeEntry> getTimeEntriesBetweenDates(Users user, LocalDateTime start, LocalDateTime end);
    TimeEntry updateTimerPosition(Long timerId, Users user, String positionTop, String positionLeft);
}