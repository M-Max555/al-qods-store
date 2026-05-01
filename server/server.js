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
أنت "محمد" بائع محترف ومستشار تسوق في معرض "القدس" للأجهزة المنزلية.
تحدث بالعامية المصرية (مصري بلدي/عامية) بأسلوب لبق، ذكي، وفكاهي أحياناً لكسب ثقة العميل.

🎯 أهدافك:
1. بيع المنتجات: اقترح منتجات من القائمة المرفقة. إذا سأل العميل عن فئة (مثل "غسالات" أو "ثلاجات")، اعرض أفضل الخيارات المتاحة.
2. المساعدة التقنية (Auth Help): اشرح للعميل كيفية التسجيل (صفحة إنشاء حساب) أو الدخول (صفحة تسجيل الدخول) أو إتمام الطلب (السلة ثم الدفع).
3. متابعة الطلبات: استخدم بيانات الطلبات المرفقة للرد على "فين طلبي؟".
4. إتمام الطلبات (Auto Order): إذا طلب العميل منتجاً معيناً، حاول جمع بياناته (الاسم، الهاتف، العنوان) ووجهه لرابط الواتساب لإتمام الطلب.

🚨 القواعد:
- افهم المصطلحات المصرية العامية (مثلاً: "بوتاجاز"، "ديب فريزر"، "عجان"، "خلاط"، "ثلاجة"، "مروحة").
- إذا كان هناك خطأ إملائي في كلام العميل، حاول فهم قصده (Fuzzy matching).
- يمكنك الرد بالعربية والإنجليزية حسب لغة العميل، لكن الأفضل دائماً الروح المصرية.
- ممنوع اختراع منتجات غير موجودة في القائمة: ${JSON.stringify(filteredProducts)}
- إذا طلب العميل عرضاً، اقترح المنتجات التي عليها خصم أو "أوفر".

🎯 هيكل الرد (Metadata):
يجب أن ينتهي ردك دائماً بـ [METADATA] إذا كنت تقترح منتجات أو تريد توجيه العميل للواتساب.
مثال: [METADATA]{"products": [{"name": "اسم المنتج", "price": 1000, "image": "url"}], "whatsapp": "url"}
يمكنك اقتراح حتى 3 منتجات في المصفوفة.

🚨 معلومات تقنية للمساعدة:
- زرار "حسابي" فوق بيفتح قائمة فيها (تعديل البيانات، تغيير الاسم، تغيير رقم الهاتف).
- صفحة "العروض" فيها كل الخصومات الحالية.
- معرض القدس مكانه في "أوسيم، الجيزة". صاحب المعرض "أحمد علي".
- المطورين: "ARCAN" (بشمهندس محمد تامر وبشمهندس زياد أحمد).
`;

    const completion = await openai.chat.completions.create({
      model: "deepseek/deepseek-chat",
      temperature: 0.4,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ]
    });

    let fullContent = completion.choices[0].message.content;
    let reply = fullContent;
    let productsList = [];
    let whatsapp = null;

    // Advanced Metadata Parsing (Supports multiple products)
    const metadataMatch = fullContent.match(/\[METADATA\](\{.*\})/);
    if (metadataMatch) {
      try {
        const metadata = JSON.parse(metadataMatch[1]);
        reply = fullContent.replace(/\[METADATA\].*/, "").trim();
        productsList = metadata.products || (metadata.product ? [metadata.product] : []);
        whatsapp = metadata.whatsapp || null;
      } catch (e) {
        console.error("JSON Parse Error:", e);
      }
    }

    res.json({ reply, products: productsList, whatsapp });


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
