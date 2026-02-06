# AI Agent Workflow Design: Handwritten Form Extraction

This document outlines the multi-step AI Agent workflow for extracting structured data from handwritten forms, as per the functional requirements.

## 1. AI Agent Workflow Overview
The system employs a sequential pipeline orchestrated by a Python-based FastAPI service, integrated with Langfuse for observability.

### Step-by-Step Processing Flow

| Step | Component | Description | Traceability |
| :--- | :--- | :--- | :--- |
| **1. Input Validation** | FastAPI | Validates file type (Image/PDF) and size (<10MB). | API Logs |
| **2. Pre-processing** | OpenCV | Converts to Grayscale, applies Otsu's Thresholding, and enhances contrast to improve OCR accuracy. | Processed Image Buffers |
| **3. OCR Extraction** | Tesseract / EasyOCR | Converts physical glyphs into raw machine-readable text. | Raw Text Trace |
| **4. Cleaning & Normalization** | LLM (Groq) | Removes noise, fixes common OCR misspellings, and normalizes date/currency formats. | Langfuse Span |
| **5. Structural Analysis** | LLM (Groq) | Identifies key-value pairs, tables, and nested structures based on internal schema. | Langfuse Span |
| **6. Validation** | Python Logic | Schema validation of the JSON output and data type checking. | Validation Logs |
| **7. Confidence Estimation** | LLM + Statistical | Combines OCR confidence with LLM's self-assessment of the handwriting clarity. | confidence_score field |
| **8. Persistence** | Spring Boot | Sends the final structured object to the Java backend for storage in MySQL/H2. | DB Record ID |

---

## 2. Sample Structured Output
The AI Agent generates a JSON object structured for easy downstream consumption.

```json
{
  "document_info": {
    "type": "Application Form",
    "confidence_score": 0.89,
    "timestamp": "2026-02-06T12:00:00Z"
  },
  "extracted_data": {
    "personal_info": {
      "full_name": "John Doe",
      "dob": "1990-05-15",
      "occupation": "Software Engineer"
    },
    "contact_details": {
      "email": "john.doe@example.com",
      "phone": "+1-555-0199"
    },
    "history_table": [
      {"year": "2020", "event": "Graduation", "status": "Completed"},
      {"year": "2022", "event": "Junior Dev Role", "status": "Active"}
    ]
  },
  "unclear_fields": ["middle_name", "signature_date"]
}
```

---

## 3. Error and Validation Strategy

### Validation Rules
1. **Schema Check**: The output must conform to a predefined JSON schema for the specific form type.
2. **Confidence Threshold**: If the confidence score drops below **0.60**, the record is flagged for "Manual Review".
3. **Regex Check**: Critical fields like Emails and Phone Numbers are validated using regular expressions after LLM extraction.

### Error Handling
- **Invalid Files**: Returns a `400 Bad Request` with specific details (e.g., "Unsupported file format").
- **LLM Failures**: If Groq/OpenAI is unavailable, the system notifies the user and moves the form to a "Retry" queue.
- **Poor Handwriting**: If the OCR returns <20% legible characters, the system fails gracefully with "Low Legibility Error".

---

## 4. Observability with Langfuse
Each extraction request generates a unique **Trace ID**. You can monitor:
- **Latency**: How long each step (Preprocessing vs LLM) takes.
- **Cost**: Token usage for each extraction.
- **Accuracy**: User feedback can be tagged back to specific traces to improve the model.
