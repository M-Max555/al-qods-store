const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(express.json());

// Root route for health check
app.get('/', (req, res) => {
  res.send('Al Qods API is running 🚀');
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Debugging API Key (Masked for safety)
const apiKey = process.env.GEMINI_API_KEY;
console.log("GEMINI_API_KEY status:", apiKey ? `Present (Starts with: ${apiKey.substring(0, 5)}...)` : "MISSING");

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash"
});

app.post('/chat', async (req, res) => {
  try {
    const { messages, context } = req.body;
    
    // Extract last user message safely
    const lastMessage = messages && messages.length > 0 ? messages[messages.length - 1] : null;
    const userMessage = typeof lastMessage?.content === 'string' ? lastMessage.content : 
                        (lastMessage?.parts?.[0]?.text || "");

    if (!userMessage) {
      return res.json({ 
        type: 'message', 
        content: "تحت أمرك يا فندم 👌 أؤمرني محتاج مساعدة في إيه؟",
        state: 'browsing'
      });
    }
    
    const productsInfo = context?.productsInfo || 'لا يوجد منتجات.';
    const cartInfo = context?.cartInfo || 'السلة فارغة.';
    const totalPrice = context?.totalPrice || 0;
    const currentState = context?.conversationState || 'browsing';

    const chatContext = `
الحالة: ${currentState}
المنتجات: ${productsInfo}
السلة: ${cartInfo} (الإجمالي: ${totalPrice} جنيه)
الكوبونات: ${context?.couponInfo || 'لا يوجد'}
`;

    const prompt = `
أنت "محمد" بائع مصري شاطر في متجر "القدس للأدوات المنزلية".

قواعد مهمة جداً:
1. افهم سؤال العميل الأول كويس جداً قبل ما ترد.
2. رد على سؤاله بشكل مباشر وبلهجة مصرية طبيعية جداً.
3. بعد ما ترد، حاول بذكاء تبيع أو تقترح منتج مناسب بناءً على المعطيات.
4. ممنوع تكرر نفس الجملة في كل رد. نوع في أسلوبك.
5. خليك بشري وجدع مش روبوت.
6. الرد يكون قصير (2-3 سطور بالكتير).

سياق المتجر (المنتجات والعروض):
${chatContext}

سؤال العميل: ${userMessage}

رد يا محمد بأسلوب مختلف (JSON فقط):
{ "reply": "...", "state": "...", "products": [] }
`;

    console.log("Calling Gemini API (1.5-flash)...");
    const result = await model.generateContent(prompt);
    const aiMessageText = result.response.text();
    
    console.log("AI TEXT:", aiMessageText);

    if (!aiMessageText) {
      throw new Error("Empty response from Gemini");
    }

    let parsedResponse;
    try {
      if (aiMessageText.includes('{') && aiMessageText.includes('}')) {
        const jsonStart = aiMessageText.indexOf('{');
        const jsonEnd = aiMessageText.lastIndexOf('}') + 1;
        parsedResponse = JSON.parse(aiMessageText.substring(jsonStart, jsonEnd));
      } else {
        parsedResponse = { reply: aiMessageText, products: [] };
      }
    } catch (e) {
      console.error("Parse error:", e);
      parsedResponse = { reply: aiMessageText, products: [] };
    }

    let aiReply = parsedResponse.reply || aiMessageText;
    const aiProducts = parsedResponse.products || [];
    const nextState = parsedResponse.state || currentState;

    const orderMatch = aiReply.match(/\[CREATE_ORDER\|(.*?)\|(.*?)\|(.*?)\]/);
    if (orderMatch) {
      const name = orderMatch[1].trim();
      const phone = orderMatch[2].trim();
      const address = orderMatch[3].trim();
      aiReply = aiReply.replace(orderMatch[0], "").trim();

      res.json({
        type: 'message_with_action',
        content: aiReply,
        products: aiProducts,
        state: 'order_completed',
        action: {
          type: 'create_order',
          payload: { name, phone, address }
        }
      });
      return;
    }

    res.json({
      type: 'message',
      content: aiReply,
      products: aiProducts,
      state: nextState
    });

  } catch (error) {
    console.error('Gemini Migration Error:', error);
    res.json({ 
      type: 'message', 
      content: "تحت أمرك يا فندم 👌 عندي ليك عروض ممتازة النهاردة.. تحب أعرضلك حاجة معينة؟",
      state: 'browsing'
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
