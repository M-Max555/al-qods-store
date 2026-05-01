import { db } from './lib/firebase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { offerTitle, offerUrl, discount } = req.body;

  if (!offerTitle) {
    return res.status(400).json({ error: 'Missing offer details' });
  }

  try {
    // 0. Check if DB is initialized
    if (!db) {
      throw new Error('Firebase Admin not initialized. Check FIREBASE_SERVICE_ACCOUNT env var.');
    }

    // 1. Fetch all leads from Firestore
    const leadsSnapshot = await db.collection('leads').get();
    const leads = leadsSnapshot.docs.map(doc => doc.data());

    if (leads.length === 0) {
      return res.status(200).json({ message: 'No leads found to notify' });
    }

    console.log(`[WhatsApp Broadcast] Starting broadcast to ${leads.length} leads...`);

    const results = {
      total: leads.length,
      sent: 0,
      failed: 0,
      errors: []
    };

    // 2. Loop through leads and send messages
    // Note: In production, use a queue/background job to avoid Vercel timeout (10s)
    // For this demonstration, we'll process them in the handler with a small delay
    for (const lead of leads) {
      try {
        let phone = lead.phone.trim();
        
        // Format phone: 01020733671 -> 201020733671
        if (phone.startsWith('0')) {
          phone = '2' + phone;
        } else if (!phone.startsWith('2')) {
          phone = '2' + phone;
        }

        const message = `🔥 عرض جديد من معرض القدس!\n\nخصم ${discount}% على ${offerTitle} 💸\n\nشوف العرض دلوقتي:\n${offerUrl || 'https://al-qods-store.vercel.app/offers'}`;

        // WHATSAPP CLOUD API CALL (MOCK/PLACEHOLDER)
        // You need to replace this with your actual ACCESS_TOKEN and PHONE_NUMBER_ID
        /*
        const response = await fetch(`https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: phone,
            type: "text",
            text: { body: message }
          })
        });
        */

        // Log the message being sent (Simulating API call)
        console.log(`[WhatsApp] Sent to ${phone}: ${offerTitle}`);
        
        results.sent++;
        
        // Small delay to prevent rate limiting (500ms)
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (err) {
        console.error(`[WhatsApp] Failed to send to ${lead.phone}:`, err);
        results.failed++;
        results.errors.push({ phone: lead.phone, error: err.message });
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: `Broadcast complete: ${results.sent} sent, ${results.failed} failed.`,
      results 
    });

  } catch (error) {
    console.error('[WhatsApp Broadcast Error]:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
