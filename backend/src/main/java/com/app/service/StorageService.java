package com.app.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class StorageService {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    public String store(MultipartFile file) throws IOException {
        Path root = Paths.get(uploadDir);
        if (!Files.exists(root)) {
            Files.createDirectories(root);
        }

        String filename = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Path target = root.resolve(filename);
        Files.copy(file.getInputStream(), target);

        return target.toString();
    }
}
