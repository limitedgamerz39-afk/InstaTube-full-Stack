@echo off
echo Starting friendflix Self-Hosted Services...
echo.

echo 1. Starting MongoDB (if not already running)
echo    Make sure MongoDB is running on localhost:27017
echo.

echo 2. Starting MinIO
start "MinIO" cmd /k "minio server D:\minio-data --address :9000"
timeout /t 5 /nobreak >nul

echo 3. Starting Backend Server
cd backend
start "Backend" cmd /k "npm start"
timeout /t 5 /nobreak >nul

echo 4. Starting Frontend Server
cd ../frontend
start "Frontend" cmd /k "npm run dev"

echo.
echo All services started!
echo.
echo Access your application at:
echo Web App: http://localhost:5001
echo Backend API: http://localhost:3000
echo.
echo For external access, use your public IP address
echo Web App: http://YOUR_PUBLIC_IP:5001
echo Backend API: http://YOUR_PUBLIC_IP:3000
echo MinIO: http://YOUR_PUBLIC_IP:9000
echo.
echo Press any key to exit...
pause >nul