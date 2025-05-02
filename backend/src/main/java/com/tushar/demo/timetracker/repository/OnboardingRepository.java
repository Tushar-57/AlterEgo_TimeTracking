package com.tushar.demo.timetracker.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.tushar.demo.timetracker.model.OnboardingEntity;
import com.tushar.demo.timetracker.model.TimeEntry;
import com.tushar.demo.timetracker.model.Users;

public interface OnboardingRepository extends JpaRepository<OnboardingEntity, Long> {
    Optional<OnboardingEntity> findByUser(Users user);
 

}
