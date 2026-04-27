import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";
import fetch from "node-fetch";

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

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-8b"
});

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body?.message || "مرحبا";

    console.log("USER:", userMessage);

    const prompt = `
أنت محمد بائع مصري شاطر في متجر أدوات منزلية.

قواعد:
- افهم العميل الأول
- متكررّش نفس الرد
- رد قصير (سطرين)
- حاول تقفل البيع

سؤال العميل:
${userMessage}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("AI:", text);

    if (!text) {
      return res.json({
        reply: "في عرض جامد عندنا النهاردة 🔥 تحب أقولك عليه؟"
      });
    }

    res.json({ reply: text });

  } catch (err) {
    console.error("GEMINI ERROR FULL:", err);

    return res.json({
      reply: "ERROR: " + (err?.message || "unknown")
    });
  }
});

app.get("/models", async (req, res) => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
    );

    const data = await response.json();

    console.log("MODELS:", data);

    res.json(data);
  } catch (err) {
    console.error(err);
    res.send("error");
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
