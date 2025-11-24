@echo off
echo Starting Redis Server...
cd /d "D:\New folder\InstaTube-full-Stack\redis"
.\redis-server.exe --service-start
echo Redis Server started successfully!
timeout /t 2 /nobreak >nul