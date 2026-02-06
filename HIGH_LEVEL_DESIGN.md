# High-Level Design (HLD)
## Handwritten Form Extraction System

---

## 1. System Overview

### 1.1 Purpose
Develop a web-based application that enables users to upload handwritten forms (images/PDFs) and automatically extract handwritten content using AI, converting it into structured data (JSON/Table format) for display and export.

### 1.2 Scope
- **Frontend**: React-based web application for file upload, progress tracking, and data visualization
- **Backend**: RESTful API service for file management and orchestration
- **AI Agent**: LangGraph/LangChain-based intelligent agent for handwriting recognition and data extraction
- **Database**: Persistent storage for forms, extracted data, and user information
- **Monitoring**: LangFuse integration for agent observability and performance tracking

---

## 2. System Architecture

### 2.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         React Frontend (Web Application)                  │  │
│  │  - File Upload Component                                  │  │
│  │  - Progress Tracker                                       │  │
│  │  - Data Visualization (Table/JSON View)                   │  │
│  │  - Export Functionality                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTPS/REST API
┌─────────────────────────────────────────────────────────────────┐
│                    GATEWAY LAYER (Spring Boot)                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Backend Orchestrator                              │  │
│  │  - Auth (JWT) & File Storage                              │  │
│  │  - MySQL Persistence (Job Status/Metadata)                │  │
│  │  - Python Engine Orchestration                            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕ REST API (HTTP)
┌─────────────────────────────────────────────────────────────────┐
│                    OCR ENGINE LAYER (Python)                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  1. Pre-Processing (OpenCV: Contrast, Threshold)    │  │  │
│  │  │  2. OCR Engine (Google Vision / Tesseract)          │  │  │
│  │  │  3. Post-Processing (Clean-up)                     │  │  │
│  │  │  4. Prompt Encoding (LLM Context Preparation)       │  │  │
│  │  │  5. LLM Extraction (GPT-4o/Claude)                 │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                   MONITORING LAYER                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              LangFuse (Observability)                     │  │
│  │  - Agent Execution Traces                                 │  │
│  │  - Performance Metrics                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          Database (PostgreSQL/MongoDB)                    │  │
│  │  - User Data                                              │  │
│  │  - Uploaded Forms Metadata                                │  │
│  │  - Extracted Structured Data                              │  │
│  │  - Processing History & Audit Logs                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          File Storage (S3/Azure Blob/Local)               │  │
│  │  - Original Uploaded Files                                │  │
│  │  - Processed Images                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

### 3.1 Frontend
- **Framework**: React.js (v18+)
- **State Management**: Zustand / Shadcn UI
- **File Upload**: react-dropzone
- **HTTP Client**: Axios

### 3.2 Gateway Backend (Java)
- **Framework**: Spring Boot 3.x
- **Language**: Java 17
- **Security**: Spring Security + JWT
- **Persistence**: Spring Data JPA + MySQL
- **Communication**: RestTemplate (to call OCR Engine)

### 3.3 OCR Engine (Python)
- **Framework**: FastAPI (High Performance)
- **Image Processing**: OpenCV, Pillow
- **AI/LLM**: LangChain, LangGraph
- **OCR**: Google Cloud Vision API / Pytesseract
- **Monitoring**: LangFuse Python SDK

### 3.4 Database & Infrastructure
- **MySQL**: Persistent storage for users, forms, and results.
- **Docker**: Containerization for all services.
- **S3/Local Storage**: Storage for uploaded form images.

### 3.4 Database
- **Relational**: MySQL 8.0+ (for structured data, metadata)
- **Document Store**: MongoDB (alternative for flexible schema)
- **Caching**: Redis (optional, for performance)

### 3.5 Storage
- **Cloud**: AWS S3 / Azure Blob Storage / Google Cloud Storage
- **Local**: File system (for development)

### 3.6 DevOps
- **Containerization**: Docker
- **Orchestration**: Docker Compose

---

