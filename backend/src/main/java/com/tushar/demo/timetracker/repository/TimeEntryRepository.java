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
    List<TimeEntry> findByUserAndStartTimeBetween(Users user, LocalDateTime start, LocalDateTime end);

    Optional<TimeEntry> findByUserAndEndTimeIsNull(Users user);
    
    // Add missing method
    Optional<TimeEntry> findByIdAndUser(Long id, Users user);
    
    @Query("SELECT DISTINCT t.taskDescription FROM TimeEntry t WHERE t.user = :user AND LOWER(t.taskDescription) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<String> findSimilarDescriptions(@Param("user") Users user, @Param("query") String query);
}