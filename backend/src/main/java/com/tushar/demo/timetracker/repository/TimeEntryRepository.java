package com.tushar.demo.timetracker.repository;

import com.tushar.demo.timetracker.model.TimeEntry;
import com.tushar.demo.timetracker.model.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TimeEntryRepository extends JpaRepository<TimeEntry, Long> {
    Optional<TimeEntry> findByUserIdAndEndTimeIsNull(Long userId);

    List<TimeEntry> findByUserIdAndStartTimeBetween(Long userId, LocalDateTime start, LocalDateTime end);

    @Query(value = "SELECT * FROM time_entry WHERE user_id = :userId ORDER BY start_time DESC LIMIT :limit", nativeQuery = true)
    List<TimeEntry> findTopByUserIdOrderByStartTimeDesc(@Param("userId") Long userId, @Param("limit") int limit);

    @Query(value = "SELECT * FROM time_entry WHERE user_id = :userId ORDER BY start_time DESC LIMIT :limit OFFSET :offset", nativeQuery = true)
    List<TimeEntry> findByUserIdOrderByStartTimeDescPaged(
            @Param("userId") Long userId,
            @Param("limit") int limit,
            @Param("offset") int offset);

    @Query(value = "SELECT * FROM time_entry WHERE user_id = :userId AND start_time > :horizon ORDER BY start_time DESC LIMIT :limit OFFSET :offset", nativeQuery = true)
    List<TimeEntry> findByUserIdAndStartTimeAfterPaged(
            @Param("userId") Long userId,
            @Param("horizon") LocalDateTime horizon,
            @Param("limit") int limit,
            @Param("offset") int offset);

    @Query(value = "SELECT COUNT(*) FROM time_entry WHERE user_id = :userId AND start_time > :horizon", nativeQuery = true)
    long countByUserIdAndStartTimeAfter(@Param("userId") Long userId, @Param("horizon") LocalDateTime horizon);

    long countByUserId(Long userId);

    long countByProjectId(Long projectId);

    /**
     * Detach every time entry from a project so the project row can be deleted
     * without tripping the FK constraint. Entries keep their history and simply
     * become "No Project" (project = null) in the UI.
     */
    @Modifying
    @Query("UPDATE TimeEntry t SET t.project = null WHERE t.project.id = :projectId")
    int clearProjectReferences(@Param("projectId") Long projectId);

    Optional<TimeEntry> findByIdAndUser(Long timerId, Users user);
//    Optional<TimeEntry> findActiveTimerByUser(Users user);
}