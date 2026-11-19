# Nur Quran — 3টা আলাদা প্রজেক্ট

| ফোল্ডার | সাবডোমেন | কাজ | কী ধরনের |
|---|---|---|---|
| `nurquran/` | nurquran.toptol.site | ভিজিটরদের ওয়েবসাইট (হোম, Read Quran, Prayer Times, Qibla, Tasbeeh) | Static (শুধু ফাইল আপলোড) |
| `quranadmin/` | quranadmin.toptol.site | অ্যাডমিন প্যানেল — কুরআনের পৃষ্ঠা যোগ/এডিট, অনুবাদ, অডিও, অ্যাডমিন, ব্যাকআপ | Static (শুধু ফাইল আপলোড) |
| `apiquran/` | apiquran.toptol.site | API — সব ডেটা, লগইন, অডিও আপলোড | Node.js অ্যাপ |

কীভাবে একসাথে কাজ করে: অ্যাডমিন প্যানেলে পৃষ্ঠা সেভ করলে সেটা API-তে জমা হয়। ভিজিটরদের সাইট API থেকে পড়ে দেখায়
(একবার লোড হলে ব্রাউজারে জমা থাকে, তাই পরেরবার সাথে সাথে খোলে; নতুন কিছু যোগ হলে নিজে থেকেই আপডেট হয়)।

---

## ১) API — apiquran.toptol.site (সবার আগে এটা)

1. cPanel → **File Manager** → home ফোল্ডারে (public_html-এর বাইরে) `apiquran-app` নামে ফোল্ডার বানান।
   `apiquran/` এর সব ফাইল সেখানে আপলোড করুন (`node_modules` ছাড়া)।
   > public_html বা সাবডোমেনের ফোল্ডারের ভেতরে রাখবেন না — তাহলে ডেটা ফাইল বাইরে থেকে দেখা যেতে পারে।
2. cPanel → **Setup Node.js App** → **Create Application**
   - Node.js version: 18 বা তার বেশি (20 হলে ভালো)
   - Application mode: Production
   - Application root: `apiquran-app`
   - Application URL: `apiquran.toptol.site`
   - Application startup file: `app.js`
3. একই পেজে **Environment variables**-এ এগুলো যোগ করুন:
   - `ADMIN_EMAIL` = আপনার ইমেইল
   - `ADMIN_PASSWORD` = প্রথম লগইনের পাসওয়ার্ড (পরে অ্যাডমিন প্যানেল থেকে বদলাবেন)
   - `JWT_SECRET` = লম্বা এলোমেলো লেখা (যেমন ৪০+ অক্ষর)
   - `ALLOWED_ORIGINS` = `http://nurquran.toptol.site,https://nurquran.toptol.site,http://quranadmin.toptol.site,https://quranadmin.toptol.site`
   - `PUBLIC_URL` = `http://apiquran.toptol.site` (SSL লাগানোর পর `https://` করে দেবেন)
4. **Run NPM Install** চাপুন, তারপর **Restart**।
5. ব্রাউজারে খুলুন: `http://apiquran.toptol.site/v1/health` — `"ok":true` দেখালে API চালু।

ডেটা কোথায় থাকে: `apiquran-app/storage/` (কুরআনের পৃষ্ঠা, অ্যাডমিন, সেটিংস)। প্রতিটা পরিবর্তনের আগে
`storage/backups/`-এ আগের কপি জমা হয় (শেষ ৩০টা)। অডিও থাকে `apiquran-app/uploads/`-এ।
**API আপডেট করার সময় `storage/` আর `uploads/` ফোল্ডার কখনো মুছবেন না বা ওভাররাইট করবেন না।**

## ২) অ্যাডমিন প্যানেল — quranadmin.toptol.site

1. কম্পিউটারে: `cd quranadmin` → `npm install` → `npm run build`
2. তৈরি হওয়া `out/` ফোল্ডারের **ভেতরের সব ফাইল** আপলোড করুন `/quranadmin.toptol.site` ফোল্ডারে।
3. `http://quranadmin.toptol.site` খুলে উপরের ADMIN_EMAIL / ADMIN_PASSWORD দিয়ে লগইন করুন →
   Settings → My password থেকে পাসওয়ার্ড বদলে নিন।

## ৩) ভিজিটরদের সাইট — nurquran.toptol.site

1. কম্পিউটারে: `cd nurquran` → `npm install` → `npm run build`
2. `out/` ফোল্ডারের **ভেতরের সব ফাইল** আপলোড করুন `/nurquran.toptol.site` ফোল্ডারে।

## শেষে
- **SSL ছাড়া (HTTP):** সব কাজ করবে, কারণ তিনটা সাবডোমেনই HTTP-তে চলবে। cPanel-এ Force HTTPS Redirect **বন্ধ** রাখুন।
  সাইট আর অ্যাডমিন নিজে থেকেই পেজের মতো একই http/https-এ API-কে ডাকে, তাই পরে SSL লাগালে কোড বদলাতে হবে না।
- **SSL লাগানোর পর:** তিনটা সাবডোমেনেই একসাথে SSL লাগাবেন (একটা https আর একটা http হলে ব্রাউজার আটকে দেয়)।
  তারপর Force HTTPS চালু করুন, দুই static সাইটের `.htaccess`-এর https লাইনগুলো থেকে `#` সরান, আর API-র `PUBLIC_URL` https করুন।
- **HTTP-তে যা কাজ করবে না** (ব্রাউজার শুধু https-এ অনুমতি দেয়): Prayer Times-এ GPS দিয়ে লোকেশন (শহর বেছে নেওয়া কাজ করবে),
  ফোনে Qibla-র লাইভ কম্পাস, নোটিফিকেশন, আর Share/Copy বাটন।
- API-র ঠিকানা বদলাতে চাইলে দুই static প্রজেক্টে `.env` ফাইল বানিয়ে `NEXT_PUBLIC_API_URL=...` লিখে আবার build করুন।
- Al Majeed ফন্ট: `AlMajeedQuranic.ttf` (বা .woff2) ফাইলটা `nurquran/public/fonts/` আর `quranadmin/public/fonts/`-এ রেখে build করুন।
