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
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      name: doc.data().nameAr || doc.data().name,
      price: doc.data().finalPrice || doc.data().price,
      category: doc.data().categoryAr || doc.data().category,
      description: doc.data().descriptionAr || doc.data().description
    }));
  } catch (error) {
    console.error('Error fetching products from Firebase:', error);
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

    // Fallback products if database is empty to prevent hallucination
    if (!products || products.length === 0) {
      products = [
        { name: "خلاط تورنيدو", price: 450, category: "خلاطات", description: "قوي للاستخدام اليومي وموتور متين" },
        { name: "مروحة فريش", price: 700, category: "مراوح", description: "هدوء تام وتوزيع هواء ممتاز" },
        { name: "كبة كهربا", price: 300, category: "مطبخ", description: "فرم سريع جداً وسهلة التنظيف" },
        { name: "غلاية مياه ميديا", price: 250, category: "غلايات", description: "سعة 1.7 لتر وفصل تلقائي" }
      ];
    }

    const systemPrompt = `
أنت محمد، بائع محترف وذكي في متجر "القدس".

🚨 قواعد صارمة (ممنوع مخالفتها):
- ممنوع اختراع أي منتج مش موجود في القائمة تحت. لو المنتج مش موجود، قول: "مش موجود حالياً بس عندي بديل قريب 👌" ورشح بديل من القائمة.
- ممنوع الردود العامة المملة (زي "أهلاً بك"، "كيف أساعدك"، "عندنا كل حاجة").
- الرد لازم يكون مباشر وذكي: رشح منتج فوراً واسأل سؤال يكمل البيع.

🎯 هدفك: تحويل الكلام لبيعة حقيقية.

----------------------------------------

📦 المنتجات المتاحة (استخدم دي فقط):
${JSON.stringify(products)}

----------------------------------------

🧠 أسلوب الرد:
- لو العميل قال "عاوز خلاط": متقولش "تحت أمرك"، قول "عندي خلاط تورنيدو بـ 450 جنيه ممتاز 👍 استهلاكك تقيل ولا خفيف؟".
- لو العميل ذكر ميزانية: اختار أفضل منتج في حدود السعر ده.
- لو محتار: قارن بين منتجين بس (سعر، قوة، استخدام).

----------------------------------------

🔒 الأمان والخصوصية:
- ممنوع ذكر عدد الطلبات أو المستخدمين أو أي بيانات داخلية.
- الرد الوحيد: "الحمدلله في إقبال كبير جداً على المعرض 👌".

----------------------------------------

🛒 إتمام الطلب:
لو العميل جاهز، اطلب (الاسم، العنوان، التليفون).
لما يبعت البيانات، أنهي ردك بكلمة ORDER_CONFIRMED.
`;

    const completion = await openai.chat.completions.create({
      model: "deepseek/deepseek-chat",
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
    console.error("AI ERROR:", err);
    res.json({
      reply: "في مشكلة بسيطة في التواصل دلوقتي 😅 جرب تاني كمان شوية."
    });
  }
});

// Root route for health check
app.get('/', (req, res) => {
  res.send('Al Qods API is running 🚀');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
