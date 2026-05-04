package com.tushar.demo.timetracker.repository;

import com.tushar.demo.timetracker.model.AgenticSyncOutboxEvent;
import com.tushar.demo.timetracker.model.AgenticSyncOutboxStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AgenticSyncOutboxRepository extends JpaRepository<AgenticSyncOutboxEvent, Long> {
    List<AgenticSyncOutboxEvent> findByStatusInAndNextAttemptAtLessThanEqualOrderByNextAttemptAtAsc(
            List<AgenticSyncOutboxStatus> statuses,
            LocalDateTime nextAttemptAt,
            Pageable pageable
    );

    long countByStatus(AgenticSyncOutboxStatus status);

    Optional<AgenticSyncOutboxEvent> findFirstByStatusInOrderByNextAttemptAtAsc(List<AgenticSyncOutboxStatus> statuses);

    List<AgenticSyncOutboxEvent> findByStatusOrderByUpdatedAtDesc(AgenticSyncOutboxStatus status, Pageable pageable);

    /** Find PENDING or RETRY TIME_ENTRY_SYNC events for a specific user + entry id, to cancel them before deletion is queued. */
    @Query("SELECT e FROM AgenticSyncOutboxEvent e WHERE e.eventType = 'TIME_ENTRY_SYNC' AND e.userId = :userId AND e.status IN ('PENDING','RETRY') AND e.payloadJson LIKE %:entryIdFragment%")
    List<AgenticSyncOutboxEvent> findActiveSyncEventsForEntry(@Param("userId") Long userId, @Param("entryIdFragment") String entryIdFragment);

    /** Find all FAILED events older than a cutoff for bulk discard. */
    List<AgenticSyncOutboxEvent> findByStatusAndCreatedAtBefore(AgenticSyncOutboxStatus status, LocalDateTime cutoff);
}
