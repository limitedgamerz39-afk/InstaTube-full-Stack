@echo off
echo 🚀 Starting InstaTube Setup...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker first.
    pause
    exit /b 1
)

echo ✅ Docker is installed.

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

echo ✅ Docker Compose is installed.

REM Create necessary directories
echo 📁 Creating directories...
mkdir backups 2>nul
mkdir logs 2>nul

REM Build and start services
echo 🏗️ Building and starting services...
docker-compose up -d

REM Wait for services to start
echo ⏳ Waiting for services to start...
timeout /t 30 /nobreak >nul

REM Check service status
echo 🔍 Checking service status...
docker-compose ps

echo ✅ Setup completed!
echo.
echo Next steps:
echo 1. Access the MinIO console at http://localhost:9001
echo 2. Log in with credentials from docker-compose.yml
echo 3. Create a bucket named "d4dhub"
echo 4. Access the application at http://localhost:5001
echo.
echo For more details, check the DEPLOYMENT_GUIDE.md file.
pause