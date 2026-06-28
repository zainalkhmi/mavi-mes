@echo off
title MAVI MES - Startup Controller
cd /d "%~dp0"
echo ===================================================
echo   MAVI MES - INDUSTRIAL VISION SYSTEM STARTUP
echo ===================================================
echo.

echo [1/2] Menjalankan YOLO Python Server (Port 8000)...
start "MAVI YOLO Server" cmd /k ".venv\Scripts\python yolo_server.py"

echo [2/2] Menjalankan Tauri Desktop App (Vite Dev Server)...
npm run tauri dev

echo.
echo Aplikasi sedang berjalan. Tekan tombol sembarang untuk keluar dari launcher ini.
pause
