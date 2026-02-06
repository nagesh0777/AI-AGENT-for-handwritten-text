# AI Agent Workflow Document (Split-Service Implementation)
## Handwritten Form Extraction System

---

## Overview

This document details the refined AI Agent workflow where a **Spring Boot Gateway** orchestrates the process and a **Python OCR Engine** (FastAPI) handles the specialized image processing and LLM extraction.

---

## 1. Agent Architecture (Python Side)

### 1.1 Workflow Nodes

1.  **Pre-Processor**: Uses **OpenCV** to apply thresholding and increase contrast, making handwriting more distinct from the background.
2.  **OCR Engine**: Integrates with Google Vision or Tesseract to extract raw text strings.
3.  **Post-Processor**: Cleans raw text and removes noise.
4.  **Prompt Encoder**: Formats the cleaned text into a retrieval-augmented prompt for the LLM.
5.  **LLM Extractor**: Uses **GPT-4o** via LangChain/LangGraph to parse messy text into structured JSON.

---

## 2. Implementation Details

### 2.1 Python OCR Engine (FastAPI)

The Python service provides a `/process` endpoint that accepts an image and returns structured JSON.

```python
# main.py snippet
@app.post("/process")
async def process_form(file: UploadFile = File(...)):
    processed_img = preprocess(file)
    raw_text = ocr_engine(processed_img)
    extracted_data = llm_chain.invoke(raw_text)
    return extracted_data
```

### 2.2 Java Gateway Communication

The Spring Boot backend calls the Python engine using `RestTemplate` or `WebClient`.

```java
@Service
public class AIAgentService {
    @Value("${ocr.engine.url}")
    private String ocrEngineUrl;

    public ExtractedData callOcrEngine(MultipartFile file) {
        // Multi-part request to Python service
        return restTemplate.postForObject(ocrEngineUrl + "/process", request, ExtractedData.class);
    }
}
```

---

## 3. LangFuse Integration

Monitoring is handled in the Python layer using the **LangFuse Python SDK**.

*   **Traces**: Every call to `/process` initiates a trace.
*   **Spans**: Image processing, OCR, and LLM calls are logged as individual spans.
*   **Costs**: Token usage and latency are tracked automatically via LangChain integration.

---

## 4. Advantages of this split

-   **Image Processing**: Access to Python's superior AI/ML ecosystem (OpenCV, PyTorch).
-   **Iteration Speed**: Faster to update prompts and LLM logic in Python without rebuilding the entire Java system.
-   **Scalability**: The OCR engine can be scaled independently if image processing becomes a bottleneck.

---

**Document Version**: 2.0  
**Last Updated**: 2026-02-06
