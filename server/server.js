import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import OpenAI from "openai";
import admin from "firebase-admin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(express.json());

// PART 2: SETUP FIREBASE ADMIN
try {
  if (!admin.apps.length) {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      throw new Error("MISSING FIREBASE_SERVICE_ACCOUNT in .env");
    }
    
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
    console.log("✅ Firebase Admin initialized successfully");
  }
} catch (error) {
  console.error("❌ Firebase Admin Init Error:", error.message);
}

const db = admin.firestore();

// OpenRouter / OpenAI Setup
const openai = new OpenAI({
  apiKey: (process.env.OPENROUTER_API_KEY || "").trim(),
  baseURL: "https://openrouter.ai/api/v1"
});

// PART 3: FETCH PRODUCTS
async function getProductsFromDatabase() {
  try {
    console.log("🔍 Fetching products from Firestore (Admin SDK)...");
    const snapshot = await db.collection("products").get();

    if (snapshot.empty) {
      console.log("⚠️ NO PRODUCTS FOUND IN FIRESTORE");
      return [];
    }

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

    console.log(`✅ TOTAL PRODUCTS FETCHED: ${products.length}`);
    return products;
  } catch (error) {
    console.error("❌ Error fetching from Firestore:", error);
    return [];
  }
}

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body?.message || "";

    const products = await getProductsFromDatabase();
    
    // PART 4 & 5: DEBUG & VALIDATION
    console.log("📊 TOTAL PRODUCTS FOR AI:", products.length);

    if (!products || products.length === 0) {
      return res.json({
        reply: "حالياً مفيش منتجات متاحة، جرب تاني بعد شوية 👌"
      });
    }

    const filteredProducts = products.slice(0, 20);

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
