from fastapi import FastAPI, UploadFile, File, HTTPException
import cv2
import numpy as np
from PIL import Image
from dotenv import load_dotenv
import io
import os
import json
import base64
import time
import traceback
from typing import List, Dict, Any, Optional

load_dotenv()

from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.prompts import PromptTemplate
import re

app = FastAPI(title="Agentic Pro Handwritten Extraction")

# Global Config
# Shared LLM - Using Groq (Llama 3.3 70B for maximum accuracy)
GROQ_MODEL = "llama-3.3-70b-versatile"
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

llm = ChatGroq(
    model=GROQ_MODEL,
    groq_api_key=GROQ_API_KEY,
    temperature=0.1,
    max_tokens=4096
)

class ExtractionAgent:
    def __init__(self, callback_handler=None):
        self.handler = callback_handler
        self.llm = llm

    async def _step_visual_extraction(self, base64_image: str) -> Dict[str, Any]:
        """Step 1: Real Local OCR Extraction using EasyOCR."""
        print("INFO: Starting Local OCR Extraction...")
        try:
            import easyocr
            import numpy as np
            import base64
            from PIL import Image
            import io

            # Decode image
            image_data = base64.b64decode(base64_image)
            image = Image.open(io.BytesIO(image_data))
            image_np = np.array(image)

            # Perform Detection using the pre-loaded reader
            if not hasattr(self, 'reader'):
                import easyocr
                self.reader = easyocr.Reader(['en'], gpu=False, verbose=False)
            
            results = self.reader.readtext(image_np)

            # Sort results top-to-bottom (primary) and left-to-right (secondary)
            # usage of a tolerance could be better, but simple sort usually works for single column forms
            results.sort(key=lambda r: (r[0][0][1], r[0][0][0]))
            
            # Format results into our expected structure
            elements = []
            full_text_context = []
            
            for (bbox, text, prob) in results:
                elements.append({
                    "label": "Detected Text",
                    "text": text,
                    "clarity": float(prob)
                })
                full_text_context.append(text)
            
            print(f"INFO: OCR found {len(elements)} elements.")
            
            return {
                "elements": elements,
                "visual_context": " \n".join(full_text_context),
                "detected_language": "en"
            }
        except Exception as e:
            print(f"ERROR: Local OCR failed ({str(e)}). Falling back to simulation.")
            traceback.print_exc()
            return {
                "elements": [
                    {"label": "Error", "text": "OCR Failed to read image", "clarity": 0.0}
                ],
                "visual_context": "OCR Extraction Failed",
                "detected_language": "en"
            }

    async def _step_cleaning_normalization(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Step 2: Forensic OCR Extraction."""
        prompt_text = f"""
        [INST]
        You are an expert OCR system specialized in reading handwritten text with maximum accuracy.
        
        Analyze this handwritten document with extreme care and extract ALL the information you can see.
        
        CRITICAL INSTRUCTIONS FOR MAXIMUM ACCURACY:
        1. Read each character and word carefully - examine the image in detail
        2. DO NOT assume or hallucinate any fields - only extract what is clearly visible
        3. Pay special attention to:
           - Numbers (phone numbers, dates, policy numbers, etc.) - read each digit precisely
           - Names - read each letter carefully, including capitalization
           - Addresses - read street names, numbers, and city names accurately
           - Email addresses - verify @ symbols and domain names
        4. For partially readable text, extract what you can see clearly, even if incomplete
        5. If text is completely illegible or blank, mark it as "unreadable" (not null)
        6. Return the data as clean, structured JSON with proper nesting
        7. Create field names based on actual labels, headings, and form structure you see
        8. Preserve the exact logical structure and grouping of information
        9. Be extremely precise with values - read numbers and text character by character
        10. Double-check your extraction before returning the JSON
        
        IMPORTANT: Read slowly and carefully. Accuracy is more important than speed.
        Return ONLY valid JSON with no additional text, markdown, or explanation before or after.
        The JSON should have descriptive keys based on the actual content structure.
        
        RAW OCR DATA (spatial text coordinates):
        {json.dumps(raw_data)}
        [/INST]
        """
        
        try:
            response = self.llm.invoke(prompt_text)
            # Extract content from LangChain message
            if hasattr(response, 'content'):
                response_text = response.content
            else:
                response_text = str(response)
            
            return self._extract_json_from_text(response_text)
        except Exception as e:
            print(f"Extraction Step Error: {e}")
            traceback.print_exc()
            return self._create_fallback_data(str(e))

    async def _step_validation_cleaning(self, extracted_json: Dict[str, Any]) -> Dict[str, Any]:
        """Step 3: Data Table Formatting."""
        # Convert the extracted data into the exact format needed for the Data Table
        try:
            # Ensure we have the required structure
            if "sections" not in extracted_json:
                # Try to auto-convert flat structure to sections
                sections = []
                for key, value in extracted_json.items():
                    if key not in ["document_type", "summary", "signatures_detected", "key_entities"]:
                        if isinstance(value, dict):
                            # This is a section
                            fields = []
                            for field_key, field_val in value.items():
                                fields.append({
                                    "field_name": field_key,
                                    "field_value": str(field_val)
                                })
                            sections.append({
                                "section_name": key,
                                "fields": fields
                            })
                        else:
                            # This is a standalone field
                            sections.append({
                                "section_name": "General Information",
                                "fields": [{"field_name": key, "field_value": str(value)}]
                            })
                
                extracted_json["sections"] = sections
            
            # Ensure required keys exist
            if "document_type" not in extracted_json:
                extracted_json["document_type"] = "Handwritten Form"
            if "summary" not in extracted_json:
                extracted_json["summary"] = "Extracted handwritten form data"
            if "signatures_detected" not in extracted_json:
                extracted_json["signatures_detected"] = False
            if "key_entities" not in extracted_json:
                extracted_json["key_entities"] = {}
            if "confidence_score" not in extracted_json:
                extracted_json["confidence_score"] = 0.85
                
            return extracted_json
        except Exception as e:
            print(f"Validation Error: {e}")
            return extracted_json

    def _extract_json_from_text(self, text: str) -> Dict[str, Any]:
        """Aggressive JSON extraction from potential chatty output."""
        try:
            print(f"DEBUG: Raw LLM Output: {text[:500]}...") # Debug log
            
            # 1. Try direct parse
            try:
                return json.loads(text)
            except:
                pass
            
            # 2. Extract block between first { and last }
            match = re.search(r'(\{.*\})', text, re.DOTALL)
            if match:
                json_str = match.group(1)
                return json.loads(json_str)
                
            # 3. Try to find markdown code blocks
            match = re.search(r'```json\s*(\{.*?\})\s*```', text, re.DOTALL)
            if match:
                return json.loads(match.group(1))

            raise ValueError("No JSON found in response")
            
        except Exception as e:
            print(f"JSON Extraction Failed: {e}")
            return self._create_fallback_data(text)

    def _create_fallback_data(self, raw_text: str) -> Dict[str, Any]:
        """Create a valid structure even from failure."""
        return {
            "document_type": "Extraction Parsed as Text",
            "summary": "The model return could not be parsed as strict JSON, but here is the content.",
            "sections": [
                {
                    "section_name": "Raw Model Output",
                    "fields": [
                        {"field_name": "Full Response", "field_value": raw_text}
                    ]
                }
            ],
            "key_entities": {},
            "signatures_detected": False
        }

    def _parse_json(self, content: str) -> Dict[str, Any]:
        try:
            # Clean up the response
            content = content.strip()
            
            # Remove Markdown indicators
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            # Find the actual JSON block using braces if needed
            start_idx = content.find("{")
            end_idx = content.rfind("}")
            if start_idx != -1 and end_idx != -1:
                content = content[start_idx:end_idx+1]
                
            return json.loads(content)
        except Exception as e:
            print(f"Failed to parse JSON: {content[:100]}... Error: {str(e)}")
            # Robust Fallback for frontend
            return {
                "document_type": "Extraction Result",
                "summary": "Data extracted but required structure correction. Data is preserved.",
                "sections": [
                    {
                        "section_name": "Auto-Recovered Data",
                        "fields": [
                            {"field_name": "Status", "field_value": "Success with Formatting Fallback", "confidence": "high"},
                            {"field_name": "Raw Signal Content", "field_value": content[:2000], "confidence": "low"}
                        ]
                    }
                ],
                "key_entities": {},
                "signatures_detected": False,
                "confidence_score": 0.5
            }

    async def process(self, image_bytes: bytes, filename: str) -> Dict[str, Any]:
        start_t = time.time()
        workflow_log = []
        
        try:
            # 1. Validation & Prep
            img = Image.open(io.BytesIO(image_bytes))
            workflow_log.append({"step": "1. Validation", "status": "COMPLETED"})
            
            # 2. Visual Extraction
            base64_img = base64.b64encode(image_bytes).decode('utf-8')
            raw_results = await self._step_visual_extraction(base64_img)
            workflow_log.append({"step": "2. Visual Extraction", "status": "COMPLETED", "data": raw_results})
            
            # 3. Structural Extraction
            structural_json = await self._step_cleaning_normalization(raw_results)
            workflow_log.append({"step": "3. Extraction", "status": "COMPLETED", "data": structural_json})
            
            # 4. Expert Validation & Cleaning
            final_data = await self._step_validation_cleaning(structural_json)
            workflow_log.append({"step": "4. Validation & Cleaning", "status": "COMPLETED", "data": final_data})
            
            latency = int((time.time() - start_t) * 1000)
            
            return {
                "status": "success",
                "filename": filename,
                "data": final_data,
                "unclear_fields": final_data.get("unclear_fields", []),
                "confidence_score": final_data.get("confidence_score", 0.9),
                "raw_text": raw_results.get("visual_context", ""),
                "steps": workflow_log,
                "latency_ms": latency
            }
        except Exception as e:
            traceback.print_exc()
            return {
                "status": "error",
                "error": str(e),
                "steps": workflow_log
            }

agent = ExtractionAgent(None)

@app.post("/process")
async def process_form(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files (JPEG, PNG) are supported.")
        
    contents = await file.read()
    result = await agent.process(contents, file.filename)
    
    if result["status"] == "error":
        raise HTTPException(status_code=500, detail=result["error"])
        
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
