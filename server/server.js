import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import OpenAI from "openai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(express.json());

// Root route for health check
app.get('/', (req, res) => {
  res.send('Al Qods API is running 🚀');
});

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1"
});

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body?.message || "مرحبا";

    console.log("USER:", userMessage);

    const completion = await openai.chat.completions.create({
      model: "deepseek/deepseek-chat",
      messages: [
        {
          role: "system",
          content: `
أنت "محمد" – أفضل بياع في معرض القدس للأدوات المنزلية.
صاحب المعرض: أ/ أحمد علي.
المطورين: بشمهندس محمد تامر + بشمهندس زياد أحمد.

🎯 هدفك: تحويل أي محادثة لعملية شراء حقيقية.

🎯 الشخصية:
- مصري لبق وشيك، احترافي جداً، واثق في كلامه وذكي.
- ابعد عن الردود المعلبة (زي "كيف أساعدك")، ادخل في الموضوع فوراً بذكاء.
- ردودك مختصرة (سطرين بالكتير) ومفيدة جداً.

🎯 قواعد البيع:
1. لو العميل سأل عن منتج: رشح له أحسن موديل عندنا فوراً واسأله عن استخدامه.
2. لو العميل سأل عن سعر أو ميزانية: اقترح له "أفضل قيمة مقابل سعر" واسأله محتاجه امتى.
3. لو محتار: قارن بين منتجين ووضح ميزة كل واحد عشان يقرر.
4. لو العميل جاهز يشتري: اطلب منه (الاسم، رقم التليفون، العنوان، المنتج) بأسلوب طبيعي في الكلام.

🎯 ملاحظة تقنية:
- لما العميل يبعت بياناته (الاسم والعنوان ورقم التليفون)، لازم تنهي ردك بكلمة "ORDER_CONFIRMED" في آخر الرسالة عشان السيستم يسجل الطلب.
`
        },
        {
          role: "user",
          content: userMessage
        }
      ]
    });

    let reply = completion.choices[0].message.content;
    let whatsapp = null;

    console.log("AI:", reply);

    // Order Detection Logic
    if (reply.includes("ORDER_CONFIRMED") || (userMessage.includes("اسمي") && userMessage.includes("العنوان"))) {
      const orderText = `طلب جديد من معرض القدس 🔥\n\nالبيانات: ${userMessage}`;
      whatsapp = `https://wa.me/201012345678?text=${encodeURIComponent(orderText)}`;
      reply = reply.replace("ORDER_CONFIRMED", "").trim();
      
      if (!reply || reply.length < 5) {
        reply = "تم تأكيد طلبك يا فندم 👌 هنكلمك قريب للتأكيد.";
      }
    }

    res.json({ reply, whatsapp });

  } catch (err) {
    console.error("OPENROUTER ERROR:", err);
    res.json({
      reply: "في مشكلة بسيطة يا فندم 😅 جرب تاني"
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
