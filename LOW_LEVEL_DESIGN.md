# Low-Level Design (LLD)
## Handwritten Form Extraction System

---

## 1. Database Design

### 1.1 Entity Relationship Diagram (ERD)

```
Users (1) ----< (N) Forms (1) ----< (N) ExtractedData
Forms (1) ----< (N) ProcessingLogs
```

### 1.2 Database Schema (MySQL)

```sql
-- Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Forms Table
CREATE TABLE forms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(20) NOT NULL,
    file_size INT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Extracted Data Table
CREATE TABLE extracted_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    form_id INT NOT NULL,
    raw_text TEXT,
    structured_json JSON NOT NULL,
    confidence_score DECIMAL(5,2),
    extracted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    validated BOOLEAN DEFAULT false,
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
);

-- Processing Logs Table
CREATE TABLE processing_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    form_id INT NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    status VARCHAR(20),
    execution_time_ms INT,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
);

-- Indexes for Performance
CREATE INDEX idx_forms_user_id ON forms(user_id);
CREATE INDEX idx_forms_status ON forms(status);
CREATE INDEX idx_extracted_data_form_id ON extracted_data(form_id);
CREATE INDEX idx_processing_logs_form_id ON processing_logs(form_id);
```

---

## 2. API Specification

### 2.1 Authentication Endpoints

**POST /api/auth/register**
```json
Request:
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response (201):
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

**POST /api/auth/login**
```json
Request:
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response (200):
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com"
    }
  }
}
```

### 2.2 Form Processing Endpoints

**POST /api/forms/upload**
```
Headers:
  Authorization: Bearer <token>
  Content-Type: multipart/form-data

Response (202):
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "form_id": 123,
    "filename": "form_001.jpg",
    "status": "processing"
  }
}
```

**GET /api/forms/{id}/status**
```json
Response (200):
{
  "success": true,
  "data": {
    "form_id": 123,
    "status": "completed",
    "progress": 100
  }
}
```

**GET /api/forms/{id}/results**
```json
Response (200):
{
  "success": true,
  "data": {
    "form_id": 123,
    "extracted_data": {
      "fields": [
        {
          "label": "Name",
          "value": "John Doe",
          "confidence": 0.95
        }
      ]
    },
    "confidence_score": 91.67
  }
}
```

---

## 3. AI Agent Workflow (Java / LangChain4j)

The AI Agent is implemented entirely in Java using **LangChain4j** for LLM orchestration and the **Google Cloud Vision Java Client** for OCR.

### 3.1 Agent Service Logic

```java
@Service
public class AIAgentService {
    // Orchestrates Preprocessing -> OCR -> Extraction -> Validation
}
```

See **AI_AGENT_WORKFLOW.md** for the complete Java-based implementation logic.

---

## 4. LangFuse Integration (Java)

Tracing is implemented using the **LangChain4j-LangFuse** integration or the **LangFuse Java SDK**.

### 4.1 Setup

```java
Langfuse langfuse = new Langfuse(
    System.getenv("LANGFUSE_PUBLIC_KEY"),
    System.getenv("LANGFUSE_SECRET_KEY"),
    "https://cloud.langfuse.com"
);
```

### 4.2 Instrumentation

LangChain4j automatically logs traces to LangFuse when configured with the appropriate metadata.

---

## 6. Backend Service Implementation (Java Spring Boot)

### 6.1 Project Structure

```
backend/
├── src/main/java/com/app/
│   ├── Application.java
│   ├── config/
│   │   ├── SecurityConfig.java
│   │   ├── AppConfig.java
│   │   └── StorageConfig.py
│   ├── controller/
│   │   ├── AuthController.java
│   │   └── FormController.java
│   ├── model/
│   │   ├── User.java
│   │   ├── Form.java
│   │   └── ExtractedData.java
│   ├── repository/
│   │   ├── UserRepository.java
│   │   ├── FormRepository.java
│   │   └── ExtractedDataRepository.java
│   ├── service/
│   │   ├── AuthService.java
│   │   ├── StorageService.java
│   │   └── AIAgentService.java
│   └── dto/
│       ├── AuthRequest.java
│       ├── FormResponse.java
│       └── SuccessResponse.java
├── src/main/resources/
│   ├── application.properties
│   └── credentials.json
├── pom.xml
└── Dockerfile
```

### 6.2 Form Controller (controller/FormController.java)

```java
@RestController
@RequestMapping("/api/forms")
public class FormController {

    @Autowired
    private FormService formService;
    
    @Autowired
    private AIAgentService aiAgentService;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadForm(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        
        // Validate file
        if (file.isEmpty()) return ResponseEntity.badRequest().body("File is empty");
        
        // Save form record
        Form form = formService.saveForm(file, currentUser.getId());
        
        // Trigger AI Agent asynchronously
        CompletableFuture.runAsync(() -> {
            aiAgentService.processForm(form);
        });

        return ResponseEntity.accepted().body(new SuccessResponse("Upload successful", form.getId()));
    }

    @GetMapping("/{id}/status")
    public ResponseEntity<?> getStatus(@PathVariable Long id) {
        Form form = formService.getForm(id);
        return ResponseEntity.ok(new FormStatusDto(form));
    }
}
```

---

## 7. Frontend Components

### 7.1 React Component Structure

```
src/
├── components/
│   ├── FileUpload.jsx
│   ├── ProgressBar.jsx
│   ├── ResultsView.jsx
│   └── TableView.jsx
├── pages/
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   └── History.jsx
├── services/
│   └── api.js
└── App.jsx
```

### 7.2 Key Component Examples

See FRONTEND_COMPONENTS.md for detailed implementations

---

## 8. Deployment

### 8.1 Docker Compose Configuration

```yaml
version: '3.8'

services:
  db:
    image: mysql:8.0
    container_name: form_extraction_db
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: form_extraction
      MYSQL_USER: formapp
      MYSQL_PASSWORD: securepassword123
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - app_network

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: form_extraction_backend
    environment:
      DATABASE_URL: mysql://formapp:securepassword123@db:3306/form_extraction
    ports:
      - "8000:8000"
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
```

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-06  
**Prepared For**: Riyaz Review (Due: Tomorrow 12:30 PM)
