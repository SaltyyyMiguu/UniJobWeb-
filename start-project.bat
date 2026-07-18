@echo off
echo Starting the Backend Server...
start cmd /k "cd backend && npm run dev"

echo Starting the Frontend Server...
start cmd /k "cd frontend && npm run dev"

echo Both servers are starting! You can safely close this window.
