# Project Technical Overview & Hosting Guide

## 1. Project Summary
**Trikaar Handwriting Extraction System** is an AI-powered application that digitizes handwritten forms. It takes an image of a form, extracts the text using optical character recognition (OCR), and then uses a Large Language Model (LLM) to intelligently structure that data into clean JSON, identifying fields, tables, and signatures.

## 2. Technology Stack

### **Frontend (User Interface)**
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + Lucide React (Icons)
- **Data Visualization**: AG Grid (for data tables)
- **Deployment**: Served via Nginx (Reverse Proxy) in Docker.

### **Backend (API & Logic)**
- **Framework**: Java Spring Boot 3.2
- **Language**: Java 21 (LTS)
- **Database**: H2 Database (File-based mode for persistence in Docker)
- **Architecture**: REST API, Layered Architecture (Controller -> Service -> Repository)
- **Security**: JWT (JSON Web Tokens) for future auth scaling.

### **AI & OCR Engine (The Core)**
- **Framework**: Python 3.9 + FastAPI
- **Visual OCR Model**: **EasyOCR** (PyTorch based). Uses ResNet + LSTM + CTC to read raw text from images.
- **Cognitive Model**: **Llama 3.3 70B** (via Groq API).
  - *Role*: Takes the raw, often messy text from EasyOCR and "cleans" it. It understands form structures, corrects spelling errors based on context, and formats the output into strict JSON.
- **Orchestration**: LangChain (for managing LLM prompts and flows).
- **Monitoring**: LangFuse (for tracking AI performance and costs).

## 3. Data Flow Architecture

1.  **Upload**: User uploads an image via the React Frontend.
2.  **Storage**: Spring Boot Backend saves the file to the local disk (`/app/uploads`).
3.  **Processing**:
    - Backend sends the file to the **Python OCR Engine**.
    - **Step 1 (Vision)**: EasyOCR scans the image and returns raw text chunks with coordinates.
    - **Step 2 (Intelligence)**: The raw text is sent to **Groq (Llama 3.3)** with a strict prompt to reorganize it into logical sections (e.g., "Personal Info", "Medical History").
4.  **Result**: The structured JSON is returned to the Backend, saved to the H2 Database, and displayed on the Frontend.

## 4. Hosting Requirements (AWS)

To host this on AWS, you need an **EC2 Instance**.

### **Hardware Requirements**
| Resource | Minimum (Production) | Minimum (Budget/Risky) |
| :--- | :--- | :--- |
| **Instance Type** | **t3.medium** | **t3.small** or **t3.micro** |
| **vCPU** | 2 | 2 |
| **RAM** | 4 GB | 1 GB or 2 GB |
| **Swap Space** | Not strictly needed | **MUST have 4GB+ Swap File** |
| **Disk** | 20 GB (gp3) | 15 GB |

> **Warning**: The AI models (EasyOCR) load into RAM. If you use a `t3.micro` (1GB RAM), you **must** configure a swap file or the application will crash immediately.

### **Software Prerequisites**
- **OS**: Ubuntu 22.04 LTS (Recommended)
- **Runtime**: Docker Engine & Docker Compose

## 5. Environment Variables
You must create a `.env` file on the server with these keys:

```ini
# --- AI Provider Keys (Required) ---
# OpenAI is used for LangChain internals/embeddings if needed
OPENAI_API_KEY=sk-proj-your-openai-key...

# Groq powers the main reasoning engine (Llama 3.3)
GROQ_API_KEY=gsk_your-groq-key...

# --- Monitoring (Optional but Recommended) ---
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_HOST=https://cloud.langfuse.com

# --- Database & Security (Defaults provided, change for prod) ---
# JWT_SECRET=...
```

## 6. Docker Structure
The project uses `docker-compose.yml` to orchestrate 3 containers:

1.  **`backend`**: 
    - Port: `8080`
    - Volume: `h2_data` (Stores database files), `uploads` (Stores images)
2.  **`ocr-engine`**:
    - Port: `8001`
    - Environment: `OMP_NUM_THREADS=1` (Optimized for low CPU/RAM)
3.  **`frontend`**:
    - Port: `80` (Exposed to the web)
    - Configuration: Uses `nginx.conf` to proxy `/api` requests to the backend.

## 7. Storage Persistence
- **Database**: Data is saved in a Docker Volume named `h2_data`. It persists even if containers are restarted.
- **Images**: Uploaded form images are saved in a bind mount `./backend/uploads`.

## 8. Deployment Steps (Quick/TL;DR)
1.  **Launch EC2** (Ubuntu).
2.  **Copy Project** (Git clone or SCP).
3.  **Setup Swap** (If using t3.micro/small): `bash setup_swap.sh`
4.  **Configure Env**: Create `.env` file.
5.  **Run**: `docker compose up -d --build`
6.  **Access**: `http://your-ec2-ip`
