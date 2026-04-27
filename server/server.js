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
    const { messages, context } = req.body;
    
    // Extract user message
    const lastMessage = messages && messages.length > 0 ? messages[messages.length - 1] : null;
    const userMessage = typeof lastMessage?.content === 'string' ? lastMessage.content : 
                        (req.body?.message || "مرحبا");

    // Product and Cart context
    const productsInfo = context?.productsInfo || 'لا يوجد منتجات حالياً.';
    const cartInfo = context?.cartInfo || 'السلة فارغة.';
    const currentState = context?.conversationState || 'browsing';

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `أنت محمد بائع مصري ذكي وجدع في متجر "القدس للأدوات المنزلية".
هدفك: تفهم العميل، تقترح عليه منتجات من المتاحة، وتقفل البيع.
أسلوبك: مصري عامي بسيط، واثق، مش روبوت.
الرد: قصير جداً (2-3 سطور).

المعطيات الحالية:
الحالة: ${currentState}
المنتجات المتاحة: ${productsInfo}
سلة العميل: ${cartInfo}

رد في صيغة JSON فقط:
{ "reply": "نص الرد هنا", "state": "الحالة القادمة", "products": [] }`
        },
        {
          role: "user",
          content: userMessage
        }
      ],
      response_format: { type: "json_object" }
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content);
    const reply = aiResponse.reply;

    res.json({ 
      type: 'message',
      content: reply,
      products: aiResponse.products || [],
      state: aiResponse.state || currentState
    });

  } catch (err) {
    console.error("OpenAI Error:", err);
    res.json({
      type: 'message',
      content: "تمام يا فندم 👌 قولّي محتاج إيه وأنا أظبطك",
      products: [],
      state: 'browsing'
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
