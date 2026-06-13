# Aniverse Android APK — Build Guide

This guide explains how to build the Aniverse Android APK using Capacitor.

---

## Prerequisites

Install the following tools before building:

1. **Node.js** (v18+)
2. **Android Studio** — https://developer.android.com/studio
3. **JDK 17** — bundled with Android Studio, or install separately
4. **Android SDK** — installed via Android Studio SDK Manager
   - API Level 33 (Android 13) — target
   - API Level 23 (Android 6) — minimum

> Make sure `ANDROID_HOME` is set in your environment variables pointing to the Android SDK path.
> Usually: `C:\Users\<you>\AppData\Local\Android\Sdk`

---

## Step 1 — Install dependencies

```powershell
cd frontend
npm install
```

---

## Step 2 — Add the Android platform (run once only)

```powershell
cd frontend
npx cap add android
```

This generates the `android/` folder containing the full native Android Studio project.

---

## Step 3 — Copy native plugin files into the Android project

After adding Android, copy the prepared Java files into the correct location:

```powershell
# From project root:
$pkg = "frontend\android\app\src\main\java\com\aniverse\app"
New-Item -ItemType Directory -Force -Path $pkg

Copy-Item "android-src\MainActivity.java"         "$pkg\MainActivity.java" -Force
Copy-Item "android-src\AniverseDownloadPlugin.java" "$pkg\AniverseDownloadPlugin.java" -Force
```

---

## Step 4 — Open in Android Studio

```powershell
cd frontend
npx cap open android
```

This opens the `android/` folder in Android Studio.

---

## Step 5 — Build APK in Android Studio

Inside Android Studio:
1. Wait for Gradle sync to finish.
2. Go to **Build → Build Bundle(s) / APK(s) → Build APK(s)**
3. The APK will be at:
   `android/app/build/outputs/apk/debug/app-debug.apk`

---

## Step 6 — Install on your device

Connect your Android phone via USB with USB Debugging enabled, then:

```powershell
# From inside the android/ folder:
.\gradlew installDebug
```

Or transfer the `.apk` file to your phone and install it manually (enable "Install from unknown sources" in Settings).

---

## Download Behaviour

| Platform | Where downloads go | Accessible by VLC/MX? |
|----------|-------------------|----------------------|
| **APK**  | App internal storage (`.nomedia`) | ❌ Hidden — in-app Library tab only |
| **Web**  | Browser's root Downloads folder | ✅ Yes — VLC, gallery, file manager |

---

## Android JS Bridge

The native download plugin exposes these functions to your JS code:

```js
// Called automatically by VideoPlayer.tsx when on native
window.AniverseDownload.startDownload({ url, filename, animeSlug, epId, ... })

// Called by native Java to update UI — wired in GlobalDownloadProgress.tsx
window.updateDownloadProgress(jobId, title, progress)  // progress: 0-100
window.finishDownload(jobId, animeSlug, animeTitle, cover, epNum, epTitle, localPath)
```

---

## Updating the APK after code changes

```powershell
cd frontend
npm run build          # optional — not needed if using server.url
npx cap sync android   # syncs JS changes to Android project
# Then rebuild in Android Studio
```
