# 🚀 Local Development - Quick Start Guide

## ✅ Services Running

### Backend (Spring Boot) - Port 8080
- **Status**: ✅ Running
- **Main Class**: `com.app.FormExtractionApplication`
- **Database**: H2 In-Memory (Console: http://localhost:8080/h2-console)
- **Config**: `application.properties`

### OCR Engine (Python/FastAPI) - Port 8001
- **Status**: ⚠️ Needs API Keys
- **Docs**: http://localhost:8001/docs (when running)

## 🔧 Setup Instructions

### 1. Configure Python OCR Engine
```bash
cd ocr-engine
cp .env.example .env
# Edit .env and add your API keys:
# - OPENAI_API_KEY
# - LANGFUSE_PUBLIC_KEY (optional)
# - LANGFUSE_SECRET_KEY (optional)
```

### 2. Start OCR Engine
```bash
cd ocr-engine
python main.py
```

### 3. Start Backend (Already Running)
```bash
cd backend
mvn spring-boot:run
```

## 📝 API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login and get JWT token

### Forms
- POST `/api/forms/upload` - Upload form image (requires JWT)
- GET `/api/forms/history` - Get processing history (requires JWT)
- GET `/api/forms/{id}/results` - Get extraction results (requires JWT)

## 🧪 Test the System

1. **Register a user**:
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
```

2. **Login**:
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

3. **Upload a form** (use token from login):
```bash
curl -X POST http://localhost:8080/api/forms/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@path/to/your/image.jpg"
```

## 🗄️ Database Access
- URL: http://localhost:8080/h2-console
- JDBC URL: `jdbc:h2:mem:formdb`
- Username: `sa`
- Password: (leave empty)

## 📊 Architecture
```
React Frontend (Port 3000)
    ↓
Spring Boot Gateway (Port 8080)
    ↓
Python OCR Engine (Port 8001)
    ↓
OpenAI GPT-4o + LangFuse
```
