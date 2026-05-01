import { db } from "./lib/firebase.js";
import admin from "firebase-admin";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { phone, source } = req.body;

    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    // Validation: Accept Egyptian numbers only
    const egyptPhoneRegex = /^01[0125][0-9]{8}$/;
    if (!egyptPhoneRegex.test(phone)) {
      return res.status(400).json({ error: "Invalid Egyptian phone number" });
    }

    // Check for duplicates
    const snapshot = await db.collection("leads").where("phone", "==", phone).get();
    if (!snapshot.empty) {
      return res.status(200).json({ success: true, message: "Already registered" });
    }

    // Save lead
    await db.collection("leads").add({
      phone,
      source: source || "homepage_offer",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("LEADS ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
