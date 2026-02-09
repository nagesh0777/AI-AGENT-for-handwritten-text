import requests
import json
import base64
from pathlib import Path

# Test the extraction endpoint
def test_extraction():
    # Find a test image
    test_images = list(Path(".").glob("*.jpg")) + list(Path(".").glob("*.png"))
    
    if not test_images:
        print("No test images found. Please add a .jpg or .png file to the ocr-engine directory.")
        return
    
    test_image = test_images[0]
    print(f"Testing with image: {test_image}")
    
    # Read and encode image
    with open(test_image, "rb") as f:
        image_data = base64.b64encode(f.read()).decode()
    
    # Send to API
    url = "http://localhost:8001/process"
    files = {"file": (test_image.name, open(test_image, "rb"), "image/jpeg")}
    
    print("\nSending request to OCR engine...")
    response = requests.post(url, files=files)
    
    if response.status_code == 200:
        result = response.json()
        print("\n✅ SUCCESS! Response received:")
        print(json.dumps(result, indent=2))
        
        # Check the structure
        if "data" in result:
            data = result["data"]
            print("\n📊 Data Structure Analysis:")
            print(f"  - document_type: {data.get('document_type', 'MISSING')}")
            print(f"  - summary: {data.get('summary', 'MISSING')}")
            print(f"  - sections: {len(data.get('sections', []))} sections found")
            
            if "sections" in data:
                for i, section in enumerate(data["sections"]):
                    print(f"\n  Section {i+1}: {section.get('section_name', 'UNNAMED')}")
                    fields = section.get("fields", [])
                    print(f"    - {len(fields)} fields")
                    for field in fields[:3]:  # Show first 3 fields
                        print(f"      • {field.get('field_name', '?')}: {field.get('field_value', '?')}")
            else:
                print("\n❌ ERROR: No 'sections' key in data!")
                print("Available keys:", list(data.keys()))
        else:
            print("\n❌ ERROR: No 'data' key in response!")
            print("Available keys:", list(result.keys()))
    else:
        print(f"\n❌ ERROR: Request failed with status {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    test_extraction()
