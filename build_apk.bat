@echo off
echo.
echo ===========================================
echo   VStudyHub - Easy APK Builder
echo ===========================================
echo.
echo Starting the Android APK build (Preview profile)...
echo.
npx eas-cli@latest build -p android --profile preview
echo.
echo If the build finished successfully, follow the link above!
pause
