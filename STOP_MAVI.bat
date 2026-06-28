@echo off
title MAVI MES - Shutdown Controller
cd /d "%~dp0"
echo ===================================================
echo   MAVI MES - INDUSTRIAL VISION SYSTEM SHUTDOWN
echo ===================================================
echo.

echo Menghentikan YOLO Python Server (Port 8000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo Menghentikan Vite Dev Server (Port 5173)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo Menghentikan Aplikasi Desktop (MAVI MES)...
taskkill /f /im "MAVI MES.exe" >nul 2>&1
taskkill /f /im "mavi-mes.exe" >nul 2>&1
taskkill /f /im "tauri.exe" >nul 2>&1

echo.
echo ===================================================
echo   Selesai! Semua server dan aplikasi telah dimatikan.
echo ===================================================
echo.
timeout /t 3 >nul
