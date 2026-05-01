import admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
      });
      console.log("✅ Firebase Admin initialized");
    } else {
      console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT is missing");
    }
  } catch (error) {
    console.error("❌ Firebase Admin Init Error:", error);
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
export default admin;
