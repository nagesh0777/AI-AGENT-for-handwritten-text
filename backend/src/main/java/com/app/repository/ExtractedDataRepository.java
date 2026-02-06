package com.app.repository;

import com.app.entity.ExtractedData;
import com.app.entity.Form;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ExtractedDataRepository extends JpaRepository<ExtractedData, Long> {
    Optional<ExtractedData> findByForm(Form form);
}
