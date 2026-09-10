@echo off
title MAVI MES - Playwright E2E Test Center
echo ========================================================
echo   MAVI MES - Playwright E2E Testing Suite (Standalone)
echo ========================================================
echo.
echo Membuka Playwright Interactive Test UI...
echo (Pastikan aplikasi Vite dev server berjalan di http://localhost:5173)
echo.
npx playwright test --ui
pause
