package com.playcock.common.audit;

import java.util.Optional;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;

@Configuration
public class AuditConfig {
    @Bean
    AuditorAware<String> auditorAware() {
        return () -> Optional.of("system");
    }
}
