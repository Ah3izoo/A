#!/bin/bash
set -e

echo "=========================================================="
echo "🚀 بدء بناء تطبيق أندرويد (APK) في GitHub Codespaces"
echo "   Ahmed Jamjoom Looker Sales Studio"
echo "=========================================================="

# 1. التحقق من تثبيت Java 17
echo "☕ التحقق من بيئة Java..."
if ! command -v java &> /dev/null || ! java -version 2>&1 | grep -q "17"; then
  echo "📦 تثبيت OpenJDK 17..."
  sudo apt-get update -qq
  sudo apt-get install -y openjdk-17-jdk
  export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
  export PATH=$JAVA_HOME/bin:$PATH
else
  echo "✓ تم العثور على Java 17 بنجاح"
fi

# 2. إعداد مسار Android SDK
if [ -z "$ANDROID_HOME" ]; then
  if [ -d "/usr/local/lib/android/sdk" ]; then
    export ANDROID_HOME="/usr/local/lib/android/sdk"
  elif [ -d "$HOME/Android/Sdk" ]; then
    export ANDROID_HOME="$HOME/Android/Sdk"
  else
    echo "📦 إعداد وتثبيت أدوات Android SDK..."
    export ANDROID_HOME="$HOME/android-sdk"
    mkdir -p "$ANDROID_HOME/cmdline-tools"
    
    if [ ! -d "$ANDROID_HOME/cmdline-tools/latest" ]; then
      CMDLINE_URL="https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip"
      curl -sSL -o /tmp/cmdline-tools.zip "$CMDLINE_URL"
      unzip -q -o /tmp/cmdline-tools.zip -d /tmp/cmdline-tools
      mv /tmp/cmdline-tools/cmdline-tools "$ANDROID_HOME/cmdline-tools/latest"
      rm -f /tmp/cmdline-tools.zip
    fi
    
    export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"
    
    echo "📋 قبول تراخيص Android SDK وتثبيت الحزم..."
    yes | "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" --licenses > /dev/null 2>&1 || true
    "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" "platform-tools" "platforms;android-34" "build-tools;34.0.0" > /dev/null 2>&1 || true
  fi
fi

export PATH="$ANDROID_HOME/platform-tools:$PATH"
echo "✓ مسار Android SDK: $ANDROID_HOME"

# 3. تثبيت حزم Node وبناء تطبيق الويب
echo "🔨 بناء ملفات الويب المحدثة (Vite Build)..."
npm install
npm run build

# 4. مزامنة Capacitor مع منصة أندرويد
echo "🔄 مزامنة ملفات الويب مع تطبيق أندرويد عبر Capacitor..."
npx cap sync android

# 5. بناء ملف الـ APK عبر Gradle
echo "📦 تجميع وبناء ملف APK (Gradle assembleDebug)..."
cd android
chmod +x gradlew
./gradlew assembleDebug --no-daemon

APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
  FULL_PATH="$(pwd)/$APK_PATH"
  echo ""
  echo "=========================================================="
  echo "🎉 تم بناء تطبيق أندرويد بنجاح!"
  echo "=========================================================="
  echo "📍 مسار ملف الـ APK الناتج:"
  echo "   android/app/build/outputs/apk/debug/app-debug.apk"
  echo ""
  echo "📥 لتحميل الملف إلى جهازك من GitHub Codespaces:"
  echo "   1. في شجرة الملفات على اليسار، افتح مجلد: android/app/build/outputs/apk/debug/"
  echo "   2. انقر بزر الفأرة الأيمن على ملف app-debug.apk"
  echo "   3. اضغط 'Download...' لتحميله وتثبيته مباشرة على هاتفك!"
  echo "=========================================================="
else
  echo "❌ حدث خطأ أثناء بناء الـ APK. تحقق من المخرجات أعلاه."
  exit 1
fi
