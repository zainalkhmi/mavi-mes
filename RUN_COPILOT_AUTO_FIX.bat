@echo off
title MAVI MES - Autonomous Copilot + Playwright Auto-Fix Loop
echo ==============================================================================
echo   MAVI MES - Autonomous Copilot + Playwright Self-Healing Loop
echo ==============================================================================
echo.
echo Menjalankan Autonomous Test-and-Fix Loop...
echo Sistem akan menguji aplikasi, mendeteksi error, memperbaiki kode otomatis,
echo dan mengulanginya sampai semua pengujian 100%% LOLOS!
echo.
node scripts/copilot-test-and-fix.mjs %*
pause
