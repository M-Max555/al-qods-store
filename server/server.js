import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import OpenAI from "openai";
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(express.json());

// Firebase Setup
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

async function getProductsFromDatabase() {
  try {
    const q = query(collection(db, 'products'));
    const snapshot = await getDocs(q);
    const products = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        name: data.nameAr || data.name,
        price: data.finalPrice || data.price,
        category: data.categoryAr || data.category,
        description: data.descriptionAr || data.description,
        features: data.features || "",
        stock: data.stock || "متوفر"
      };
    });
    console.log(`✅ Success: Fetched ${products.length} products for AI knowledge`);
    return products;
  } catch (error) {
    console.error('❌ Error fetching products from Firebase:', error);
    return [];
  }
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body?.message || "";

    const products = await getProductsFromDatabase();

    const systemPrompt = `
أنت محمد بائع محترف في معرض القدس.

🚨 مهم:

- استخدم المنتجات دي فقط:
${JSON.stringify(products)}

- ممنوع اختراع منتجات
- لو العميل قال "ثلاجة" → رشّح من القائمة

----------------------------------------

🎯 البيع:

- رد مباشر
- رشّح منتج
- اسأل سؤال يكمل البيع

----------------------------------------

🔒 الأمان:

- ممنوع ذكر أي بيانات داخلية

----------------------------------------

📌 معلومات:

- صاحب المعرض: احمد علي
- المطورين: محمد تامر + زياد أحمد
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ]
    });

    const reply = completion.choices[0].message.content;

    res.json({ reply });

  } catch (err) {
    console.error("OPENAI ERROR:", err);

    res.json({
      reply: "في مشكلة بسيطة 😅 جرب تاني"
    });
  }
});

// Root route for health check
app.get('/', (req, res) => {
  res.send('Al Qods API is running 🚀');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
