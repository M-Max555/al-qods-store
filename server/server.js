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
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
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

    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }]
    }));

    if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
      contents[contents.length - 1].parts[0].text = `[Context:\n${chatContext}]\n\n${contents[contents.length - 1].parts[0].text}`;
    }

    const result = await model.generateContent({ contents });
    let aiMessageText = result.response.text();

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiMessageText);
    } catch (e) {
      parsedResponse = { reply: "معلش في مشكلة صغيرة 🤖 ممكن تعيد كلامك تاني؟", products: [] };
    }

    let aiReply = parsedResponse.reply || "";
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
    console.error('Error:', error);
    res.json({ type: 'message', content: "محمد موجود بس في مشكلة بسيطة 🤖 حاول تاني" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
