@echo off
REM Opens the backend and frontend in two separate windows.
start "NEXZORA Backend" cmd /k "%~dp0start-backend.cmd"
start "NEXZORA Frontend" cmd /k "%~dp0start-frontend.cmd"
echo Backend and frontend are starting in separate windows.
echo When both are ready, open http://localhost:5173
