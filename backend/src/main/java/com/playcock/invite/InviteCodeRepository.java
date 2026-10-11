package com.playcock.invite;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InviteCodeRepository extends JpaRepository<InviteCode, Long> {
    Optional<InviteCode> findFirstBySessionIdAndActiveTrueOrderByIdDesc(Long sessionId);

    Optional<InviteCode> findByCodeAndActiveTrue(String code);

    boolean existsByCode(String code);
}
