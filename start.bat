@echo off
echo Starting AI EvalPro System...
echo =======================================

:: Start the Python Backend in a new terminal window
echo Starting FastAPI Backend...
start "AI Backend" cmd /k "cd backend && python main.py"

:: Start the React Frontend in a new terminal window
echo Starting React Frontend...
start "AI Frontend" cmd /k "cd frontend && npx vite"

echo.
echo Both servers are starting up!
echo The website will be available at: http://localhost:3000
echo.
echo Please leave the two new popup black terminal windows open while you are using the app.
pause
