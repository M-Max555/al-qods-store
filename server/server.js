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
  apiKey: process.env.TOGETHER_API_KEY,
  baseURL: "https://api.together.xyz/v1"
});

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body?.message || "مرحبا";

    console.log("USER:", userMessage);

    const completion = await openai.chat.completions.create({
      model: "meta-llama/Llama-3-8b-chat-hf",
      messages: [
        {
          role: "system",
          content: `
أنت محمد بائع مصري شاطر.

- افهم العميل الأول
- متكررّش كلامك
- رد مختصر
- حاول تقفل البيع
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

    res.json({
      reply: reply || "قولّي عايز إيه وأنا أظبطك 👌"
    });

  } catch (err) {
    console.error("TOGETHER ERROR:", err);

    res.json({
      reply: "في مشكلة بسيطة دلوقتي 😅 جرب تاني"
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
