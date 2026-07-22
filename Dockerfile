# استخدام نسخة Node.js مستقرة
FROM node:20-alpine

# تحديد مجلد العمل
WORKDIR /app

# نسخ ملفات الحزم والتثبيت
COPY package*.json ./
RUN npm install --omit=dev

# نسخ بقية الملفات
COPY . .

# تحديد المنفذ
EXPOSE 10000

# أمر التشغيل
CMD ["npm", "start"]
