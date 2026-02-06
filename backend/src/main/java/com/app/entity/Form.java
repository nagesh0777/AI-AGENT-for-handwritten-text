package com.app.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "forms")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Form {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fileName;
    private String filePath;
    private String fileType;
    private Long fileSize;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.PENDING;

    @Builder.Default
    private LocalDateTime uploadedAt = LocalDateTime.now();
    private LocalDateTime processedAt;

    @OneToOne(mappedBy = "form", cascade = CascadeType.ALL)
    private ExtractedData extractionResults;

    public enum Status {
        PENDING, PROCESSING, COMPLETED, FAILED
    }
}
