package com.app.repository;

import com.app.entity.Form;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FormRepository extends JpaRepository<Form, Long> {
    List<Form> findAllByOrderByUploadedAtDesc();
}
