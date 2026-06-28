@echo off
setlocal enabledelayedexpansion
title MAVI MES - Controller Panel
color 0B

:MENU
cls
echo ====================================================================
echo.
echo     __  __     _    _   _ ___   __  __ _____ ____  
echo    ^|  \/  ^|   / \  ^| ^| ^| ^|_ _^| ^|  \/  ^| ____/ ___^| 
echo    ^| ^|\/^| ^|  / _ \ ^| ^| ^| ^| ^| ^|  ^| ^|\/^| ^|  _^| \___ \ 
echo    ^| ^|  ^| ^| / ___ \^| V_/ ^| ^| ^|  ^| ^|  ^| ^| ^|___ ___) ^|
echo    ^|_^|  ^|_^|/_/   \_\\_/  ^|___^| ^|_^|  ^|_^|_____^|____/ 
echo.                                                 
echo      [ Manufacturing Execution System - Smart Vision Control ]
echo ====================================================================
echo.
echo   [1] JALANKAN SISTEM (Start YOLO Python Server ^& Tauri App)
echo   [2] MATIKAN SISTEM  (Force Stop All Active Services)
echo   [3] RESTART SISTEM  (Stop All Services ^& Restart)
echo   [4] LIHAT STATUS    (Check Active Ports ^& Processes)
echo   [5] KELUAR          (Exit)
echo.
echo ====================================================================
set /p pilihan="Pilih menu [1-5]: "

if "%pilihan%"=="1" goto START_SYS
if "%pilihan%"=="2" goto STOP_SYS
if "%pilihan%"=="3" goto RESTART_SYS
if "%pilihan%"=="4" goto STATUS_SYS
if "%pilihan%"=="5" exit
goto MENU

:START_SYS
cls
echo ====================================================================
echo   MEMULAI LAYANAN MAVI MES SYSTEM
echo ====================================================================
echo.
echo [1/2] Menjalankan YOLO Python Server (Port 8000)...
start "MAVI YOLO Server" cmd /k ".venv\Scripts\python yolo_server.py"

echo [2/2] Menjalankan Tauri Desktop App (Vite Dev Server)...
echo Jendela ini akan mengunci untuk memantau logs Vite/Tauri.
echo.
npm run tauri dev
pause
goto MENU

:STOP_SYS
cls
echo ====================================================================
echo   MENGHENTIKAN LAYANAN MAVI MES SYSTEM
echo ====================================================================
echo.

echo [+] Menghentikan YOLO Python Server (Port 8000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo [+] Menghentikan Vite Dev Server (Port 5173)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo [+] Menghentikan Aplikasi Desktop (MAVI MES)...
taskkill /f /im "MAVI MES.exe" >nul 2>&1
taskkill /f /im "mavi-mes.exe" >nul 2>&1
taskkill /f /im "tauri.exe" >nul 2>&1

echo.
echo ====================================================================
echo   Selesai! Semua server dan aplikasi telah dihentikan.
echo ====================================================================
echo.
pause
goto MENU

:RESTART_SYS
cls
echo ====================================================================
echo   RESTARTING MAVI MES SYSTEM
echo ====================================================================
echo.
echo [+] Menghentikan layanan berjalan...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do (
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do (
    taskkill /f /pid %%a >nul 2>&1
)
taskkill /f /im "MAVI MES.exe" >nul 2>&1
taskkill /f /im "mavi-mes.exe" >nul 2>&1
taskkill /f /im "tauri.exe" >nul 2>&1
timeout /t 2 >nul

echo [+] Memulai kembali layanan...
start "MAVI YOLO Server" cmd /k ".venv\Scripts\python yolo_server.py"
echo.
npm run tauri dev
pause
goto MENU

:STATUS_SYS
cls
echo ====================================================================
echo   STATUS PORT ^& LAYANAN MAVI MES
echo ====================================================================
echo.
echo [+] Status Port 8000 (YOLO Server):
netstat -aon | findstr :8000 >nul 2>&1
if %errorlevel% neq 0 (
    echo   [OFFLINE] Server Python tidak aktif.
) else (
    echo   [ONLINE] Server Python aktif.
)
echo.
echo [+] Status Port 5173 (Vite Server):
netstat -aon | findstr :5173 >nul 2>&1
if %errorlevel% neq 0 (
    echo   [OFFLINE] Server Vite tidak aktif.
) else (
    echo   [ONLINE] Server Vite aktif.
)
echo.
echo [+] Status Proses Desktop (MAVI MES):
tasklist | findstr /i "mavi" >nul 2>&1
if %errorlevel% neq 0 (
    echo   [OFFLINE] Aplikasi Desktop tidak berjalan.
) else (
    echo   [ONLINE] Aplikasi Desktop sedang berjalan.
)
echo.
echo ====================================================================
pause
goto MENU
