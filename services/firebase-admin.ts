import * as admin from 'firebase-admin';

let app: admin.app.App | null = null;
let auth: admin.auth.Auth | null = null;
let db: admin.firestore.Firestore | null = null;

try {
  // Check if admin apps exist and have length property
  if (!admin.apps || admin.apps.length === 0) {
    const serviceAccountString = process.env.FIREBASE_ADMIN_SDK_CONFIG;
    if (!serviceAccountString) {
      throw new Error("Firebase admin SDK config is not set in environment variables.");
    }

    let serviceAccount;
    try {
      // Try to decode base64 first (your current setup)
      const serviceAccountJson = Buffer.from(serviceAccountString, 'base64').toString('utf8');
      serviceAccount = JSON.parse(serviceAccountJson);
    } catch (base64Error) {
      try {
        // If base64 fails, try parsing directly as JSON
        serviceAccount = JSON.parse(serviceAccountString);
      } catch (jsonError) {
        console.error("Failed to parse Firebase service account config:", jsonError);
        throw new Error("Invalid Firebase service account configuration format.");
      }
    }

    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log('Firebase Admin SDK initialized successfully');
  } else {
    app = admin.apps[0]!;
  }

  // Only set auth and db if app initialization succeeded
  if (app) {
    auth = app.auth();
    db = app.firestore();
  }
} catch (e: any) {
  console.error("CRITICAL: Failed to parse or initialize Firebase Admin SDK. Check the FIREBASE_ADMIN_SDK_CONFIG format.", e.message);
  // Set everything to null if initialization failed
  app = null;
  auth = null;
  db = null;
}

// Export with null checks
export { auth, db };

// Helper function to check if Firebase is properly initialized
export const isFirebaseInitialized = (): boolean => {
  return app !== null && auth !== null && db !== null;
};
