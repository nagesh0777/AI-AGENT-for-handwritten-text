#!/bin/bash

# Configuration
VERSION="v1.0.0"
PROJECT_NAME="trikaar-form-extraction"

echo "🚀 Starting Production Build for $PROJECT_NAME ($VERSION)..."

# 1. Build the images
docker compose build --pull

# 2. (Optional) Save images to tar for manual transfer if not using registry
echo "📦 Packaging images to .tar files for transfer..."
mkdir -p ./deploy_pkg

docker save task-frontend:latest | gzip > ./deploy_pkg/frontend.tar.gz
docker save task-backend:latest | gzip > ./deploy_pkg/backend.tar.gz
docker save task-ocr-engine:latest | gzip > ./deploy_pkg/ocr-engine.tar.gz

# 3. Copy docker-compose and .env template
cp docker-compose.yml ./deploy_pkg/
echo "OPENAI_API_KEY=" > ./deploy_pkg/.env.example
echo "GROQ_API_KEY=" >> ./deploy_pkg/.env.example

echo "✅ Build and packaging complete!"
echo "📍 Location: ./deploy_pkg/"
echo "🔗 Next Steps: Upload 'deploy_pkg' to EC2, run 'docker load' for each .tar.gz, and 'docker compose up -d'"
