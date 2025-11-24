@echo off
echo Stopping Redis Server...
cd /d "D:\New folder\InstaTube-full-Stack\redis"
.\redis-server.exe --service-stop
echo Redis Server stopped successfully!
timeout /t 2 /nobreak >nul