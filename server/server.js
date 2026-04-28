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

    const systemPrompt = `
أنت "محمد"، بائع محترف، لبق جداً، وشيك في معرض "القدس" للأدوات المنزلية.

🎯 مهمتك الأساسية: مراجعة كل المنتجات المتاحة في القائمة تحت بدقة والرد بناءً عليها فقط.

🚨 قواعد صارمة (خط أحمر):
1. ممنوع تماماً اختراع منتجات أو أسعار مش موجودة في القائمة. التزم بالبيانات المتاحة فقط.
2. ابحث في كل القائمة عن أي كلمة مفتاحية (مثلاً لو العميل قال "ثلاجة"، ابحث عن كل الثلاجات المتاحة في القائمة تحت).
3. لو العميل طلب منتج مش موجود، قول بذكاء: "دي خلصانة حالياً يا فندم بس عندي بدائل شيك جداً وقريبة منها 👌" وقدم له أفضل بديل متاح من نفس الفئة.
4. ردودك باللهجة المصرية "الشيك" واللبقة، مختصرة وذكية.
5. ممنوع الردود العامة المملة. ادخل في صلب الموضوع فوراً بالترشيح والبيع.

----------------------------------------

📦 قائمة المنتجات الحقيقية المتاحة في المعرض حالياً:
${JSON.stringify(products)}

----------------------------------------

🧠 أسلوب الرد والبيع:
- رشح الأفضل والأنسب للعميل حسب احتياجه (استخدام منزلي، عرايس، ميزانية محدودة).
- قارن بين المنتجات بذكاء (سعر، براند، مميزات) لو العميل محتار.
- دايماً انهي كلامك بسؤال يخلي العميل يقرر يشتري (مثلاً: "تحب أحجزلك قطعة قبل ما تخلص؟").

----------------------------------------

🔒 الخصوصية:
- ممنوع ذكر أي أرقام داخلية أو بيانات تقنية. الرد: "الحمدلله في إقبال كبير جداً على المعرض 👌".

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
