#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
if [[ -n "${PACKQUEST_JAVA_HOME:-}" ]]; then
  export JAVA_HOME="$PACKQUEST_JAVA_HOME"
elif [[ -d /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home ]]; then
  export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
fi

VITE_BASE_PATH=/ VITE_DEMO_MODE=false npm run build
npx cap sync android
cd android
./gradlew bundleRelease
printf '\nBundle signed with the registered PackQuest upload key:\n%s\n' "$PWD/app/build/outputs/bundle/release/app-release.aab"
