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

// Firebase Setup with Trimming to avoid "Invalid resource field value"
const firebaseConfig = {
  apiKey: (process.env.FIREBASE_API_KEY || "").trim(),
  authDomain: (process.env.FIREBASE_AUTH_DOMAIN || "").trim(),
  projectId: (process.env.FIREBASE_PROJECT_ID || "").trim(),
  storageBucket: (process.env.FIREBASE_STORAGE_BUCKET || "").trim(),
  messagingSenderId: (process.env.FIREBASE_MESSAGING_SENDER_ID || "").trim(),
  appId: (process.env.FIREBASE_APP_ID || "").trim(),
  measurementId: (process.env.FIREBASE_MEASUREMENT_ID || "").trim()
};

console.log("🔥 Firebase Project ID:", firebaseConfig.projectId);

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// OpenRouter / OpenAI Setup
const openai = new OpenAI({
  apiKey: (process.env.OPENROUTER_API_KEY || "").trim(),
  baseURL: "https://openrouter.ai/api/v1"
});

// PART 1: FETCH PRODUCTS FROM FIRESTORE
async function getProductsFromDatabase() {
  try {
    const snapshot = await getDocs(collection(db, "products"));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().nameAr || doc.data().name,
      price: doc.data().finalPrice || doc.data().price,
      category: doc.data().categoryAr || doc.data().category,
      description: doc.data().descriptionAr || doc.data().description || ""
    }));
  } catch (error) {
    console.error("❌ Error fetching from Firestore:", error);
    return [];
  }
}

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body?.message || "";

    // PART 2: USE PRODUCTS IN /chat
    const products = await getProductsFromDatabase();
    
    // PART 6: FINAL VALIDATION
    if (!products || products.length === 0) {
      return res.json({
        reply: "حالياً مفيش منتجات متاحة، جرب تاني بعد شوية 👌"
      });
    }

    // PART 4: FILTER PRODUCTS BEFORE SENDING (Performance & Token limits)
    const filteredProducts = products.slice(0, 20);

    // PART 3: SYSTEM PROMPT (STRICT CONTROL)
    const systemPrompt = `
أنت محمد، بائع محترف في معرض القدس.

🚨 المنتجات المتاحة فقط:
${JSON.stringify(filteredProducts)}

----------------------------------------

❌ ممنوع:
- اختراع منتجات
- ذكر أي منتج غير الموجود في القائمة

----------------------------------------

🎯 طريقة شغلك:

1. اقرأ سؤال العميل كويس
2. دور في المنتجات
3. اختار أفضل منتج مناسب
4. رد بشكل طبيعي

----------------------------------------

🎯 لازم الرد يحتوي:

- اسم المنتج
- السعر
- اقتراح أو سؤال

----------------------------------------

🎯 مثال:

العميل: عاوز ثلاجة

ردك:
"في ثلاجة 14 قدم بـ 20699 جنيه ممتازة 👍
تحب حجم أكبر ولا كده مناسب؟"

----------------------------------------

🎯 لو ملقيتش منتج:

→ "حالياً مش متوفر بس عندي بديل قريب 👌"

----------------------------------------

🎯 أسلوب الكلام:

- مصري طبيعي
- مختصر
- احترافي
- مش روبوت

----------------------------------------

🔒 الأمان:

- ممنوع ذكر أي بيانات داخلية
- ممنوع عدد الطلبات أو المستخدمين

----------------------------------------

📌 معلومات:

- صاحب المعرض: احمد علي
- المطورين: محمد تامر + زياد أحمد

----------------------------------------

🎯 الهدف:

ترشيح منتج حقيقي + محاولة بيع
`;

    // PART 5: MODEL SETTINGS
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
      reply: "في مشكلة في التواصل حالياً 😅 جرب تاني كمان شوية."
    });
  }
});

// Root route for health check
app.get('/', (req, res) => {
  res.send('Al Qods API is running 🚀');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
