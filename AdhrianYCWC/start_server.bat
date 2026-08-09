@echo off
title DHRYZN AI Study Mentor — Gemini 3.6 Flash Server
echo ========================================================
echo   Starting DHRYZN AI Study Mentor (Gemini 3.6 Flash)
echo ========================================================
echo.
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python was not found in your PATH.
    echo Please install Python 3 or add it to your system PATH.
    pause
    exit /b 1
)

echo Starting backend proxy on http://localhost:3000 ...
python server.py
pause
