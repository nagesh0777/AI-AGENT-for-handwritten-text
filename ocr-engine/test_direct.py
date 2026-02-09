import asyncio
import sys
sys.path.insert(0, '.')

from main import agent
from PIL import Image
import io

async def test():
    # Load test image
    with open("test.jpg", "rb") as f:
        image_bytes = f.read()
    
    print("Starting extraction...")
    result = await agent.process(image_bytes, "test.jpg")
    
    print("\n" + "="*80)
    print("EXTRACTION RESULT:")
    print("="*80)
    print(f"Status: {result.get('status')}")
    print(f"Filename: {result.get('filename')}")
    
    if "data" in result:
        data = result["data"]
        print(f"\nDocument Type: {data.get('document_type')}")
        print(f"Summary: {data.get('summary')}")
        print(f"\nSections: {len(data.get('sections', []))}")
        
        for i, section in enumerate(data.get("sections", [])[:5]):  # Show first 5 sections
            print(f"\n  [{i+1}] {section.get('section_name', 'UNNAMED')}")
            for field in section.get("fields", [])[:5]:  # Show first 5 fields per section
                fname = field.get("field_name", "?")
                fval = field.get("field_value", "?")
                print(f"      • {fname}: {fval}")
    else:
        print(f"\nERROR: {result.get('error', 'Unknown error')}")

if __name__ == "__main__":
    asyncio.run(test())
