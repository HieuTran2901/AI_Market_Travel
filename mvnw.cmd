@echo off
setlocal

set "BASE_DIR=%~dp0"
set "WRAPPER_PROPERTIES=%BASE_DIR%.mvn\wrapper\maven-wrapper.properties"
set "MAVEN_VERSION=3.9.9"
set "MAVEN_ROOT=%USERPROFILE%\.m2\wrapper\dists"
set "MAVEN_HOME=%MAVEN_ROOT%\apache-maven-%MAVEN_VERSION%"
set "MAVEN_ARCHIVE=%MAVEN_ROOT%\apache-maven-%MAVEN_VERSION%-bin.zip"
set "DISTRIBUTION_URL="

for /f "usebackq tokens=1,* delims==" %%A in ("%WRAPPER_PROPERTIES%") do (
  if "%%A"=="distributionUrl" set "DISTRIBUTION_URL=%%B"
)

if not exist "%MAVEN_HOME%\bin\mvn.cmd" (
  if not exist "%MAVEN_ROOT%" mkdir "%MAVEN_ROOT%"

  if not exist "%MAVEN_ARCHIVE%" (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri '%DISTRIBUTION_URL%' -OutFile '%MAVEN_ARCHIVE%'"
    if errorlevel 1 exit /b 1
  )

  powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -Path '%MAVEN_ARCHIVE%' -DestinationPath '%MAVEN_ROOT%' -Force"
  if errorlevel 1 exit /b 1
)

call "%MAVEN_HOME%\bin\mvn.cmd" %*
endlocal
