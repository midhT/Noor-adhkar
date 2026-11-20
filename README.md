# Umeed Academy — Student Android App

Fresh, isolated native Android student app built with Kotlin and Jetpack Compose.

## Open locally
Open this folder in Android Studio. Allow Gradle sync, then run the `app` configuration on an emulator or Android device.

## Demo sign-in
Enter any student name and any password. Authentication is local-only demo behavior.

## Included
- Student sign-in demo
- Home dashboard and announcements
- Sample NEET, Foundation and Commerce course catalogue
- Study materials list with category filters
- Mock test schedule and sample results
- Student profile and sign-out

## Build APK with GitHub Actions
The workflow `.github/workflows/umeed-android.yml` builds a debug APK on pushes to the dedicated experiment branch or via manual workflow dispatch. Download the `umeed-academy-student-debug` artifact from the workflow run.

## Stack
- Kotlin
- Jetpack Compose + Material 3
- minSdk 24, targetSdk 35, Java 17

## Important
All displayed content is dummy data. No backend or real student authentication is connected. This app uses application ID `com.umeedacademy.student`, separate from the Noor/Naseem app.
