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
تحدث بالعامية المصرية بأسلوب "شاطر" ولبق ومقنع.

🎯 معلومات العمل:
- صاحب المعرض: أستاذ أحمد علي.
- تطوير الموقع: شركة ARCAN.
- رقم الواتساب الموحد: 01010959687.

🎯 قواعد زرار الواتساب (هام جداً):
1. أضف زرار الواتساب فقط في الحالات التالية:
   - عرض منتجات للبيع أو تأكيد طلب (Label: "تأكيد الطلب عبر واتساب").
   - مساعدة في التسجيل، الدخول، أو مشكلة فنية (Label: "تواصل مع الدعم الفني").
2. لا تضف الزرار في الردود العامة أو الدردشة العادية.

🎯 توجيه العميل:
- تسجيل الدخول: (البريد/الهاتف، كلمة المرور).
- إنشاء حساب: (الاسم الأول، العائلة، الهاتف، الموقع، البريد، كلمة المرور، تأكيدها).

🚨 المنتجات المتاحة: ${JSON.stringify(filteredProducts)}
🚨 حالة طلبات العميل: ${JSON.stringify(userOrders || [])}

🎯 هيكل الرد (METADATA):
يجب أن يكون بصيغة JSON في نهاية الرد:
[METADATA]{"products": [...], "whatsapp": "01010959687", "whatsappLabel": "..."}
أضف "whatsapp" و "whatsappLabel" فقط عند الحاجة كما ذكرت في القواعد.
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
    let whatsappLabel = null;

    const metadataMatch = fullContent.match(/\[METADATA\](\{.*\})/);
    if (metadataMatch) {
      try {
        const metadata = JSON.parse(metadataMatch[1]);
        reply = fullContent.replace(/\[METADATA\].*/, "").trim();
        productsList = metadata.products || [];
        whatsapp = metadata.whatsapp || null;
        whatsappLabel = metadata.whatsappLabel || null;
      } catch (e) {}
    }

    res.status(200).json({ reply, products: productsList, whatsapp, whatsappLabel });
  } catch (err) {
    console.error("AI ERROR:", err);
    res.status(500).json({ reply: "في مشكلة في التواصل حالياً 😅" });
  }
}
