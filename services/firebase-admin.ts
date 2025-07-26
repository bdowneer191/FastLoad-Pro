import * as admin from 'firebase-admin';

let auth: admin.auth.Auth | null = null;
let db: admin.firestore.Firestore | null = null;

try {
  // Check if Firebase Admin is already initialized
  if (!admin.apps || admin.apps.length === 0) {
    // Validate required environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (!projectId || !privateKey || !clientEmail) {
      const missingVars = [];
      if (!projectId) missingVars.push('FIREBASE_PROJECT_ID');
      if (!privateKey) missingVars.push('FIREBASE_PRIVATE_KEY');
      if (!clientEmail) missingVars.push('FIREBASE_CLIENT_EMAIL');
      
      throw new Error(`Missing required Firebase environment variables: ${missingVars.join(', ')}`);
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey: privateKey.replace(/\\n/g, '\n'),
        clientEmail,
      })
    });
  }

  auth = admin.auth();
  db = admin.firestore();
  
  console.log('Firebase Admin initialized successfully');
} catch (initError) {
  console.error('Firebase Admin initialization failed:', initError);
  // Set to null so the API can handle the error gracefully
  auth = null;
  db = null;
}

export { auth, db };
