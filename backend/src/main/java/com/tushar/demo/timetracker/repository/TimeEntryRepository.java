// TimeEntryRepository.java
package com.tushar.demo.timetracker.repository;

import com.tushar.demo.timetracker.model.TimeEntry;
import com.tushar.demo.timetracker.model.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface TimeEntryRepository extends JpaRepository<TimeEntry, Long> {
    List<TimeEntry> findByUserAndStartTimeBetween(Users user, LocalDateTime start, LocalDateTime end);
}