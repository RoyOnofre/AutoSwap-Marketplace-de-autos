@echo off
title TechStore Manager - Arranque Maestro
echo ==========================================
echo    INICIANDO TECHSTORE MANAGER MASTER
echo ==========================================
echo.

:: 1. Iniciar el Backend (Python) en una nueva ventana
echo [1/3] Iniciando Servidor Python (Backend)...
start cmd /k "python -m backend.main"

:: 2. Esperar un momento para que el backend cargue
timeout /t 5 /nobreak > nul

:: 3. Iniciar el Frontend (React) en una nueva ventana
echo [2/3] Iniciando Interfaz (Frontend)...
start cmd /k "npm run dev"

echo.
echo ==========================================
echo    SISTEMA INICIADO EXITOSAMENTE
echo    No cierres las ventanas de comando!
echo ==========================================
pause
