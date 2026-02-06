package com.app.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "extracted_data")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExtractedData {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "form_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Form form;

    @Column(columnDefinition = "TEXT")
    private String rawText;

    @Column(columnDefinition = "TEXT")
    private String structuredJson;

    @Column(columnDefinition = "TEXT")
    private String unclearFields;

    private Double confidenceScore;

    @Builder.Default
    private LocalDateTime extractedAt = LocalDateTime.now();
}
