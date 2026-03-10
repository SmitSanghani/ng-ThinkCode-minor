@echo off
echo Starting Backend and Frontend...
start cmd /k "cd backend && npm run dev"
start cmd /k "cd frontend && npm start"
echo Both services are starting in separate windows.
pause
