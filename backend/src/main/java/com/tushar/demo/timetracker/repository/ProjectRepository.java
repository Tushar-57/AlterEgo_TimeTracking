// TimeEntryRepository.java
package com.tushar.demo.timetracker.repository;

import com.tushar.demo.timetracker.model.Project;
import com.tushar.demo.timetracker.model.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByUser(Users user);
    Optional<Project> findByNameAndUser(String name, Users user);
    Optional<Project> findByIdAndUser(Long Id, Users user);
}