@echo off
echo.
echo ===========================================
echo   VStudyHub - Local Offline APK Builder
echo ===========================================
echo.

echo 1. Syncing Expo changes (Icons, Plugins, Widget)...
call npx expo prebuild --platform android --no-install
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Prebuild failed. Make sure you have Node.js installed.
    pause
    exit /b %errorlevel%
)

echo.
echo 2. Building APK locally using Gradle...
cd android
call gradlew assembleDebug
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Gradle build failed. 
    echo Make sure you have Java (JDK) and Android SDK installed.
    pause
    exit /b %errorlevel%
)

echo.
echo ===========================================
echo   BUILD SUCCESSFUL!
echo ===========================================
echo.
echo Opening APK folder...
start "" "app\build\outputs\apk\debug\"
echo.
pause
