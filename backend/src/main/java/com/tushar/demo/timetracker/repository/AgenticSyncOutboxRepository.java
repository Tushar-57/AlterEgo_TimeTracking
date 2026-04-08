package com.tushar.demo.timetracker.repository;

import com.tushar.demo.timetracker.model.AgenticSyncOutboxEvent;
import com.tushar.demo.timetracker.model.AgenticSyncOutboxStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

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
}
