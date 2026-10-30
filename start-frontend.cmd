@echo off
REM Starts the NEXZORA LMS frontend (React + Vite) on http://localhost:5173
cd /d "%~dp0frontend"

if not exist "node_modules" (
    echo Installing frontend dependencies - first run only...
    call npm install
    if errorlevel 1 (
        echo npm install failed.
        pause
        exit /b 1
    )
)

echo Starting frontend on http://localhost:5173 ...
call npm run dev
pause
