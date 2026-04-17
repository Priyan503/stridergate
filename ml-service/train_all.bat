@echo off
echo.
echo ============================================
echo   GigShield ML - Training All Models
echo ============================================
echo.

cd /d "%~dp0"

if not exist "models" mkdir models

echo [1/1] Training all models (risk + earnings + fraud)...
python train.py

echo.
echo Verifying model files...
if exist "models\risk.pkl" (echo   ✓ risk.pkl found) else (echo   ✗ risk.pkl MISSING!)
if exist "models\earnings.pkl" (echo   ✓ earnings.pkl found) else (echo   ✗ earnings.pkl MISSING!)
if exist "models\fraud.pkl" (echo   ✓ fraud.pkl found) else (echo   ✗ fraud.pkl MISSING!)

echo.
echo ============================================
echo   Done! Start the ML service with:
echo   uvicorn main:app --port 8001 --reload
echo ============================================
pause
