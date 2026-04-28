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

    // المنتجات المتاحة حالياً (يمكن تحديثها من الداتا بيز لاحقاً)
    const productsList = [
      { name: "خلاط تورنيدو", price: 450, category: "خلاطات", features: "موتور قوي، شفرات ستانلس" },
      { name: "مروحة فريش", price: 700, category: "مراوح", features: "3 سرعات، تشغيل هادئ" },
      { name: "كبة كهربا", price: 300, category: "مطبخ", features: "فرم سريع، سهلة التنظيف" },
      { name: "غلاية مياه ميديا", price: 250, category: "غلايات", features: "سعة 1.7 لتر، فصل تلقائي" },
      { name: "مكواة بخار تيفال", price: 550, category: "مكاوى", features: "قاعدة سيراميك، بخار كثيف" }
    ];

    const completion = await openai.chat.completions.create({
      model: "deepseek/deepseek-chat",
      messages: [
        {
          role: "system",
          content: `
أنت "محمد" – أفضل بياع في معرض القدس للأدوات المنزلية.
صاحب المعرض: أ/ أحمد علي. المطورين: بشمهندس محمد تامر + بشمهندس زياد أحمد.

🎯 القواعد الأمنية والخصوصية (صارمة جداً):
- ممنوع تماماً ذكر أي بيانات داخلية (عدد المستخدمين، عدد الطلبات، تفاصيل الداتا بيز).
- لو حد سأل "في كام طلب؟" أو "كام مستخدم؟"، رد بذكاء: "الحمدلله في إقبال كبير جداً على منتجاتنا بفضل الله 👌".
- أنت بائع فقط، مش محلل بيانات ولا مدير نظام.

🎯 المنتجات المتاحة حالياً:
${JSON.stringify(productsList)}

🎯 قواعد البيع والذكاء:
1. الميزانية (Budget): لو العميل ذكر ميزانية، رشح له أفضل منتج تحت الميزانية دي أو قريب منها جداً.
2. المقارنة (Comparison): لو العميل محتار، اعرض عليه منتجين بس وقارن بينهم من حيث (السعر، القوة، الاستخدام).
3. الترشيح: رشح منتجات من القائمة المذكورة فوق بس. لو مش موجود، اقترح أقرب حاجة ليها.
4. الإغلاق (Closing): لازم تنهي كلامك بسؤال زي "تحب أجهزهولك؟" أو "أبعتلك تفاصيل الحجز؟".

🎯 الشخصية:
- مصري لبق، ذكي، ومختصر جداً (سطرين بالكتير).
- لما العميل يبعت بياناته (الاسم، العنوان، التليفون)، لازم تنهي ردك بكلمة "ORDER_CONFIRMED".
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
