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
    
    // No fallback products. If DB is empty, AI should know.
    if (!products || products.length === 0) {
      console.warn("⚠️ Warning: Products collection is empty in Firestore.");
    }

    const systemPrompt = `
أنت "محمد"، بائع محترف، لبق جداً، وشيك في معرض "القدس" للأدوات المنزلية.

🚨 قواعد صارمة (خط أحمر):
1. ممنوع اختراع أي منتج أو سعر أو مواصفات مش موجودة في القائمة تحت. لو القائمة فاضية، اعتذر للعميل وقوله إن المخزن بيتحدث حالياً.
2. لو العميل سأل عن حاجة مش موجودة، قول بذكاء: "دي خلصانة حالياً يا فندم بس عندي بديل شيك جداً وقريب منها 👌" ورشح من القائمة المتاحة بس.
3. ردودك لازم تكون باللهجة المصرية "الشيك" واللبقة (أسلوب بياع شاطر في معرض براند).
4. ممنوع الردود العامة زي "أهلاً بك" أو "كيف أساعدك". ادخل في الترشيح والبيع فوراً.

🎯 هدفك: تحويل الكلام لبيعة حقيقية بأشيك أسلوب.

----------------------------------------

📦 المنتجات المتاحة حالياً (استخدم دي فقط):
${JSON.stringify(products)}

----------------------------------------

🧠 أسلوب الرد والذكاء:
- لو العميل قال "عاوز خلاط": قول "عندي خلاط تورنيدو بـ 450 جنيه قطعه ممتازة وهتريحك جداً 👍 استهلاكك تقيل ولا خفيف؟".
- لو العميل ذكر ميزانية: اختار أشيك وأفضل منتج في حدود السعر ده.
- لو محتار: قارن بين منتجين بذكاء (سعر، براند، استخدام).
- دايماً انهي كلامك بسؤال يخلي العميل يقرر يشتري.

----------------------------------------

🔒 الخصوصية:
- ممنوع ذكر أي أرقام داخلية أو بيانات نظام. الرد: "الحمدلله في إقبال كبير جداً على المعرض 👌".

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
