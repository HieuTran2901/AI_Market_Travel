package com.travel.marketplace.modules.scheduler.service;

import com.travel.marketplace.modules.scheduler.entity.JobExecution;
import com.travel.marketplace.modules.scheduler.repository.JobExecutionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.function.Supplier;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobExecutionTracker {

    private final JobExecutionRepository jobExecutionRepository;

    /**
     * Executes a job block and tracks its execution history in the database.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void trackAndExecute(String jobName, Runnable jobLogic) {
        JobExecution execution = JobExecution.builder()
                .jobName(jobName)
                .status("RUNNING")
                .startTime(Instant.now())
                .build();
        execution = jobExecutionRepository.save(execution);

        try {
            log.info("Starting background job: {}", jobName);
            jobLogic.run();
            
            execution.setStatus("COMPLETED");
            log.info("Completed background job: {}", jobName);
        } catch (Exception e) {
            execution.setStatus("FAILED");
            execution.setErrorMessage(e.getMessage());
            log.error("Failed background job: {}", jobName, e);
        } finally {
            execution.setEndTime(Instant.now());
            execution.setDurationMs(execution.getEndTime().toEpochMilli() - execution.getStartTime().toEpochMilli());
            jobExecutionRepository.save(execution);
        }
    }
}
