@echo off
REM D4D HUB Production Deployment Script

echo 🚀 Starting D4D HUB Production Deployment...

REM Check if docker-compose.prod.yml exists
if not exist "docker-compose.prod.yml" (
    echo ❌ Error: docker-compose.prod.yml not found!
    exit /b 1
)

REM Stop existing services
echo ⏹️ Stopping existing services...
docker-compose -f docker-compose.prod.yml down

REM Pull latest images
echo ⬇️ Pulling latest images...
docker-compose -f docker-compose.prod.yml pull

REM Build services
echo 🏗️ Building services...
docker-compose -f docker-compose.prod.yml build

REM Start services
echo ▶️ Starting services...
docker-compose -f docker-compose.prod.yml up -d

REM Wait for services to be healthy
echo ⏳ Waiting for services to be healthy...
timeout /t 30 /nobreak >nul

REM Check service status
echo ✅ Checking service status...
docker-compose -f docker-compose.prod.yml ps

echo 🎉 Deployment completed!
echo.
echo 📝 Next steps:
echo 1. Set up Nginx reverse proxy with SSL certificates
echo 2. Configure your domain DNS records to point to this server
echo 3. Test your deployment at https://d4dhub.com
echo 4. Check logs with: docker-compose -f docker-compose.prod.yml logs -f