## 4. System Components

### 4.1 Frontend Component
**Responsibilities:**
- Provide user-friendly interface for file upload
- Display upload progress with real-time feedback
- Visualize extracted data in table and JSON formats
- Enable data export (CSV, JSON, Excel)
- Handle authentication and authorization

**Key Features:**
- Drag-and-drop file upload
- Multi-file upload support
- Progress indicators
- Data grid with filtering and sorting
- Export buttons
- Error handling and notifications

### 4.2 Backend API Component
**Responsibilities:**
- Handle file upload via REST endpoints
- Validate file types and sizes
- Store files temporarily
- Orchestrate AI Agent processing
- Format and return structured responses
- Persist data to database
- Manage user sessions

**Key Endpoints:**
- `POST /api/upload` - Upload form image/PDF
- `GET /api/status/{id}` - Check processing status
- `GET /api/results/{id}` - Retrieve extracted data
- `POST /api/export/{id}` - Export data in specified format
- `GET /api/history` - Get user's processing history

### 4.3 AI Agent Component
**Responsibilities:**
- Process uploaded images/PDFs
- Extract handwritten text using OCR
- Structure extracted data intelligently
- Validate and clean extracted information
- Convert to JSON/Table format

**Agent Workflow (LangGraph):**
1. **Input Node**: Receive image/PDF file
2. **Preprocessing Node**: Image enhancement, noise reduction
3. **OCR Node**: Extract handwritten text
4. **Extraction Node**: Identify form fields and values
5. **Structuring Node**: Organize data into JSON schema
6. **Validation Node**: Quality checks and confidence scoring
7. **Output Node**: Return structured data

### 4.4 Database Component
**Responsibilities:**
- Store user information
- Store form metadata (filename, upload date, status)
- Store extracted structured data
- Maintain audit logs

**Key Entities:**
- Users
- Forms
- ExtractedData
- ProcessingLogs

### 4.5 Monitoring Component (LangFuse)
**Responsibilities:**
- Track AI agent execution traces
- Monitor performance metrics (latency, accuracy)
- Capture errors and exceptions
- Analyze costs (API calls, tokens used)
- Provide debugging insights

---

## 5. Data Flow

### 5.1 End-to-End Flow

```
1. User uploads handwritten form → Frontend
2. Frontend sends file to Backend API → POST /api/upload
3. Backend validates file and stores temporarily
4. Backend triggers AI Agent processing
5. AI Agent:
   a. Preprocesses image
   b. Performs OCR
   c. Extracts and structures data
   d. Validates output
   e. Returns JSON/Table format
6. Backend saves extracted data to Database
7. Backend returns processing result to Frontend
8. Frontend displays structured data in table/JSON view
9. User can export data in desired format
```

### 5.2 LangFuse Integration Flow

```
1. AI Agent starts processing → LangFuse trace initiated
2. Each node execution → Logged to LangFuse
3. LLM API calls → Tracked (tokens, latency, cost)
4. Agent completes → Trace finalized with metrics
5. Dashboard → Real-time monitoring and analysis
```

---

## 6. Key Design Decisions

### 6.1 Why LangGraph?
- **State Management**: Better control over multi-step agent workflows
- **Graph-based**: Explicit node definitions for each processing step
- **Observability**: Native LangFuse integration for monitoring
- **Scalability**: Easy to add new nodes or modify workflow

### 6.2 Why Java Spring Boot (Recommended Backend)?
- **Enterprise Grade**: Robust ecosystem and mature libraries.
- **Spring AI**: Emerging support for AI integrations.
- **Type Safety**: Strong typing and compile-time checks.
- **Security**: mature Spring Security framework for JWT and RBAC.

### 6.3 Database Choice
- **MySQL**: Recommended for structured data with ACID compliance
- **MongoDB**: Alternative if schema flexibility is needed

