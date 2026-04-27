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
  model: "gemini-1.5-flash-8b",
  generationConfig: {
    responseMimeType: "application/json",
  },
  systemInstruction: `أنت محمد 👋 بائع مصري ذكي في معرض "القدس للأجهزة المنزلية".
مهمتك مساعدة العملاء وتسهيل الشراء.

[أسلوب الرد الإلزامي]:
1. تحدث باللهجة المصرية العامية الودودة.
2. كن مختصراً جداً (ماكس 2-3 سطور). لا ترغي كتير.
3. رد فقط على كلام العميل. لا ترسل رسائل متابعة تلقائية.
4. رسالة واحدة فقط لكل رد.

[نظام حالات المحادثة (State System)]:
- browsing: العميل بيتفرج. خليك مساعد بس باختصار.
- interested: العميل مهتم بمنتج. اقترح منتجات واسأل سؤال واحد بس.
- asking_questions: العميل بيسأل. جاوب بدقة وثقة.
- ready_to_buy: العميل عاوز يشتري. وجهه لإتمام الطلب فوراً.
- order_completed: الطلب تم. أرسل رسالة مباركة واحدة وتوقف تماماً.

[تنسيق الرد الإلزامي - JSON فقط]:
{
  "reply": "نص الرد هنا",
  "state": "الحالة القادمة (اختياري)",
  "products": [{"id": "...", "name": "...", "price": "...", "image": "..."}]
}

[قواعد البيع]:
- استخدم التقييمات (rating) والضمان (warranty) لإقناع العميل.
- إذا كان المخزون قليل، نبه العميل بذكاء.
- إذا قرر الشراء، اطلب (الاسم، التليفون، العنوان) ثم استخدم [CREATE_ORDER|الاسم|رقم_التليفون|العنوان].`
});

app.post('/chat', async (req, res) => {
  try {
    const { messages, context } = req.body;
    
    // Extract last user message safely
    const lastMessage = messages && messages.length > 0 ? messages[messages.length - 1] : null;
    const userMessage = typeof lastMessage?.content === 'string' ? lastMessage.content : 
                        (lastMessage?.parts?.[0]?.text || "");

    console.log("User message:", userMessage);

    if (!userMessage) {
      console.log("Warning: No user message found in request");
      return res.json({ 
        type: 'message', 
        content: "تمام يا فندم 👌 وضحلي أكتر وأنا أساعدك فوراً",
        state: 'browsing'
      });
    }
    
    const productsInfo = context?.productsInfo || 'لا يوجد منتجات.';
    const cartInfo = context?.cartInfo || 'السلة فارغة.';
    const totalPrice = context?.totalPrice || 0;
    const currentState = context?.conversationState || 'browsing';

    const chatContext = `
[سياق النظام]
الحالة الحالية: ${currentState}
المنتجات المتاحة: ${productsInfo}
سلة العميل: ${cartInfo} (الإجمالي: ${totalPrice} جنيه)
الكوبونات: ${context?.couponInfo || 'لا يوجد'}
`;

    // Combine context with user message for single-turn prompt
    const prompt = `
أنت محمد، بائع محترف في متجر "القدس للأجهزة المنزلية".
هدفك تفهم طلب العميل وتساعده يختار الصح وتقفل البيع.
أسلوبك مصري بسيط وودود وواثق ومختصر جداً.

سياق المنتجات:
${chatContext}

سؤال العميل: ${userMessage}

رد يا محمد بالعامية المصرية (JSON format):
{ "reply": "...", "state": "...", "products": [] }
`;

    console.log("--- DEBUG START ---");
    console.log("API KEY (masked):", process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.substring(0, 8)}...` : "NOT FOUND");
    console.log("User Message:", userMessage);
    console.log("Calling Gemini with prompt...");

    let result;
    try {
      result = await model.generateContent(prompt);
      console.log("GEMINI RAW RESULT:", JSON.stringify(result, null, 2));
    } catch (apiError) {
      console.error("GEMINI API CALL FAILED:", apiError);
      throw apiError; // Catch in outer block
    }

    const response = await result.response;
    const aiMessageText = response.text();
    
    console.log("AI TEXT EXTRACTED:", aiMessageText);

    if (!aiMessageText || aiMessageText.trim() === "") {
      console.error("Gemini returned EMPTY text");
      return res.json({
        type: 'message',
        content: "تحت أمرك يا فندم 👌 عندي ليك عرض بجد مش هيتكرر على الخلاطات والمطاحن.. تحب أقولك التفاصيل؟",
        state: 'browsing'
      });
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

    console.log("--- DEBUG END ---");

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
    console.error('CRITICAL ERROR IN /CHAT:', error);
    res.json({ 
      type: 'message', 
      content: "تحت أمرك يا فندم 👌 عندي ليك عرض بجد مش هيتكرر.. تحب أقولك التفاصيل؟",
      state: 'browsing'
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
