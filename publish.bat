@echo off
echo ===================================
echo TWLD Auto-Publisher
echo ===================================
echo.

echo [1/3] Building the static site...
node scripts/build-site.js
if %errorlevel% neq 0 (
  echo Build failed! Aborting.
  pause
  exit /b %errorlevel%
)

echo.
echo [2/3] Committing changes to Git...
git add .
git commit -m "Add new entries from Tally"

echo.
echo [3/3] Pushing to GitHub...
git push origin main
if %errorlevel% neq 0 (
  echo Push failed! Check your internet or GitHub permissions.
  pause
  exit /b %errorlevel%
)

echo.
echo ===================================
echo SUCCESS! Your archive is now live.
echo ===================================
pause
