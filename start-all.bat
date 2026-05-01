@echo off
title Divergente - Launcher
echo Launching Divergente...

start "Divergente - Backend" cmd /k "cd /d "%~dp0fortress-vault-api" && .\bin\server.exe"
timeout /t 2 /nobreak >nul
start "Divergente - Frontend" cmd /k "cd /d "%~dp0fortress-vault-frontend" && "C:\Users\miguel_delacruz\AppData\Roaming\npm\ng.cmd" serve"
timeout /t 12 /nobreak >nul
start "" "http://localhost:4200"

echo Both servers are starting...
echo Backend:  http://localhost:8080/health
echo Frontend: http://localhost:4200
