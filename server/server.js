const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const OpenAI = require("openai");

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(express.json());

// Root route for health check
app.get('/', (req, res) => {
  res.send('Al Qods API is running 🚀');
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/chat", async (req, res) => {
  try {
    const userMessage =
      req.body?.message ||
      req.body?.messages?.[0]?.content ||
      "مرحبا";

    console.log("USER:", userMessage);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
أنت "محمد" بائع مصري محترف في متجر أدوات منزلية.

🎯 هدفك:
- تفهم العميل الأول
- ترشّح منتجات
- تقفل البيع

📌 قواعد:
- متكررّش نفس الجملة
- متبقاش روبوت
- رد مختصر (سطرين max)
- اسأل سؤال في الآخر

🔥 مثال:
العميل: عاوز خلاط
انت:
"تمام يا فندم 👌 تحب حاجة في حدود كام؟
عندي موديل ممتاز ومجرب"
`
        },
        {
          role: "user",
          content: userMessage
        }
      ]
    });

    const reply = completion.choices?.[0]?.message?.content;

    console.log("AI:", reply);

    if (!reply) {
      return res.json({
        reply: "تمام يا فندم 👌 قولّي محتاج إيه وأنا أظبطك"
      });
    }

    res.json({ reply });

  } catch (err) {
    console.error("OPENAI ERROR:", err);

    res.json({
      reply: "في مشكلة بسيطة دلوقتي يا فندم 😅 جرب تاني"
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
