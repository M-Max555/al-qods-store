import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import OpenAI from "openai";
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';

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

async function getProductsFromDatabase() {
  try {
    const q = query(collection(db, 'products'));
    const snapshot = await getDocs(q);
    const products = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        name: data.nameAr || data.name,
        price: data.finalPrice || data.price,
        category: data.categoryAr || data.category,
        description: data.descriptionAr || data.description,
        features: data.features || "",
        stock: data.stock || "متوفر"
      };
    });
    console.log(`✅ Success: Fetched ${products.length} products for AI knowledge`);
    return products;
  } catch (error) {
    console.error('❌ Error fetching products from Firebase:', error);
    return [];
  }
}

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1"
});

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body?.message || "مرحبا";
    let products = await getProductsFromDatabase();

    // No fallback products. If DB is empty, AI should know.
    if (!products || products.length === 0) {
      console.warn("⚠️ Warning: Products collection is empty in Firestore.");
    }

    console.log("PRODUCTS:", products);

    const systemPrompt = `
أنت محمد بائع في معرض القدس.

🚨 مهم جدًا:

دي المنتجات المتاحة عندك فقط:

${JSON.stringify(products)}

----------------------------------------

❌ ممنوع تقول "مش موجود"
❌ ممنوع تخترع منتجات
❌ ممنوع تتجاهل القائمة

----------------------------------------

🎯 المطلوب:

- لو العميل قال "ثلاجة"
→ دور في القائمة على أي منتج فيه "ثلاجة"
→ رشحه مباشرة

----------------------------------------

لو لقيت منتجات:
→ لازم ترشح واحد منهم

لو ملقيتش:
→ قول: "مش متوفر حالياً"

----------------------------------------

🎯 مثال:

لو عندك:
"ثلاجة بابين لون أسود"

والعميل قال:
"عاوز ثلاجة"

لازم ترد:

"في ثلاجة بابين لون أسود بـ 20699 جنيه 👌 تحب تفاصيل أكتر؟"

----------------------------------------

🎯 ممنوع الرد العام:
زي "عندنا أجهزة كتير"

----------------------------------------

🎯 هدفك:
ترشيح منتج من القائمة فقط
`;

    const completion = await openai.chat.completions.create({
      model: "openchat/openchat-7b",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ]
    });

    let reply = completion.choices[0].message.content;
    let whatsapp = null;

    console.log("USER:", userMessage);
    console.log("AI:", reply);

    // Order Detection & WhatsApp Link Generation
    if (reply.includes("ORDER_CONFIRMED") || (userMessage.includes("اسمي") && userMessage.includes("العنوان") && userMessage.includes("رقم"))) {
      const orderText = `طلب جديد من متجر القدس 🔥\n\nالبيانات: ${userMessage}`;
      // رقم واتساب المعرض (يجب استبداله بالرقم الحقيقي)
      whatsapp = `https://wa.me/201234567890?text=${encodeURIComponent(orderText)}`;
      reply = reply.replace("ORDER_CONFIRMED", "").trim();

      if (!reply || reply.length < 5) {
        reply = "تمام يا فندم 👌 طلبك جاهز.. كمل معايا على واتساب عشان نأكد الشحن.";
      }
    }

    res.json({ reply, whatsapp });

  } catch (err) {
    console.error("FULL ERROR:", err);

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
