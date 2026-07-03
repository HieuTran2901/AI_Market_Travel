package com.travel.marketplace.modules.infrastructure.audit.aspect;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travel.marketplace.modules.infrastructure.audit.annotation.Audit;
import com.travel.marketplace.modules.infrastructure.audit.entity.AuditLog;
import com.travel.marketplace.modules.infrastructure.audit.repository.AuditLogRepository;
import com.travel.marketplace.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.UUID;

@Aspect
@Component
@Slf4j
@RequiredArgsConstructor
public class AuditLogger {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    @Around("@annotation(auditAnnotation)")
    public Object logAuditActivity(ProceedingJoinPoint joinPoint, Audit auditAnnotation) throws Throwable {
        
        Long userId = null;
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal userDetails) {
            userId = userDetails.getId();
        }
        
        String ipAddress = null;
        String requestId = UUID.randomUUID().toString(); // Generate simple trace ID
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            ipAddress = request.getRemoteAddr();
            // Could extract correlationId from headers if available
        }
        
        Object result = null;
        try {
            result = joinPoint.proceed();
            return result;
        } finally {
            try {
                String details = "{}";
                if (result != null) {
                    // Very simple JSON serialization of result just for tracing
                    // Real implementation should be careful about PII and circular references
                    details = objectMapper.writeValueAsString(result);
                }

                AuditLog auditLog = AuditLog.builder()
                        .userId(userId)
                        .action(auditAnnotation.action())
                        .entityType(auditAnnotation.entityType())
                        .ipAddress(ipAddress)
                        .requestId(requestId)
                        .correlationId(requestId) // Keeping it simple for demo
                        .details(details)
                        .build();
                        
                auditLogRepository.save(auditLog);
                log.debug("Saved audit log for action: {}", auditAnnotation.action());
            } catch (Exception e) {
                log.error("Failed to save audit log", e);
            }
        }
    }
}
