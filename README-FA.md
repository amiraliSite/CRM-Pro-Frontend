# CRM Pro — فرانت‌اند (Next.js)

سورس کامل فرانت‌اند CRM.

- **آدرس سایت:** https://amiralisite.github.io/CRM-Pro-Frontend/
- **بک‌اند (API + دیتابیس):** ریپوی `amiraliSite/CRM-Pro` — روی Render اجرا می‌شود
  (https://crm-pro-backend-vfdi.onrender.com)

## اتصال فرانت به بک‌اند کجاست؟

آدرس بک‌اند موقع بیلد داخل خروجی «بیک» می‌شود:

- متغیر `NEXT_PUBLIC_API_URL` در اسکریپت دیپلوی (و بعداً در workflow)
- کدخوانی آن: `src/lib/api-base.ts` — همه‌ی درخواست‌ها با `apiUrl()` به همان آدرس می‌روند.
- بک‌اند CORS باز دارد (`src/middleware.ts` در ریپوی اصلی) — فرانت از هر دامنه‌ای مجاز به صدا زدن آن است.

## تغییر آدرس بک‌اند

اگر بک‌اند را روی آدرس دیگری بردی، فقط `NEXT_PUBLIC_API_URL` را در اسکریپت دیپلوی عوض کن و دوباره بیلد و پوش کن.

## دیپلوی چطوریه؟

- **فعلاً:** خروجی بیلد روی برنچ `gh-pages` آپلود می‌شود و Pages از همان برنچ سرو می‌کند.
- **به‌زودی (اختیاری):** فایل `.github/workflows-disabled/deploy-pages.yml.txt` آماده است؛ با توکنی که اسکوپ `workflow` دارد، آن را به `.github/workflows/deploy-pages.yml` منتقل کن تا هر push به `main` خودش بیلد و دیپلوی کند.

## اجرای محلی

```bash
npm install
npm run dev        # http://localhost:3000
```

برای اتصال فرانت محلی به بک‌اند، فایل `.env.local` بساز:
```
NEXT_PUBLIC_API_URL=https://crm-pro-backend-vfdi.onrender.com
```

## حساب‌های پیش‌فرض

| نقش | یوزرنیم | پسورد |
|---|---|---|
| مدیریت شرکت | admin | admin123 |
| مدیر بخش | manager | manager123 |
| مسئول IT | it | it123456 |
| مسئول فروش | sales | sales123 |
| پشتیبان | support | support123 |
| ادمین اینستاگرام | insta | insta123 |
