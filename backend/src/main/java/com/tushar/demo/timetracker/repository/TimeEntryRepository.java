// TimeEntryRepository.java
package com.tushar.demo.timetracker.repository;

import com.tushar.demo.timetracker.model.TimeEntry;
import com.tushar.demo.timetracker.model.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TimeEntryRepository extends JpaRepository<TimeEntry, Long> {
	List<TimeEntry> findByUserIdAndStartTimeBetween(Long userId, LocalDateTime start, LocalDateTime end);
    Optional<TimeEntry> findByUserIdAndEndTimeIsNull(Long userId);

    @Query("SELECT te FROM TimeEntry te WHERE te.user.id = :userId ORDER BY te.startTime DESC")
    List<TimeEntry> findByUserIdOrderByStartTimeDesc(Long userId, int limit);
}
