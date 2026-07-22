const crypto = require('crypto');

function generateVapidKeys() {
  const ecdh = crypto.createECDH('prime256v1');
  ecdh.generateKeys();

  const publicKey = ecdh.getPublicKey('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const privateKey = ecdh.getPrivateKey('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  return { publicKey, privateKey };
}

const keys = generateVapidKeys();

console.log('\n===================================================');
console.log('🔑 مفاتيح VAPID المولدة بنجاح (جاهزة للاستخدام):');
console.log('===================================================');
console.log(`PUBLIC_VAPID_KEY=${keys.publicKey}`);
console.log(`PRIVATE_VAPID_KEY=${keys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:admin@yaamoeen.com`);
console.log('===================================================\n');
console.log('قم بنسخ المفاتيح أعلاه وأضفها إلى متغيرات البيئة (Environment Variables) في Render.com\n');
