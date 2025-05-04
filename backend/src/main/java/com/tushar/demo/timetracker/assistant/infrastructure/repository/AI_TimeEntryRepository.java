package com.tushar.demo.timetracker.assistant.infrastructure.repository;

import com.tushar.demo.timetracker.model.TimeEntry;
import com.tushar.demo.timetracker.model.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AI_TimeEntryRepository extends JpaRepository<TimeEntry, Long> {
    Optional<TimeEntry> findByUserIdAndEndTimeIsNull(Long userId);

    List<TimeEntry> findByUserIdAndStartTimeBetween(Long userId, LocalDateTime start, LocalDateTime end);

    @Query(value = "SELECT * FROM time_entry WHERE user_id = :userId ORDER BY start_time DESC LIMIT :limit", nativeQuery = true)
    List<TimeEntry> findTopByUserIdOrderByStartTimeDesc(@Param("userId") Long userId, @Param("limit") int limit);

    Optional<TimeEntry> findByIdAndUser(Long timerId, Users user);
//    Optional<TimeEntry> findActiveTimerByUser(Users user);
    
}