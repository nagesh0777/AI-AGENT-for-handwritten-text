package com.app.agent;

import com.app.agent.nodes.*;
import com.app.entity.Form;
import com.app.entity.ExtractedData;
import com.app.repository.FormRepository;
import com.app.repository.ExtractedDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.nio.file.Files;
import java.nio.file.Path;

@Service
public class AgentOrchestrator {

    @Autowired
    private OCRProcessingNode ocrProcessingNode;
    @Autowired
    private FormRepository formRepository;
    @Autowired
    private ExtractedDataRepository extractedDataRepository;

    public void runPipeline(Form form) {
        try {
            // Initial Context
            AgentContext context = AgentContext.builder()
                    .form(form)
                    .fileContent(Files.readAllBytes(Path.of(form.getFilePath())))
                    .build();

            // Execute Python-based OCR Engine node
            context = ocrProcessingNode.execute(context);

            // Save Results
            if (context.getStructuredJson() != null) {
                ExtractedData data = ExtractedData.builder()
                        .form(form)
                        .rawText(context.getRawText())
                        .structuredJson(context.getStructuredJson())
                        .confidenceScore(context.getConfidenceScore())
                        .unclearFields(context.getMetadata().get("unclear_fields") != null
                                ? context.getMetadata().get("unclear_fields").toString()
                                : null)
                        .build();
                extractedDataRepository.save(data);

                form.setStatus(Form.Status.COMPLETED);
            } else {
                form.setStatus(Form.Status.FAILED);
            }
            formRepository.save(form);

        } catch (Exception e) {
            form.setStatus(Form.Status.FAILED);
            formRepository.save(form);
            e.printStackTrace();
        }
    }
}
