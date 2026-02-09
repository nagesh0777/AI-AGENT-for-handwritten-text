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
from langfuse.langchain import CallbackHandler

app = FastAPI(title="Agentic Pro Handwritten Extraction")

# Global Config
# Shared LLM - Using Llama 3.1 8b (Text Only) as Vision fallback is needed
VISION_MODEL = "llama-3.1-8b-instant"
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
llm = ChatGroq(model=VISION_MODEL, groq_api_key=GROQ_API_KEY, temperature=0.1)

class ExtractionAgent:
    def __init__(self, callback_handler=None):
        self.handler = callback_handler

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

            # Initialize EasyOCR Reader (loads model only once ideally, but here for safety)
            # Using 'en' for English. Can be expanded.
            # verbose=False prevents the progress bar character error on Windows
            reader = easyocr.Reader(['en'], gpu=False, verbose=False) # GPU=False for reliability on generic envs
            
            # Perform Detection
            results = reader.readtext(image_np)

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
        """Step 2: Structural Extraction and Table Detection."""
        prompt = f"""
        ACT AS: Expert Document Understanding AI.
        
        TASK: Extract all meaningful information into structured JSON.
        
        CORE RULES:
        1. Do NOT hallucinate.
        2. Detection: Sections, Tables, Checkboxes, Signatures, Stamps.
        3. Layout: Support multi-page merging and split lines.
        
        OUTPUT: Return JSON with "document_type", "summary", "sections", "tables", "key_entities", and "signatures_detected".
        
        INPUT RAW OCR: {json.dumps(raw_data)}
        """
        callbacks = [self.handler] if self.handler else []
        response = await llm.ainvoke([HumanMessage(content=prompt)], config={"callbacks": callbacks})
        return self._parse_json(response.content)

    async def _step_validation_cleaning(self, extracted_json: Dict[str, Any]) -> Dict[str, Any]:
        """Step 3: Expert Validation and Cleaning Pass."""
        prompt = f"""
        ACT AS: Expert Document Data Cleaning and Validation AI.

        YOUR GOAL: Produce the most accurate structured data from the provided JSON.

        OUTPUT STRUCTURE:
        {{
          "document_type": "string",
          "summary": "string",
          "sections": [
            {{
              "section_name": "string",
              "fields": [
                {{
                  "field_name": "string",
                  "field_value": "string",
                  "confidence": "high | medium | low"
                }}
              ]
            }}
          ],
          "tables": [
            {{
              "table_name": "string",
              "headers": [],
              "rows": []
            }}
          ],
          "key_entities": {{
            "person_names": [],
            "organizations": [],
            "dates": [],
            "emails": [],
            "phone_numbers": [],
            "addresses": [],
            "id_numbers": [],
            "amounts": []
          }},
          "signatures_detected": true
        }}

        STRICT RULES:
        - Use EXACTLY "section_name", "field_name", and "field_value" keys. 
        - Do NOT use "title", "label", or other variations.

        NORMALIZATION RULES:
        - Names -> UPPERCASE
        - Emails -> valid format, no spaces
        - Phone -> digits only
        - Dates -> DD/MM/YYYY
        - Merge multi-line addresses
        - Separate city, state, ZIP
        - Amounts -> Fixed decimal format

        VALDIATION:
        - Ensure value matches field. Closest label wins.
        - Mark confidence: high | medium | low.

        INPUT DATA: {json.dumps(extracted_json)}
        """
        callbacks = [self.handler] if self.handler else []
        response = await llm.ainvoke([HumanMessage(content=prompt)], config={"callbacks": callbacks})
        return self._parse_json(response.content)

    def _parse_json(self, content: str) -> Dict[str, Any]:
        try:
            content = content.replace("```json", "```").strip()
            # Try to find the JSON block
            if "```" in content:
                parts = content.split("```")
                # Iterate to find the part with a dict
                for p in parts:
                    p = p.strip()
                    if p.startswith("{") and p.endswith("}"):
                        return json.loads(p)
            
            # Fallback: Find first '{' and last '}'
            start_idx = content.find("{")
            end_idx = content.rfind("}")
            if start_idx != -1 and end_idx != -1:
                return json.loads(content[start_idx:end_idx+1])
            
            # Fallback: Direct load
            return json.loads(content)
        except Exception as e:
            print(f"Failed to parse JSON: {content[:100]}... Error: {str(e)}")
            # Fallback for error handling
            return {
                "extracted_fields": {},
                "unclear_fields": [],
                "confidence_score": 0.0,
                "data": {"error": "JSON Parsing Failed", "raw_content": content}
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
