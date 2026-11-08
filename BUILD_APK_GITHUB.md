# دليل بناء وتحميل تطبيق أندرويد (APK) عبر GitHub Codespaces و GitHub Actions
# How to Build & Download Android APK on GitHub Codespaces

تم إعداد هذا المستودع بالكامل مع بيئة **Capacitor** ونظام **GitHub Codespaces** و **GitHub Actions CI/CD** لبناء ملف التثبيت **Android APK** تلقائياً ومجاناً.

---

## ⚡ الطريقة الأولى: البناء بنقرة واحدة في GitHub Codespaces (موصى بها ومباشرة)

1. افتح مستودعك على GitHub، ثم اضغط على الزر الأخضر **Code** > اختر تبويب **Codespaces** > اضغط **Create codespace on main**.
2. بمجرد فتح واجهة Codespaces وموجه الأوامر (Terminal)، نفّذ أمر واحد فقط:
   ```bash
   ./build-apk-codespaces.sh
   ```
   *(أو يمكنك تنفيذ: `bash build-apk-codespaces.sh`)*

3. سيقوم السكربت تلقائياً بتثبيت Java 17 وأدوات أندرويد، بناء الويب، مزامنة Capacitor، وبناء الـ APK!
4. بمجرد الانتهاء، ستجد ملف الـ APK في المسار:
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```
5. انقر بزر الفأرة الأيمن (Right Click) على ملف `app-debug.apk` في مستكشف الملفات واضغط **Download...** لتحميله إلى هاتفك مباشرة!

---

## 🚀 الطريقة الثانية: البناء التلقائي عبر GitHub Actions (بدون الحاجة لفتح أي طرفية)

### 1. رفع المشروع إلى مستودعك في GitHub:
افتح موجه الأوامر (Terminal) في مجلد المشروع وقم بتنفيذ الأوامر التالية:

```bash
git init
git add .
git commit -m "Initial commit with Looker Sales Studio & Android APK setup"
git branch -M main
git remote add origin https://github.com/Ah3izoo/Ahmed-jamjoom.git
git push -u origin main
```

---

### 2. متابعة البناء التلقائي في GitHub:
1. اذهب إلى صفحة المستودع الخاص بك على GitHub في المتصفح.
2. اضغط على تبويب **Actions** في الشريط العلوي للمستودع.
3. ستجد سير العمل بعنوان **`Build Android APK`** قد بدأ العمل تلقائياً (أيقونة صفراء تدور).
4. يستغرق البناء عادة ما بين **2 إلى 3 دقائق**.

---

### 3. تحميل ملف الـ APK:
1. بمجرد انتهاء البناء وظهور علامة الصح الخضراء `✓`، اضغط على اسم العملية (مثلاً: *Build Android APK*).
2. انزل إلى أسفل الصفحة حتى تصل إلى قسم **Artifacts** (المخرجات).
3. اضغط على رابط:
   ```
   AhmedJam-Android-APK
   ```
4. سيتم تحميل ملف مضغوط يحتوي على **`app-debug.apk`**.
5. انقله إلى هاتفك الأندرويد وافتحه لتثبيت التطبيق مباشرة!

---

## 🛠️ الطريقة الثانية: تشغيل البناء يدوياً من GitHub (Manual Trigger)
إذا قمت بتعديل الأسعار أو البيانات وأردت بناء APK جديد دون عمل Commit جديد:
1. ادخل على تبويب **Actions** في GitHub.
2. اختر من القائمة الجانبية سير العمل **Build Android APK**.
3. اضغط على زر **Run workflow** الأزرق على اليمين.
4. انتظر دقيقتين وقم بتحميل الـ APK الجديد من قسم Artifacts.

---

## 💻 الطريقة الثالثة: البناء محلياً على جهاز الكمبيوتر (Local Build)
إذا كان لديك **Android Studio** أو **Android SDK** و **Java JDK 17** على جهازك:

```bash
# 1. تثبيت الحزم وبناء ملفات الويب ومزامنتها مع أندرويد
npm run cap:build

# 2. بناء ملف الـ APK عبر Gradle
cd android
./gradlew assembleDebug

# مسار ملف الـ APK الناتج:
# android/app/build/outputs/apk/debug/app-debug.apk
```

أو يمكنك فتح المشروع في Android Studio لتشغيله على المحاكي:
```bash
npm run cap:open
```

---

## 📱 مميزات ملف الـ APK المدمج:
- يعمل كتطبيق أندرويد مستقل بشاشة كاملة مع دعم اللمس والإيماءات.
- يحتوي على قاعدة البيانات الكاملة لجميع الأصناف الـ 23.
- دعم العمل دون اتصال بالإنترنت وحفظ التغييرات محلياً على الهاتف.
- يدعم عملة الجنيه السوداني (ج.س) وكافة العملات الأخرى.
