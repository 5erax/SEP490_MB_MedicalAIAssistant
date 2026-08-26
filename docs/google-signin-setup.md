# Google Sign-In setup for MB

Mobile Google Sign-In uses the native Google SDK through
`@react-native-google-signin/google-signin`, then sends the returned `idToken`
to the existing backend endpoint:

```txt
POST /api/authentication/google
```

No backend change is required.

## Required local environment

The app has public fallback Google client IDs in `src/config/env.ts`, so EAS
preview/production builds still enable Google Sign-In even when Expo
environment variables are not configured. Keep `.env.development` in sync for
local testing and use EAS environment variables only when overriding the
defaults:

```txt
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=976426394148-eub0i02sbrseoob7r4lbe8ubr3bqv3n2.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=976426394148-9n1brtej8v6105qr9h76bk1dv3put34s.apps.googleusercontent.com
```

The Web client ID is the audience used by the backend when verifying the Google
ID token. The Android client ID is registered in Google Cloud for the native app
package and signing certificate; do not replace the Web client ID with the
Android client ID unless the backend is updated to accept that audience.

## Android OAuth client

In Google Cloud Console, create or update an Android OAuth client with:

```txt
Package name: com.medimate.medicalaiassistant
Debug SHA-1: 2B:57:2A:FA:C6:97:48:71:62:A4:5B:85:A3:51:C7:05:FC:5B:03:B3
Android OAuth client ID: 976426394148-9n1brtej8v6105qr9h76bk1dv3put34s.apps.googleusercontent.com
```

To get the SHA-1 on another Windows machine:

```powershell
& "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" `
  -list -v `
  -keystore "$env:USERPROFILE\.android\debug.keystore" `
  -alias androiddebugkey `
  -storepass android `
  -keypass android
```

Use the `SHA1` value printed by that command.

## Run locally

Google Sign-In native modules do not work in Expo Go. Use a development build:

```powershell
npx expo run:android --port 8083
```

After the native build is installed, the Google button should open the native
Google account picker instead of the browser OAuth page.

## Production reminder

For production builds, add the production signing SHA-1 values to Google Cloud
or Firebase as well:

- upload key SHA-1
- Google Play app signing SHA-1

For EAS preview APKs, also add the SHA-1 of the Android keystore used by EAS for
the `preview` profile. The app package remains:

```txt
com.medimate.medicalaiassistant
```
