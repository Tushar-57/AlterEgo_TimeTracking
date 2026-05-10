package com.tushar.demo.timetracker.config;

import java.sql.DatabaseMetaData;
import java.sql.SQLException;

import javax.sql.DataSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Widens the auto-generated {@code agentic_sync_outbox_status_check} CHECK constraint
 * so newly added enum values (e.g. {@code DEAD}) are accepted at insert / update time.
 *
 * <p>Background: Hibernate creates a CHECK constraint listing the enum values it knows
 * about when the table is first created. When new values are added to
 * {@link com.tushar.demo.timetracker.model.AgenticSyncOutboxStatus} the existing
 * constraint is NOT refreshed by {@code spring.jpa.hibernate.ddl-auto=update}, which
 * leads to:
 *
 * <pre>
 *   ERROR: new row for relation "agentic_sync_outbox" violates check constraint
 *   "agentic_sync_outbox_status_check"
 * </pre>
 *
 * <p>This guard drops the old constraint (if present) and recreates it with the
 * full enum value set. Idempotent — safe to run on every startup.
 */
@Component
@Order(20)
public class AgenticOutboxSchemaGuard implements ApplicationRunner {
    private static final Logger logger = LoggerFactory.getLogger(AgenticOutboxSchemaGuard.class);

    private static final String CONSTRAINT_NAME = "agentic_sync_outbox_status_check";
    private static final String[] ALLOWED_STATUSES = {
            "PENDING", "RETRY", "PROCESSING", "SUCCESS", "FAILED", "DEAD"
    };

    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;

    public AgenticOutboxSchemaGuard(DataSource dataSource, JdbcTemplate jdbcTemplate) {
        this.dataSource = dataSource;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!isPostgres()) {
            return;
        }

        if (!tableExists()) {
            return;
        }

        try {
            jdbcTemplate.execute(
                    "ALTER TABLE agentic_sync_outbox DROP CONSTRAINT IF EXISTS " + CONSTRAINT_NAME
            );

            String allowed = String.join("','", ALLOWED_STATUSES);
            jdbcTemplate.execute(
                    "ALTER TABLE agentic_sync_outbox ADD CONSTRAINT " + CONSTRAINT_NAME
                            + " CHECK (status IN ('" + allowed + "'))"
            );

            logger.info(
                    "Widened {} to accept statuses: {}", CONSTRAINT_NAME, String.join(", ", ALLOWED_STATUSES)
            );
        } catch (RuntimeException e) {
            // Non-fatal: a previous run might already have applied the migration,
            // or we lack ALTER privilege. Log and continue startup.
            logger.warn("Could not widen {} constraint: {}", CONSTRAINT_NAME, e.getMessage());
        }
    }

    private boolean isPostgres() {
        try (var connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            String productName = metaData.getDatabaseProductName();
            return productName != null && productName.toLowerCase().contains("postgresql");
        } catch (SQLException e) {
            logger.warn("Skipping outbox schema guard because database metadata could not be read: {}", e.getMessage());
            return false;
        }
    }

    private boolean tableExists() {
        try {
            Integer count = jdbcTemplate.queryForObject(
                    """
                    SELECT COUNT(*)::int
                    FROM information_schema.tables
                    WHERE table_schema = current_schema()
                      AND table_name = 'agentic_sync_outbox'
                    """,
                    Integer.class
            );
            return count != null && count > 0;
        } catch (RuntimeException e) {
            logger.debug("Outbox table existence check failed: {}", e.getMessage());
            return false;
        }
    }
}
