FROM python:3.9-slim

WORKDIR /app

# Using opencv-python-headless to avoid system library dependencies.
# If easyocr still needs something, we'll see it in runtime logs.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
