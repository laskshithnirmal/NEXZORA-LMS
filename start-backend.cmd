@echo off
REM Starts the NEXZORA LMS backend (Spring Boot) on http://localhost:8080
cd /d "%~dp0backend"

if not exist ".env" (
    copy ".env.example" ".env" >nul
    echo.
    echo  Created backend\.env from .env.example.
    echo  Open backend\.env, set DB_PASSWORD to your MySQL password, then run this script again.
    echo.
    pause
    exit /b 1
)

findstr /r /c:"^DB_PASSWORD=." ".env" >nul
if errorlevel 1 (
    echo.
    echo  DB_PASSWORD is empty in backend\.env - set it to your MySQL password first.
    echo  If your MySQL user really has no password, remove this check from start-backend.cmd.
    echo.
    pause
    exit /b 1
)

echo Starting backend on http://localhost:8080 ...
call "%~dp0backend\mvnw.cmd" spring-boot:run
pause
