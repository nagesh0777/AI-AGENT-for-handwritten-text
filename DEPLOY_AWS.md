# Deploying to AWS EC2

This guide allows you to deploy the **Trikaar Handwriting Extraction System** to an AWS EC2 instance using Docker Compose.

## Prerequisites
- An AWS Account
- An EC2 Instance (Ubuntu 22.04 LTS recommended, t3.medium or larger for AI processing)
- SSH Key Pair

## Step 1: Prepare the EC2 Instance

1. **Launch an EC2 Instance**:
   - OS: Ubuntu 22.04 LTS
   - Instance Type: 
     - **Recommended**: `t3.medium` (2 vCPU, 4GB RAM) for stability.
     - **Minimum**: `t3.small` (2GB RAM) with **4GB Swap** configured.
     - **Experimental**: `t3.micro` (1GB RAM) *requires* 4GB+ Swap and may be slow.
   - Storage: 20GB+ gp3.
   - Security Group: Allow Inbound traffic on ports:
     - `22` (SSH)
     - `80` (HTTP - Frontend)
     - `8080` (HTTP - Backend/API, optional if accessing directly)

2. **SSH into your instance**:
   ```bash
   ssh -i "your-key.pem" ubuntu@your-ec2-ip
   ```

3. **Install Docker & Docker Compose**:
   ```bash
   # Update packages
   sudo apt-get update
   sudo apt-get install -y ca-certificates curl gnupg

   # Add Docker's official GPG key
   sudo install -m 0755 -d /etc/apt/keyrings
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
   sudo chmod a+r /etc/apt/keyrings/docker.gpg

   # Set up the repository
   echo \
     "deb [arch=\"$(dpkg --print-architecture)\" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
     $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
     sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

   # Install Docker Engine
   sudo apt-get update
   sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

   # Allow running docker without sudo
   sudo usermod -aG docker $USER
   newgrp docker
   ```

## Step 2: Deploy the Application

1. **Clone the Repository**:
   ```bash
   git clone <your-repo-url>
   cd <repo-folder>
   ```
   *(Or copy the project files if not using git)*

2. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```bash
   nano .env
   ```
   Paste your API keys and secrets:
   ```env
   OPENAI_API_KEY=sk-proj-...
   GROQ_API_KEY=gsk_...
   LANGFUSE_PUBLIC_KEY=pk-lf-...
   LANGFUSE_SECRET_KEY=sk-lf-...
   LANGFUSE_HOST=https://cloud.langfuse.com
   ```

3. **Start the Application**:
   ```bash
   docker compose up -d --build
   ```

## Step 3: Verify Deployment

- **Frontend**: Visit `http://<your-ec2-ip>`
- **Backend API**: `http://<your-ec2-ip>:8080`
- **OCR Service**: Internal only (or mapped 8001 if enabled)

## Troubleshooting

- **Logs**: View logs for all services:
  ```bash
  docker compose logs -f
  ```
- **Rebuild**: If you change code:
  ```bash
  docker compose up -d --build
  ```
- **Stop**:
  ```bash
  docker compose down
  ```
