package com.tushar.demo.timetracker.repository;

import com.tushar.demo.timetracker.model.TaskBoardState;
import com.tushar.demo.timetracker.model.Users;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TaskBoardStateRepository extends JpaRepository<TaskBoardState, Long> {
    Optional<TaskBoardState> findTopByUserOrderByUpdatedAtDesc(Users user);
}
