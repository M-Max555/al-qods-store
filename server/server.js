import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import OpenAI from "openai";
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(express.json());

// Firebase Setup
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === 'your_openrouter_api_key_here') {
  console.error("❌ CRITICAL: OPENROUTER_API_KEY is missing or not set in server/.env");
}

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1"
});

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body?.message || "";

    // PART 1: CONNECT FIREBASE PRODUCTS
    const snapshot = await getDocs(collection(db, "products"));
    const products = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.nameAr || data.name,
        price: data.finalPrice || data.price,
        category: data.categoryAr || data.category,
        description: data.descriptionAr || data.description || ""
      };
    });

    // PART 4: VALIDATION
    if (!products || products.length === 0) {
      return res.json({
        reply: "حالياً المنتجات مش متاحة، جرب تاني بعد شوية 👌"
      });
    }

    // PART 2: SYSTEM PROMPT
    const systemPrompt = `
أنت محمد، بائع محترف جدًا في معرض القدس.

🎯 شخصيتك:
- ذكي
- سريع
- لبق
- بتتكلم مصري طبيعي (مش روبوت)

----------------------------------------

🚨 قواعد صارمة:

- استخدم المنتجات دي فقط:
${JSON.stringify(products)}

- ممنوع اختراع أي منتج
- ممنوع تقول "مفيش" لو المنتج موجود
- لو المنتج مش موجود → اقترح أقرب حاجة من القائمة

----------------------------------------

🎯 طريقة الرد:

1. افهم السؤال كويس
2. رشّح منتج حقيقي من القائمة
3. اذكر:
   - اسم المنتج
   - السعر
4. اسأل سؤال يكمل البيع

----------------------------------------

🎯 أسلوب الكلام:

❌ غلط:
"كيف أساعدك"

❌ غلط:
"عندنا منتجات كثيرة"

✅ صح:
"في ثلاجة 14 قدم بـ 20699 جنيه ممتازة 👍 تحب حجم أكبر ولا كده مناسب؟"

----------------------------------------

🎯 المقارنة:

لو العميل محتار:
→ اعرض 2 منتجات فقط
→ وقارن بينهم بشكل بسيط

----------------------------------------

🎯 الميزانية:

لو العميل قال ميزانية:
→ اختار أفضل منتج قريب منها

----------------------------------------

🔒 الأمان:

- ممنوع ذكر أي بيانات داخلية
- ممنوع ذكر عدد المستخدمين أو الطلبات

لو اتسألت:
→ "الحمدلله في إقبال كبير جدًا 👌"

----------------------------------------

📌 معلومات ثابتة:

- صاحب المعرض: احمد علي
- المطورين: محمد تامر + زياد أحمد

----------------------------------------

🎯 الهدف:

تحويل أي سؤال → ترشيح منتج → محاولة بيع
`;

    // PART 3: MODEL SETTINGS
    const completion = await openai.chat.completions.create({
      model: "deepseek/deepseek-chat",
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ]
    });

    const reply = completion.choices[0].message.content;

    res.json({ reply });

  } catch (err) {
    console.error("AI ERROR:", err);
    res.json({
      reply: "ERROR: " + err.message
    });
  }
});

// Root route for health check
app.get('/', (req, res) => {
  res.send('Al Qods API is running 🚀');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
