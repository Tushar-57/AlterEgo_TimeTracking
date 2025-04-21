package com.tushar.demo.timetracker.repository;

import com.tushar.demo.timetracker.model.TimeEntry;
import com.tushar.demo.timetracker.model.Users;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<Users, Long> {
	boolean existsByEmail(String email);
	Optional<Users> findByEmail(String email); // Add this method
}