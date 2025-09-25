@echo off
echo ========================================
echo   Service Booking App - Development
echo ========================================
echo.

echo Checking environment setup...
if not exist "server\.env" (
    echo ❌ .env file not found in server directory
    echo 🔧 Creating .env file...
    cd server
    node setup-env.js
    cd ..
    echo ✅ Environment setup complete
) else (
    echo ✅ .env file found
)

echo.
echo Starting development servers...
echo.

echo 🚀 Starting backend server (Port 5000)...
start "Backend Server" cmd /k "cd server && npm start"

echo.
echo ⏳ Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak > nul

echo.
echo 🚀 Starting frontend server (Port 3000)...
start "Frontend Server" cmd /k "cd client && npm start"

echo.
echo ✅ Both servers are starting...
echo 📱 Frontend: http://localhost:3000
echo 🔧 Backend: http://localhost:5000
echo.
echo Press any key to exit this window...
pause > nul






