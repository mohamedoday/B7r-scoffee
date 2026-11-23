# كافيه بحر | BAHR LUXURY CAFÉ & ROASTERY (3D Web Platform)

## البنية المعمارية للمشروع (Enterprise File Architecture)
```text
Bahr_Cafe_Enterprise_Web/
├── index.html                        # الهيكل الدلالي الرئيسي (RTL Arabic Luxury UI)
├── package.json                      # تعريف الحزمة وأوامر التشغيل المحلي
├── README.md                         # دليل المطورين والتشغيل
├── docs/
│   └── ARCHITECTURE.md               # مخطط الهندسة البرمجية ونظام التشفير
└── src/
    ├── css/
    │   ├── tokens.css                # نظام الألوان البحرية والذهبية ومنحنيات الحركة
    │   ├── layout.css                # الشبكات المتجاوبة وتخطيط الأقسام
    │   ├── components.css            # البطاقات الزجاجية، التبويبات، والنوافذ المنبثقة
    │   └── motion.css                # حركات GPU المسرّعة ودعم prefers-reduced-motion
    └── js/
        ├── main.js                   # وحدة التحكم الرئيسية وإدارة الحالة
        ├── core/
        │   ├── cryptoVault.js        # تشفير السلة والحجوزات بخوارزمية AES-256-GCM
        │   └── sanitizer.js          # حماية ضد ثغرات XSS
        ├── data/
        │   └── drinksCatalog.js      # قاعدة بيانات 24 مشروباً بمواصفات مجسمات 3D
        └── engine/
            ├── drink3DEngine.js      # محرك Three.js لتوليد أكواب ومشروبات 3D تفاعلية
            ├── oceanBackdrop.js      # محرك الأمواج والجزيئات الذهبية في الخلفية
            └── oceanAudio.js         # مولد صوت أمواج البحر بتقنية Web Audio API
```

## طريقة التشغيل
1. فك الضغط عن الملف.
2. افتح المجلد عبر **VS Code Live Server** أو شغّل الأمر:
   ```bash
   npx serve .
   ```
   *(ملاحظة: يجب تشغيله عبر خادم محلي مثل Live Server لأن وحدات ES6 Modules تتطلب بروتوكول HTTP).*
