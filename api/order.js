import { db } from "./lib/firebase.js";
import admin from "firebase-admin";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { action, orderId, status, orderData } = req.body;

    if (action === "create") {
      const docRef = await db.collection("orders").add({
        ...orderData,
        status: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return res.status(200).json({ success: true, id: docRef.id });
    }

    if (action === "updateStatus") {
      if (!orderId || !status) return res.status(400).json({ error: "Missing params" });
      
      const snapshot = await db.collection("orders").where("orderId", "==", orderId).get();
      if (snapshot.empty) return res.status(404).json({ error: "Order not found" });

      const docId = snapshot.docs[0].id;
      await db.collection("orders").doc(docId).update({
        status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: "Invalid action" });
  } catch (err) {
    console.error("ORDER ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
