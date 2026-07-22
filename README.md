# 🔔 خادم إشعارات Render لتطبيق يا معين (Ya Mo'een Notification Server)

هذا المشوع عبارة عن خادم Node.js + Express مخصص للرفع على منصة **Render.com** لإرسال الإشعارات المنبثقة (Push Notifications) للمستخدمين حتى عند إغلاق المتصفح أو التطبيق بالكامل.

---

## 📂 الملفات الموجودة في هذا المجلد والمطلوب رفعها إلى GitHub:

1. **`server.js`**: خادم Express الرئيسي الذي يحتوي على النقاط البرمجية (Endpoints) لـ Web Push و Firebase FCM والتحقق من صحة الخادم (Health Check).
2. **`package.json`**: ملف إدارة المكتبات المشغلة على خادم Render.
3. **`generate-keys.js`**: أداة بسيطة لتوليد مفاتيح VAPID للأشعار المنبثق.
4. **`.env.example`**: نموذج لمتغيرات البيئة التي سيتم إدخالها على منصة Render.
5. **`.gitignore`**: لمنع رفع الملفات الحساسة والملفات المؤقتة إلى GitHub.
6. **`render.yaml`**: ملف إعداد الخدمة تلقائياً على منصة Render.
7. **`Dockerfile`**: (اختياري) في حال اختيار النشر كحاوية Docker.

---

## 🚀 خطوات الرفع إلى GitHub والتشغيل على Render:

### الطريقة الأولى: إنشاء المستودع كـ Repository منفصل على GitHub (موصى بها)
1. افتح موقع **GitHub** وقم بإنشاء مستودع جديد باسم `yaamoeen-notification-server`.
2. قم بنسخ كافة ملفات هذا المجلد (`notification-server`) فقط إلى المستودع الجديد.
3. قم بعمل Commit و Push للملفات إلى GitHub.

### الطريقة الثانية: الرفع ضمن نفس المشروع الحالي (Monorepo)
1. إذا كانت ملفات المشروع الرئيسي مرتفعة على GitHub، فتأكد من رفع مجلد `notification-server` مع باقي المشروع.
2. عند إعداد الخدمة في Render، ستحدد **Root Directory** ليكون `notification-server`.

---

## ⚙️ خطوات الإعداد والنشر على Render.com:

1. سجل الدخول إلى [Render Dashboard](https://dashboard.render.com/).
2. اضغط على زر **New +** واختر **Web Service**.
3. قم بربط حسابك في GitHub واختر المستودع (`yaamoeen-notification-server` أو مشروعك الحالي).
4. املأ البيانات التالية:
   - **Name**: `yaamoeen-notification-server`
   - **Environment**: `Node`
   - **Region**: اختر الأقرب للمستخدمين (مثل Frankfurt).
   - **Branch**: `main` أو `master`.
   - **Root Directory**: اتركه فارغاً (إذا كان المستودع منفصلاً)، أو اكتب `notification-server` (إذا كان المجلد داخل المشروع الرئيسي).
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`

5. **إضافة متغيرات البيئة (Environment Variables):**
   في أسفل الصفحة أو من تبويب **Environment** في Render، أضف المتغيرات التالية:
   - `PORT`: `10000` (يقوم Render بتعيينه تلقائياً)
   - `PUBLIC_VAPID_KEY`: المفتاح العام الخاص بـ Web Push (يمكنك توليده بـ `node generate-keys.js`)
   - `PRIVATE_VAPID_KEY`: المفتاح الخاص بـ Web Push
   - `VAPID_SUBJECT`: `mailto:admin@yaamoeen.com`
   - `FIREBASE_SERVICE_ACCOUNT`: (اختياري) كود JSON لحساب الخدمة في Firebase لإرسال إشعارات FCM.

6. اضغط على **Create Web Service**. سيتم بناء الخادم وستحصل على رابط الخدمة المباشر مثل:
   `https://yaamoeen-notification-server.onrender.com`

---

## 🧪 اختبار الخادم:

بعد انتهاء عملية الـ Deploy على Render، يمكنك فتح رابط الخدمة في المتصفح:
`https://yaamoeen-notification-server.onrender.com/`

ستظهر لك استجابة JSON تؤكد أن الخادم يعمل بشكل ممتاز جاهز لاستقبال وإرسال الإشعارات.
