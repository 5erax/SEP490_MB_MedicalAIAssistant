# Google Sign-In setup for MB

Mobile Google Sign-In uses the native Google SDK through
`@react-native-google-signin/google-signin`, then sends the returned `idToken`
to the existing backend endpoint:

```txt
POST /api/authentication/google
```

No backend change is required.

## Required local environment

`.env.development` must contain the Web OAuth client ID:

```txt
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=976426394148-eub0i02sbrseoob7r4lbe8ubr3bqv3n2.apps.googleusercontent.com
```

The Web client ID is the audience used by the backend when verifying the Google
ID token.

## Android OAuth client

In Google Cloud Console, create or update an Android OAuth client with:

```txt
Package name: com.medimate.medicalaiassistant
Debug SHA-1: 2B:57:2A:FA:C6:97:48:71:62:A4:5B:85:A3:51:C7:05:FC:5B:03:B3
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
