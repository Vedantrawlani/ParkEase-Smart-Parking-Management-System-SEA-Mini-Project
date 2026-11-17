Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  ParkEase - Smart Parking Management System Launcher" -ForegroundColor Cyan
Write-Host "  Software Engineering & Architecture Mini Project" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/2] Starting Backend REST API Server on Port 5000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm.cmd start"

Start-Sleep -Seconds 3

Write-Host "[2/2] Starting Frontend Vite App on Port 5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm.cmd run dev"

Write-Host ""
Write-Host "Both services are now running in separate windows!" -ForegroundColor Green
Write-Host " - Backend:  http://localhost:5000" -ForegroundColor White
Write-Host " - Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""

