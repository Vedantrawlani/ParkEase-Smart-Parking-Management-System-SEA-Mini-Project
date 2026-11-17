@echo off
title ParkEase - Smart Parking Management System
echo ================================================================
echo   ParkEase - Smart Parking Management System Launcher
echo   Software Engineering & Architecture Mini Project
echo ================================================================
echo.
echo [1/2] Starting Backend REST API Server (Port 5000)...
start "ParkEase - Backend (Port 5000)" cmd /k "cd backend && npm.cmd start"

echo Waiting 3 seconds for backend initialization...
timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend Vite Application (Port 5173)...
start "ParkEase - Frontend (Port 5173)" cmd /k "cd frontend && npm.cmd run dev"

echo.
echo ================================================================
echo   Both services are now running in separate terminal windows!
echo   - Backend REST API: http://localhost:5000
echo   - Frontend Web App: http://localhost:5173
echo ================================================================
echo.
pause

