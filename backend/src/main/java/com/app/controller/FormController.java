package com.app.controller;

import com.app.agent.AgentOrchestrator;
import com.app.entity.Form;
import com.app.entity.ExtractedData;
import com.app.repository.FormRepository;
import com.app.repository.ExtractedDataRepository;
import com.app.service.StorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/forms")
public class FormController {

    @Autowired
    private StorageService storageService;
    @Autowired
    private FormRepository formRepository;
    @Autowired
    private AgentOrchestrator agentOrchestrator;
    @Autowired
    private ExtractedDataRepository extractedDataRepository;

    @PostMapping("/upload")
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file) {
        try {
            String path = storageService.store(file);

            Form form = Form.builder()
                    .fileName(file.getOriginalFilename())
                    .filePath(path)
                    .fileType(file.getContentType())
                    .fileSize(file.getSize())
                    .status(Form.Status.PROCESSING)
                    .build();
            formRepository.save(form);

            // Async processing
            CompletableFuture.runAsync(() -> agentOrchestrator.runPipeline(form));

            return ResponseEntity.ok(Map.of("id", form.getId(), "status", form.getStatus()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/history")
    public List<Form> history() {
        return formRepository.findAllByOrderByUploadedAtDesc();
    }

    @GetMapping("/{id}/results")
    public ResponseEntity<?> results(@PathVariable Long id) {
        Form form = formRepository.findById(id).orElse(null);
        if (form == null)
            return ResponseEntity.notFound().build();

        java.util.Optional<ExtractedData> data = extractedDataRepository.findByForm(form);
        if (data.isPresent()) {
            return ResponseEntity.ok(data.get());
        }
        return ResponseEntity.status(404).body(Map.of("message", "Processing not finished"));
    }

    @GetMapping("/{id}/image")
    public ResponseEntity<Resource> serveFile(@PathVariable Long id) {
        try {
            Form form = formRepository.findById(id).orElseThrow();
            Path file = Paths.get(form.getFilePath());
            Resource resource = new UrlResource(file.toUri());

            if (resource.exists() || resource.isReadable()) {
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(form.getFileType()))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + form.getFileName() + "\"")
                        .body(resource);
            } else {
                throw new RuntimeException("Could not read file: " + form.getFileName());
            }
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            Form form = formRepository.findById(id).orElseThrow();
            // Delete file from storage
            try {
                java.nio.file.Files.deleteIfExists(java.nio.file.Paths.get(form.getFilePath()));
            } catch (Exception e) {
                // Ignore if file doesn't exist
            }
            // Delete ext data
            extractedDataRepository.findByForm(form).ifPresent(extractedDataRepository::delete);
            // Delete form
            formRepository.delete(form);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to delete form: " + e.getMessage());
        }
    }
}