### 6.4 OCR Strategy
- **Hybrid Approach**: 
  - Primary: Google Vision API / Azure Computer Vision (accuracy)
  - Fallback: Tesseract OCR (cost-effective)
  - Enhancement: GPT-4 Vision for context understanding

---

## 7. Non-Functional Requirements

### 7.1 Performance
- File upload: < 30 seconds for images up to 10MB
- Processing time: < 60 seconds per form
- Concurrent users: Support 50+ simultaneous uploads

### 7.2 Security
- HTTPS for all communications
- JWT-based authentication
- File type validation (prevent malicious uploads)
- Input sanitization
- RBAC (Role-Based Access Control)

### 7.3 Scalability
- Horizontal scaling for backend services
- Queue-based processing for high load
- CDN for static assets

### 7.4 Reliability
- 99.5% uptime target
- Automated error recovery
- Database backups (daily)
- Retry mechanism for failed OCR calls

### 7.5 Observability
- LangFuse for AI agent monitoring
- Application logs (structured logging)
- Performance metrics (APM tools)
- Error tracking (Sentry / CloudWatch)

---

## 8. Deployment Architecture

### 8.1 Development Environment
- Local Docker Compose setup
- PostgreSQL container
- Backend API container
- Frontend dev server
- Redis container (optional)

### 8.2 Production Environment
- **Frontend**: Deployed on Vercel / Netlify / S3 + CloudFront
- **Backend**: AWS EC2 / Azure App Service / Google Cloud Run
- **Database**: AWS RDS PostgreSQL / Azure Database
- **Storage**: AWS S3 / Azure Blob
- **Monitoring**: LangFuse Cloud / Self-hosted


---

## 9. Efficiency and Performance Analysis

### 9.1 Quality of Extraction
The system's core intelligence relies on **GPT-4o** and **Google Cloud Vision**. Since these are API-based services, the **accuracy and quality remains 100% identical** to a Python-based implementation.

### 9.2 Execution Efficiency
| Metric | Java Spring Boot (Proposed) | Python/FastAPI (Typical) |
|--------|----------------------------|-------------------------|
| **Concurrency** | True multi-threading / Virtual Threads (Scales better) | Async/Event Loop (GIL limited for CPU tasks) |
| **Startup Time** | Moderate (optimized via JVM) | Fast |
| **Long-running Stability** | High (Enterprise-grade GC) | Moderate |
| **Memory Management** | Robust Heap management | Higher overhead per worker process |

### 9.3 Developer & Operational Efficiency
- **Single Runtime**: Only the JVM is required in production, reducing Docker image complexity.
- **Unified CI/CD**: One build tool (Maven/Gradle) and one testing framework (JUnit).
- **Interop**: Direct calling of AI services without JSON-over-HTTP overhead between backend and agent.

---

## 10. Risks and Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| OCR accuracy issues | High | Use multiple OCR providers, implement validation layer |
| High API costs | Medium | Implement caching, rate limiting, cost monitoring |
| Scalability bottlenecks | High | Queue-based processing, horizontal scaling |
| Data privacy concerns | High | Encryption at rest/transit, GDPR compliance |
| Agent debugging complexity | Medium | LangFuse integration for full observability |

---

## 10. Success Metrics

- **Accuracy**: > 90% OCR accuracy on test dataset
- **Performance**: < 60 seconds average processing time
- **Reliability**: < 1% error rate
- **User Satisfaction**: Positive feedback on UI/UX
- **Cost Efficiency**: < $0.10 per form processed

---

## 11. Future Enhancements

1. **Batch Processing**: Upload and process multiple forms simultaneously
2. **Template Learning**: AI learns from user corrections to improve accuracy
3. **Multi-language Support**: Recognize handwriting in different languages
4. **Mobile App**: Native iOS/Android applications
5. **Advanced Analytics**: Insights dashboard for processed forms
6. **API Access**: Allow third-party integrations
7. **Collaborative Features**: Share and collaborate on form data

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-06  
**Prepared For**: Riyaz Review (Due: Tomorrow 12:30 PM)
