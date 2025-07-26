import * as admin from 'firebase-admin';

let app: admin.app.App;

if (!admin.apps.length) {
  const serviceAccountString = process.env.FIREBASE_ADMIN_SDK_CONFIG;
  if (!serviceAccountString) {
    throw new Error("Firebase admin SDK config is not set in environment variables.");
  }
  try {
    const serviceAccount = JSON.parse(serviceAccountString);
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (e: any) {
    console.error("CRITICAL: Failed to parse or initialize Firebase Admin SDK. Check the FIREBASE_ADMIN_SDK_CONFIG format.", e.message);
    // Prevent the app from running without proper initialization
    throw new Error("Could not initialize Firebase Admin SDK.");
  }
} else {
  app = admin.apps[0]!;
}

export const auth = app.auth();
export const db = app.firestore();
