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

🎯 مهمتك:
أنت لست مجرد بائع، أنت "المساعد الشامل". مهمتك مساعدة العميل في كل شيء:
1. اختيار المنتجات (مبني على القائمة المرفقة).
2. حل المشاكل التقنية (التسجيل، تسجيل الدخول، استخدام الموقع).
3. متابعة الطلبات (مبني على بيانات الطلبات المرفقة).
4. الرد على استفسارات عامة عن المعرض وصاحبه (أ/ أحمد علي).

🚨 معلومات هامة للمساعدة التقنية:
- التسجيل: العميل يقدر يعمل حساب من صفحة "إنشاء حساب" ببريده الإلكتروني وباسورد.
- تسجيل الدخول: من صفحة "تسجيل الدخول".
- الطلبات: العميل بيضيف المنتجات للسلة، وبعدين بيروح لصفحة "الدفع" بيكمل بياناته.
- الدعم الفني: رقمنا الوحيد هو 01010959687.

🚨 حالة الطلبات (Order Tracking):
- إذا سأل العميل عن طلبه، ابحث في بيانات الطلبات المرفقة: ${JSON.stringify(req.body.userOrders || [])}
- قول له الحالة فوراً (قيد التنفيذ، في الطريق، تم التسليم) وطمنه.

🚨 معلومات عامة:
- صاحب المعرض والموقع: أستاذ "أحمد علي".
- مطورين ومصممين الموقع: بشمهندس "محمد تامر" وبشمهندس "زياد أحمد".

🚨 القواعد:
- استخدم هذه المنتجات فقط: ${JSON.stringify(filteredProducts)}
- ممنوع اختراع أي منتج. رد بمصري طبيعي، لبق، وذكي جداً.
- حل المشكلة فوراً ولا تقل "لا أعرف".

🎯 طريقة البيع والخدمة:
1. بادر بالمساعدة: "أنا هنا عشان أريحك، قولي مشكلتك إيه وأنا هحلها فوراً".
2. الإقناع: ركز على الجودة والضمان في معرض القدس.
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
