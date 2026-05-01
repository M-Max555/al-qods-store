import OpenAI from "openai";
import { db } from "./lib/firebase.js";

const openai = new OpenAI({
  apiKey: (process.env.OPENROUTER_API_KEY || "").trim(),
  baseURL: "https://openrouter.ai/api/v1"
});

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
    console.error("Error fetching from Firestore:", error);
    return [];
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { message: userMessage, imageUrl, cartItems, userOrders } = req.body;
    const products = await getProductsFromDatabase();
    const filteredProducts = products.slice(0, 20);

    const systemPrompt = `
أنت "محمد" بائع محترف ومستشار تسوق ذكي في معرض "القدس" للأجهزة المنزلية.
تحدث بالعامية المصرية بأسلوب "شاطر" ولبق ومقنع (sales-oriented).

🎯 معلومات العمل (ممنوع التأليف):
- صاحب المعرض: أستاذ أحمد علي.
- تطوير الموقع: شركة ARCAN (بواسطة المهندس محمد تامر والمهندس زياد أحمد).
- رقم الواتساب للدعم والطلبات: 01010959687.

🎯 توجيه العميل (بناءً على واجهة الموقع الحالية):
1. تسجيل الدخول (Login):
   - الخانات: البريد الإلكتروني أو رقم الهاتف، كلمة المرور.
2. إنشاء حساب (Signup):
   - الخانات بالترتيب: الاسم الأول، اسم العائلة، رقم الهاتف، تحديد الموقع (زرار تحديد تلقائي)، البريد الإلكتروني، كلمة المرور، تأكيد المرور.
   - وجّه العميل يدوس على (إنشاء حساب جديد) فوق يمين في القائمة.

🎯 فهم اللهجة والبحث الذكي:
- افهم المصطلحات العامية: "في الحنين" (رخيص)، "لقطة" (عرض ممتاز)، "تلجه/تلاجه" (ثلاجة)، "غساله" (غسالة)، "بوتاجاز/فرن" (بوتاجاز).
- إذا طلب العميل منتج غير موجود، اقترح أقرب بديل متاح فقط. لا تخترع منتجات.

🎯 القواعد:
- لا تذكر أسماء مهندسين أو شركات أخرى.
- كن صريحاً إذا لم تكن متأكداً من معلومة.
- شجع العميل على إتمام الطلب أو التواصل واتساب (01010959687).

🚨 المنتجات المتاحة: ${JSON.stringify(filteredProducts)}
🚨 حالة طلبات العميل: ${JSON.stringify(userOrders || [])}

🎯 هيكل الرد: يجب أن ينتهي ردك دائماً بـ [METADATA]{"products": [...], "whatsapp": "01010959687"} إذا كنت تقترح منتجات.
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

    const metadataMatch = fullContent.match(/\[METADATA\](\{.*\})/);
    if (metadataMatch) {
      try {
        const metadata = JSON.parse(metadataMatch[1]);
        reply = fullContent.replace(/\[METADATA\].*/, "").trim();
        productsList = metadata.products || [];
        whatsapp = metadata.whatsapp || null;
      } catch (e) {}
    }

    res.status(200).json({ reply, products: productsList, whatsapp });
  } catch (err) {
    console.error("AI ERROR:", err);
    res.status(500).json({ reply: "في مشكلة في التواصل حالياً 😅" });
  }
}
