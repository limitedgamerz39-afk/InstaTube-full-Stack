#!/bin/bash

echo "Starting D4D HUB Self-Hosted Services..."
echo

echo "1. Starting MongoDB (if not already running)"
echo "   Make sure MongoDB is running on localhost:27017"
echo

echo "2. Starting MinIO"
gnome-terminal --title="MinIO" --command="bash -c 'minio server ~/minio-data --address :9000; exec bash'" &
sleep 5

echo "3. Starting Backend Server"
cd backend
gnome-terminal --title="Backend" --command="bash -c 'npm start; exec bash'" &
sleep 5

echo "4. Starting Frontend Server"
cd ../frontend
gnome-terminal --title="Frontend" --command="bash -c 'npm run dev; exec bash'" &

echo
echo "All services started!"
echo
echo "Access your application at:"
echo "Web App: http://localhost:5001"
echo "Backend API: http://localhost:3000"
echo
echo "For external access, use your public IP address"
echo "Web App: http://YOUR_PUBLIC_IP:5001"
echo "Backend API: http://YOUR_PUBLIC_IP:3000"
echo "MinIO: http://YOUR_PUBLIC_IP:9000"
echo
echo "Press Enter to exit..."
read