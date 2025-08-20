@echo off
echo Starting Barber Reservation System...
echo.

echo Starting Server...
start "Server" cmd /k "cd server && node index.js"

echo Waiting 3 seconds for server to start...
timeout /t 3 /nobreak > nul

echo Starting Client...
start "Client" cmd /k "cd client && npm start"

echo.
echo Both server and client are starting...
echo Server will be available at: http://localhost:5000
echo Client will be available at: http://localhost:3000
echo.
echo Press any key to close this window...
pause > nul 