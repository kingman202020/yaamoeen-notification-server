const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const webPush = require('web-push');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// إعدادات Middleware
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());

// التخزين المحلي للاشتراكات (في الذاكرة - يُفضل ربطه بـ Firestore أو قاعدة بيانات لاحقاً)
let subscriptions = [];

// -------------------------------------------------------------
// 1. إعداد مفاتيح Web Push (VAPID)
// -------------------------------------------------------------
const publicVapidKey = process.env.PUBLIC_VAPID_KEY;
const privateVapidKey = process.env.PRIVATE_VAPID_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@yaamoeen.com';

if (publicVapidKey && privateVapidKey) {
  try {
    webPush.setVapidDetails(
      vapidSubject,
      publicVapidKey,
      privateVapidKey
    );
    console.log('✅ تم تفعيل خدمة Web Push VAPID بنجاح');
  } catch (err) {
    console.error('⚠️ خطأ في تهيئة مفاتيح VAPID:', err.message);
  }
} else {
  console.warn('⚠️ لم يتم العثور على PUBLIC_VAPID_KEY / PRIVATE_VAPID_KEY في متغيرات البيئة.');
}

// -------------------------------------------------------------
// 2. إعداد Firebase Admin SDK (اختياري للإشعارات عبر FCM)
// -------------------------------------------------------------
let firebaseAdminInitialized = false;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    let serviceAccount;
    // يمكن أن يكون FIREBASE_SERVICE_ACCOUNT نص JSON مشفر أو مسار ملف
    if (process.env.FIREBASE_SERVICE_ACCOUNT.startsWith('{')) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
      serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT);
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    firebaseAdminInitialized = true;
    console.log('✅ تم تفعيل Firebase Admin SDK بنجاح');
  } catch (err) {
    console.error('⚠️ تعذر تهيئة Firebase Admin SDK:', err.message);
  }
} else {
  console.log('ℹ️ لم يتم توفير حساب خدمة Firebase (FIREBASE_SERVICE_ACCOUNT).');
}

// -------------------------------------------------------------
// 3. مسارات الفحص والمنفذ (Endpoints)
// -------------------------------------------------------------

// مسار الفحص المباشر لخدمة Render (Health Check)
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'خادم إشعارات تطبيق يا معين (Ya Mo\'een Notification Server)',
    timestamp: new Date().toISOString(),
    vapidConfigured: Boolean(publicVapidKey && privateVapidKey),
    firebaseConfigured: firebaseAdminInitialized,
    totalSubscriptions: subscriptions.length
  });
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// الحصول على المفتاح العام لـ VAPID
app.get('/api/vapid-public-key', (req, res) => {
  if (!publicVapidKey) {
    return res.status(500).json({ error: 'لم يتم ضبط المفتاح العام لـ VAPID' });
  }
  res.json({ publicKey: publicVapidKey });
});

// تسجيل اشتراك جديد في الإشعارات (Web Push Subscription)
app.post('/api/subscribe', (req, res) => {
  const subscription = req.body;

  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'بيانات الاشتراك غير صالحة' });
  }

  // التحقق من وجود الاشتراك مسبقاً
  const exists = subscriptions.some(sub => sub.endpoint === subscription.endpoint);
  if (!exists) {
    subscriptions.push(subscription);
    console.log(`➕ تم إضافة اشتراك جديد. إجمالي الاشتراكات: ${subscriptions.length}`);
  }

  res.status(201).json({ message: 'تم حفظ الاشتراك بنجاح' });
});

// إلغاء الاشتراك
app.post('/api/unsubscribe', (req, res) => {
  const { endpoint } = req.body;
  if (endpoint) {
    subscriptions = subscriptions.filter(sub => sub.endpoint !== endpoint);
    console.log(`➖ تم إلغاء اشتراك. إجمالي الاشتراكات: ${subscriptions.length}`);
  }
  res.status(200).json({ message: 'تم إلغاء الاشتراك' });
});

// إرسال إشعار لمنبثق عبر Web Push
app.post('/api/send-notification', async (req, res) => {
  const { subscription, title, body, icon, url, data } = req.body;

  const payload = JSON.stringify({
    title: title || 'تنبيه جديد من يا معين',
    body: body || 'لديك إشعار جديد في تطبيق يا معين',
    icon: icon || '/512.png',
    url: url || '/',
    data: data || {}
  });

  try {
    if (subscription) {
      // إرسال لاشتراك محدد
      await webPush.sendNotification(subscription, payload);
      return res.status(200).json({ success: true, message: 'تم إرسال الإشعار بنجاح' });
    } else {
      // إرسال لجميع المشتركين
      const notifications = subscriptions.map(sub =>
        webPush.sendNotification(sub, payload).catch(err => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            // الاشتراك انتهى أو غير موجود، نقوم بحذفه
            subscriptions = subscriptions.filter(s => s.endpoint !== sub.endpoint);
          }
          console.error('خطأ في إرسال الإشعار للمشترك:', err.message);
        })
      );

      await Promise.all(notifications);
      return res.status(200).json({
        success: true,
        message: `تم إرسال الإشعار إلى جميع المشتركين (${subscriptions.length})`
      });
    }
  } catch (error) {
    console.error('خطأ في إرسال الإشعار:', error);
    res.status(500).json({ error: error.message });
  }
});

// إرسال إشعار عبر Firebase Admin FCM (Firebase Cloud Messaging)
app.post('/api/send-fcm', async (req, res) => {
  if (!firebaseAdminInitialized) {
    return res.status(500).json({ error: 'لم يتم تهيئة Firebase Admin SDK على السيرفر' });
  }

  const { tokens, title, body, icon, data } = req.body;

  if (!tokens || (Array.isArray(tokens) && tokens.length === 0)) {
    return res.status(400).json({ error: 'يرجى تزويد توكن FCM واحد على الأقل' });
  }

  const tokenList = Array.isArray(tokens) ? tokens : [tokens];

  const message = {
    notification: {
      title: title || 'يا معين (Ya Mo\'een)',
      body: body || 'لديك إشعار جديد'
    },
    data: data || {},
    webpush: {
      headers: {
        Urgency: 'high'
      },
      notification: {
        icon: icon || '/512.png',
        badge: '/512.png',
        sound: 'default'
      }
    },
    tokens: tokenList
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`✅ تم إرسال الإشعار بنجاح عبر FCM إلى ${response.successCount} جهاز`);
    res.status(200).json({
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount
    });
  } catch (error) {
    console.error('❌ خطأ في إرسال إشعار FCM:', error);
    res.status(500).json({ error: error.message });
  }
});

// تشغيل خادم Render
app.listen(PORT, () => {
  console.log(`🚀 خادم إشعارات Render يعمل الآن على المنفذ: ${PORT}`);
});
