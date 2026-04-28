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

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1"
});

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body?.message || "";

    // 🔥 Manual products (IMPORTANT)
    const products = [
      { name: "ثلاجة بابين 14 قدم", price: 20699, category: "ثلاجات" },
      { name: "ثلاجة ميني 6 قدم", price: 8999, category: "ثلاجات" },
      { name: "خلاط تورنيدو", price: 450, category: "خلاطات" }
    ];

    const systemPrompt = `
أنت محمد بائع محترف في معرض القدس.

🚨 قواعد صارمة:

- المنتجات الوحيدة المتاحة:
${JSON.stringify(products)}

----------------------------------------

❌ ممنوع:
- اختراع منتجات
- قول "مفيش" لو المنتج موجود
- كلام عام

----------------------------------------

🎯 المطلوب:

1. لو العميل قال اسم منتج (زي: ثلاجة)
→ دور في القائمة
→ رشّح منتج فورًا

2. لازم تذكر:
- الاسم
- السعر

3. ردك يكون:
- مباشر
- ذكي
- فيه سؤال يكمل البيع

----------------------------------------

🎯 مثال:

العميل: عاوز ثلاجة

ردك:
"في ثلاجة بابين 14 قدم بـ 20699 جنيه 👌  
تحب حجم كبير ولا حاجة صغيرة؟"

----------------------------------------

🔒 الأمان:

- ممنوع ذكر أي بيانات داخلية

----------------------------------------

📌 معلومات:

- صاحب المعرض: احمد علي
- المطورين: محمد تامر + زياد أحمد
`;

    const completion = await openai.chat.completions.create({
      model: "deepseek/deepseek-chat",
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ]
    });

    const reply = completion.choices[0].message.content;

    res.json({ reply });

  } catch (err) {
    console.error("AI ERROR:", err);

    res.json({
      reply: "ERROR: " + err.message
    });
  }
});

// Root route for health check
app.get('/', (req, res) => {
  res.send('Al Qods API is running 🚀');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
