package com.tushar.demo.timetracker.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.tushar.demo.timetracker.model.OnboardingEntity;
import com.tushar.demo.timetracker.model.Users;

public interface OnboardingRepository extends JpaRepository<OnboardingEntity, Long> {
    Optional<OnboardingEntity> findTopByUserOrderByIdDesc(Users user);

    /**
     * The same row with its goals already loaded.
     *
     * goals is a lazy @OneToMany, and the snapshot sync reads it after the
     * session has closed. Every sync therefore failed, every time, with:
     *
     *   Onboarding snapshot sync failed for user ...: failed to lazily
     *   initialize a collection of role: OnboardingEntity.goals: could not
     *   initialize proxy - no Session
     *
     * So the person's goals never reached the other half of the product —
     * which is why it had nothing to say about them.
     */
    @EntityGraph(attributePaths = "goals")
    Optional<OnboardingEntity> findWithGoalsById(Long id);
}
