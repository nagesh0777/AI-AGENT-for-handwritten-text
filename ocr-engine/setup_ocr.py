
import easyocr
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def setup():
    logger.info("Initializing EasyOCR and downloading models if missing...")
    # This will trigger the download of English models
    reader = easyocr.Reader(['en']) 
    logger.info("EasyOCR is ready.")

if __name__ == "__main__":
    setup()
