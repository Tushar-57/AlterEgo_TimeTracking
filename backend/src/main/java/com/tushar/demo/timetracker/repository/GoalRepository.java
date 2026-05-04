package com.tushar.demo.timetracker.repository;

import com.tushar.demo.timetracker.model.GoalEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface GoalRepository extends JpaRepository<GoalEntity, Long> {

    Optional<GoalEntity> findFirstByIdOrderByGoalIdDesc(String id);

    /**
     * Resolve a goal by its custom external id ("goal1", etc.) but only return it
     * if it belongs to the given user via the latest onboarding record. Prevents
     * cross-user goal updates.
     */
    @Query(value = """
            SELECT g FROM GoalEntity g
            WHERE g.id = :goalId
              AND g.goalId IN (
                  SELECT og.goalId FROM OnboardingEntity o JOIN o.goals og
                  WHERE o.user.id = :userId
              )
            """)
    List<GoalEntity> findByExternalIdForUser(@Param("goalId") String goalId,
                                             @Param("userId") Long userId);
}
