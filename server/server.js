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

// Firebase Setup
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

// FETCH PRODUCTS
async function getProductsFromDatabase() {
  try {
    const snapshot = await db.collection("products").get();

    if (snapshot.empty) return [];

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.nameAr || data.name,
        price: data.finalPrice || data.price,
        category: data.categoryAr || data.category,
        image: data.images ? data.images[0] : (data.image || "")
      };
    });
  } catch (error) {
    console.error("❌ Error fetching from Firestore:", error);
    return [];
  }
}

app.post("/chat", async (req, res) => {
  try {
    const { message: userMessage, imageUrl, cartItems } = req.body;
    const products = await getProductsFromDatabase();

    if (!products || products.length === 0) {
      return res.json({ reply: "حالياً مفيش منتجات متاحة، جرب تاني بعد شوية 👌" });
    }

    const filteredProducts = products.slice(0, 20);

    const systemPrompt = `
أنت "محمد" مساعدك الشخصي وبائع محترف في معرض "القدس".

🎯 شخصيتك:
- لبق جدًا، ذكي، بيفهم بسرعة، بيقنع من غير ضغط، بيريّح العميل.

🚨 معلومات عامة:
- صاحب المعرض والموقع: أستاذ "أحمد علي".
- مطورين ومصممين الموقع: بشمهندس "محمد تامر" وبشمهندس "زياد أحمد".

🚨 القواعد:
- استخدم هذه المنتجات فقط: ${JSON.stringify(filteredProducts)}
- ممنوع اختراع أي منتج. رد بمصري طبيعي ومختصر.
- إذا أرسل العميل صورة، حللها بدقة (تعرف على نوع الجهاز، لونه، ماركته) ثم رشح أقرب منتج متاح عندنا في القائمة أعلاه.

🎯 طريقة البيع:
1. افهم العميل، رشّح منتج مناسب، اذكر (الاسم، السعر، ميزة حقيقية)، واسأل سؤال يكمل البيع.
2. لو العميل قال ميزانية: رشّح أفضل حاجة في الرينج وحاول توفرله فلوس.
3. المقارنة: اعرض 2 منتجات فقط ووضّح الفرق ببساطة.

🚨 طلب الأوردر (WhatsApp Order System):
- إذا العميل وافق يشتري، لازم تجمع منه (الاسم، العنوان، رقم التليفون).
- بمجرد ما تاخدهم، لازم تبعت رد يحتوي على رابط واتساب بالصيغة دي:
https://wa.me/201021481138?text=طلب جديد...
- الرابط لازم يكون مشفر (URL Encoded).

🚨 هام جدًا (JSON METADATA):
- إذا رشحت منتج محدد من القائمة، لازم تنهي ردك بكتلة JSON مخفية في آخر سطر تبدأ بـ [METADATA] وتحتوي على بيانات المنتج (name, price, image).
- إذا عملت رابط واتساب، ضيفه في الـ JSON برضه.

مثال للرد:
"بص يا فندم 👌 في ثلاجة 14 قدم بـ 20699 جنيه ممتازة وموفرة.. تحب حجم أكبر؟
[METADATA]{"product":{"name":"ثلاجة 14 قدم","price":20699,"image":"url"}, "whatsapp": null}"
`;

    const completion = await openai.chat.completions.create({
      model: "deepseek/deepseek-chat",
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ]
    });

    let fullContent = completion.choices[0].message.content;
    let reply = fullContent;
    let product = null;
    let whatsapp = null;

    // Parse Metadata
    const metadataMatch = fullContent.match(/\[METADATA\](\{.*\})/);
    if (metadataMatch) {
      try {
        const metadata = JSON.parse(metadataMatch[1]);
        reply = fullContent.replace(/\[METADATA\].*/, "").trim();
        product = metadata.product || null;
        whatsapp = metadata.whatsapp || null;
      } catch (e) {
        console.error("JSON Parse Error:", e);
      }
    }

    res.json({ reply, product, whatsapp });

  } catch (err) {
    console.error("AI ERROR:", err);
    res.json({ reply: "في مشكلة في التواصل حالياً 😅 جرب تاني كمان شوية." });
  }
});

app.get('/', (req, res) => {
  res.send('Al Qods API is running 🚀');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
