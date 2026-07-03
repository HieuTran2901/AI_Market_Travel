package com.travel.marketplace.modules.scheduler.repository;

import com.travel.marketplace.modules.scheduler.entity.JobExecution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobExecutionRepository extends JpaRepository<JobExecution, Long> {
    List<JobExecution> findTop10ByOrderByStartTimeDesc();
}
