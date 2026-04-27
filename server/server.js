import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

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

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body?.message || "مرحبا";

    console.log("USER:", userMessage);

    const response = await fetch(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: `
أنت محمد بائع مصري شاطر.

- افهم العميل الأول
- رد مختصر (سطرين)
- متكررّش كلامك
- حاول تقفل البيع

سؤال العميل:
${userMessage}
          `
        })
      }
    );

    const data = await response.json();

    console.log("HF RESPONSE:", data);

    let reply = "";

    if (Array.isArray(data)) {
      reply = data[0]?.generated_text || "";
    } else if (data?.generated_text) {
      reply = data.generated_text;
    }

    // Mistral often includes the prompt in the response, let's clean it if possible
    if (reply.includes("سؤال العميل:")) {
      reply = reply.split("سؤال العميل:").pop().trim();
      // Remove the user message part if it was echoed back
      if (reply.startsWith(userMessage)) {
        reply = reply.replace(userMessage, "").trim();
      }
    }

    if (!reply) {
      return res.json({
        reply: "قولّي عايز إيه وأنا أظبطك 👌"
      });
    }

    res.json({ reply });

  } catch (err) {
    console.error("HF ERROR:", err);

    res.json({
      reply: "ERROR: " + err.message
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
