@echo off
:: ==============================================================================
:: MAVI MES - TULIP-STYLE DEDICATED FRONTLINE PLAYER (WINDOWS DESKTOP & KIOSK)
:: ==============================================================================
title Mavi Tulip Frontline Player
color 0b
cls

echo ==============================================================================
echo       MAVI FRONTLINE MES PLAYER - DEDICATED INDUSTRIAL RUNTIME
echo ==============================================================================
echo.

set BASE_DIR=%~dp0
set PLAYER_PORT=5173
set PLAYER_URL=http://localhost:%PLAYER_PORT%/#/tulip-player

:: 1. Prioritas Utama: Jalankan Native Desktop .EXE jika ada
if exist "%BASE_DIR%MaviPlayer.exe" (
    echo [1/2] Ditemukan Native Desktop EXE: MaviPlayer.exe
    echo [2/2] Meluncurkan Native Desktop Player (.EXE)...
    start "" "%BASE_DIR%MaviPlayer.exe"
    goto DONE
)

:: 2. Jika MaviPlayer.exe belum dicopy, cek apakah release app.exe ada di src-tauri
if exist "%BASE_DIR%src-tauri\target\release\app.exe" (
    echo [1/2] Ditemukan Native Desktop Binary di src-tauri...
    echo [2/2] Meluncurkan Native Desktop Player (.EXE)...
    start "" "%BASE_DIR%src-tauri\target\release\app.exe"
    goto DONE
)

:: 3. Alternatif Kiosk Mode: Google Chrome / Edge
echo [1/2] Menyiapkan Industrial Kiosk Mode via Browser Engine...

if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    echo [OK] Menjalankan Google Chrome Industrial Kiosk...
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app="%PLAYER_URL%" --start-fullscreen --disable-pinch --overscroll-history-navigation=0 --no-first-run
    goto DONE
)

if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    echo [OK] Menjalankan Google Chrome (x86) Industrial Kiosk...
    start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --app="%PLAYER_URL%" --start-fullscreen --disable-pinch --overscroll-history-navigation=0 --no-first-run
    goto DONE
)

if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    echo [OK] Menjalankan Microsoft Edge Industrial Kiosk...
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app="%PLAYER_URL%" --start-fullscreen --no-first-run
    goto DONE
)

if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe" (
    echo [OK] Menjalankan Microsoft Edge 64-bit Industrial Kiosk...
    start "" "C:\Program Files\Microsoft\Edge\Application\msedge.exe" --app="%PLAYER_URL%" --start-fullscreen --no-first-run
    goto DONE
)

:: 4. Fallback Default Browser
echo [INFO] Menjalankan via default browser...
start "" "%PLAYER_URL%"

:DONE
echo.
echo ==============================================================================
echo Tulip Frontline Player berhasil diluncurkan!
echo - Mode Native EXE / Kiosk aktif.
echo - Tidak ada menu builder atau address bar browser.
echo ==============================================================================
timeout /t 3 /nobreak >nul
exit
