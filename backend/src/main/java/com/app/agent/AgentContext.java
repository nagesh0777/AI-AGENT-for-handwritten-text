package com.app.agent;

import com.app.entity.Form;
import lombok.Builder;
import lombok.Data;
import java.util.HashMap;
import java.util.Map;

@Data
@Builder
public class AgentContext {
    private Form form;
    private byte[] fileContent;
    private String rawText;
    private Map<String, Object> extractedFields;
    private String structuredJson;
    private Double confidenceScore;
    private Map<String, String> errors;

    @Builder.Default
    private Map<String, Object> metadata = new HashMap<>();

    public void addError(String key, String value) {
        if (errors == null) errors = new HashMap<>();
        errors.put(key, value);
    }
}
