package com.tushar.demo.timetracker.config;

import java.sql.DatabaseMetaData;
import java.sql.SQLException;

import javax.sql.DataSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class TimeEntrySchemaGuard implements ApplicationRunner {
    private static final Logger logger = LoggerFactory.getLogger(TimeEntrySchemaGuard.class);

    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;

    public TimeEntrySchemaGuard(DataSource dataSource, JdbcTemplate jdbcTemplate) {
        this.dataSource = dataSource;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!isPostgres()) {
            return;
        }

        ensureEndTimeIsNullable();
        ensureEntryDateBackfilled();
    }

    private boolean isPostgres() {
        try (var connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            String productName = metaData.getDatabaseProductName();
            return productName != null && productName.toLowerCase().contains("postgresql");
        } catch (SQLException e) {
            logger.warn("Skipping schema guard because database metadata could not be read: {}", e.getMessage());
            return false;
        }
    }

    private void ensureEndTimeIsNullable() {
        String nullable;
        try {
            nullable = jdbcTemplate.queryForObject(
                    """
                    SELECT is_nullable
                    FROM information_schema.columns
                    WHERE table_schema = current_schema()
                      AND table_name = 'time_entry'
                      AND column_name = 'end_time'
                    """,
                    String.class
            );
        } catch (EmptyResultDataAccessException e) {
            logger.warn("Schema guard skipped: time_entry.end_time column not found in current schema.");
            return;
        }

        if (nullable == null || "YES".equalsIgnoreCase(nullable)) {
            return;
        }

        jdbcTemplate.execute("ALTER TABLE IF EXISTS time_entry ALTER COLUMN end_time DROP NOT NULL");
        logger.info("Adjusted schema: time_entry.end_time is now nullable for active timers.");
    }

    private void ensureEntryDateBackfilled() {
        String nullable;
        try {
            nullable = jdbcTemplate.queryForObject(
                    """
                    SELECT is_nullable
                    FROM information_schema.columns
                    WHERE table_schema = current_schema()
                      AND table_name = 'time_entry'
                      AND column_name = 'entry_date'
                    """,
                    String.class
            );
        } catch (EmptyResultDataAccessException e) {
            return;
        }

        if (nullable == null) {
            return;
        }

        int updated = jdbcTemplate.update(
                """
                UPDATE time_entry
                SET entry_date = DATE(start_time)
                WHERE entry_date IS NULL
                  AND start_time IS NOT NULL
                """
        );

        if (updated > 0) {
            logger.info("Backfilled entry_date for {} time_entry rows.", updated);
        }
    }
}
