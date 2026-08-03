# Mobile Dev Build On Windows

Date: 2026-08-03

## Why Expo Go Is Not Enough

The real native map uses `@maplibre/maplibre-react-native`, so Expo Go cannot
run it. Use a development build instead.

## Required Environment

PowerShell must know where Java and Android SDK tools are:

```powershell
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME="$env:LOCALAPPDATA\Android\Sdk"
$env:Path="$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"
```

## Important Windows Path Note

Native Android/CMake builds can fail when the repo path contains Vietnamese
characters, for example `...\ĐỒ ÁN\...`.

If that happens, build from a real ASCII path, not only a junction:

```powershell
robocopy "C:\Users\ACER\OneDrive\Desktop\ĐỒ ÁN\SEP490_MB_MedicalAIAssistant" "C:\sep490_mb_build" /MIR /XD node_modules .git android ios dist .expo .gradle .kotlin
cd C:\sep490_mb_build
npm ci
npx expo run:android --port 8081
```

Then keep Metro running from the main repo:

```powershell
npx expo start --dev-client
```

## App Id

Android development build package:

```text
com.medimate.medicalaiassistant
```

## Emulator Storage

If install fails with `INSTALL_FAILED_INSUFFICIENT_STORAGE`, free space on the
emulator:

```powershell
adb shell pm list packages -3
adb uninstall host.exp.exponent
adb shell df -h /data
```

The dev APK is large because it includes native debug libraries.
