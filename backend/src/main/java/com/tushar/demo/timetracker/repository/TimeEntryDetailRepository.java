package com.tushar.demo.timetracker.repository;

import com.tushar.demo.timetracker.model.TimeEntryDetail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TimeEntryDetailRepository extends JpaRepository<TimeEntryDetail, Long> {
    Optional<TimeEntryDetail> findByTimeEntryId(Long timeEntryId);
    List<TimeEntryDetail> findByTimeEntryIdIn(List<Long> timeEntryIds);
}
