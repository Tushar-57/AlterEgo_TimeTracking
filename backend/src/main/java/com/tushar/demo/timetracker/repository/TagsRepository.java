// TimeEntryRepository.java
package com.tushar.demo.timetracker.repository;

import com.tushar.demo.timetracker.model.Project;
import com.tushar.demo.timetracker.model.Tags;
import com.tushar.demo.timetracker.model.TimeEntry;
import com.tushar.demo.timetracker.model.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import javax.swing.text.html.HTML.Tag;

public interface TagsRepository extends JpaRepository<Tags, Long> {
	List<Tags> findByUser(Users user);
    Optional<Tags> findByNameAndUser(String name, Users user);
    Optional<Tags> findByIdAndUser(Long Id, Users user);
    
//    @Query("SELECT DISTINCT t.taskDescription FROM TimeEntry t WHERE t.user = :user AND LOWER(t.taskDescription) LIKE LOWER(CONCAT('%', :query, '%'))")
//    List<String> findSimilarDescriptions(@Param("user") Users user, @Param("query") String query);
    
//    Optional<Tags> getUserTags(Users user);
}