package com.app.agent.nodes;

import com.app.agent.AgentContext;
import com.app.agent.AgentNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;

@Component
public class OCRProcessingNode implements AgentNode {

    @Value("${app.ocr.engine-url}")
    private String ocrEngineUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public AgentContext execute(AgentContext context) throws Exception {
        System.out.println("Forwarding form to Python OCR Engine...");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        ByteArrayResource contentsAsResource = new ByteArrayResource(context.getFileContent()) {
            @Override
            public String getFilename() {
                return context.getForm().getFileName();
            }
        };
        body.add("file", contentsAsResource);

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    ocrEngineUrl + "/process",
                    HttpMethod.POST,
                    requestEntity,
                    new ParameterizedTypeReference<Map<String, Object>>() {
                    });

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> result = response.getBody();
                context.setRawText((String) result.get("raw_text"));

                @SuppressWarnings("unchecked")
                Map<String, Object> data = (Map<String, Object>) result.get("data");
                context.setExtractedFields(data);

                // Fix: Serialize to valid JSON string instead of Map.toString()
                context.setStructuredJson(objectMapper.writeValueAsString(data));

                // Extract new fields from workflow
                context.setConfidenceScore((Double) result.get("confidence_score"));

                @SuppressWarnings("unchecked")
                java.util.List<String> unclear = (java.util.List<String>) result.get("unclear_fields");
                context.getMetadata().put("unclear_fields", unclear);
            } else {
                context.addError("OCR_ENGINE_ERROR", "Received non-OK status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            context.addError("OCR_ENGINE_COMM_ERROR", "Failed to communicate with OCR Engine: " + e.getMessage());
            e.printStackTrace(); // Helpful for debugging
        }

        return context;
    }

    @Override
    public String getName() {
        return "OCR_PROCESSING_NODE";
    }
}
