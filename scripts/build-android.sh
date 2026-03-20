#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# StreamKing — Android APK build script
# Prerequisites: Android SDK, Java 17+, ANDROID_HOME set
# ──────────────────────────────────────────────────────────────
set -euo pipefail

cd "$(dirname "$0")/.."

echo "▶ Building web assets..."
npm run build

echo "▶ Syncing to Android platform..."
npx cap sync android

echo "▶ Building release APK..."
cd android
./gradlew assembleRelease

APK_PATH="app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK_PATH" ]; then
  echo ""
  echo "✅  APK built: android/$APK_PATH"
else
  echo "❌  Build failed — check output above."
  exit 1
fi
