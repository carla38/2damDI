@echo off
title VirtualBox Dashboard Portable - Backend
echo.
echo ===================================================
echo     DASHBOARD PORTABLE - SERVIDOR BACKEND
echo ===================================================
echo.
echo Iniciando servidor en http://localhost:8000 ...
echo NO CIERRE ESTA VENTANA mientras quiera usar el dashboard.
echo Para salir, simplemente cierre esta ventana.
echo.

:: Check if the backend exe exists
if exist "backend\dashboard-backend.exe" (
    "backend\dashboard-backend.exe"
) else (
    color 0C
    echo [ERROR] No se encuentra 'backend\dashboard-backend.exe'.
    echo Asegurese de haber seguido las instrucciones de generacion.
    echo.
    echo 1) Vaya a la carpeta raiz 'tarea-dashboard/'
    echo 2) Ejecute: pyinstaller --onefile --name dashboard-backend backend/main.py
    echo 3) Copie 'dist\dashboard-backend.exe' a 'portable\backend\'
    echo.
    pause
    exit
)
pause
