import admin from 'firebase-admin';

// These variables will hold the initialized Firebase services.
// We add "| null" to let TypeScript know that these variables can hold a null value,
// which is what happens if the initialization fails in the catch block.
let auth: admin.auth.Auth | null = null;
let db: admin.firestore.Firestore | null = null;

// This block of code will only run once when the serverless function is first started.
try {
  // Check if the app is already initialized to prevent re-initialization.
  if (!admin.apps.length) {
    // Retrieve the Firebase credentials from environment variables.
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    // Validate that all required environment variables are present.
    if (!projectId || !privateKey || !clientEmail) {
      const missingVars = [];
      if (!projectId) missingVars.push('FIREBASE_PROJECT_ID');
      if (!privateKey) missingVars.push('FIREBASE_PRIVATE_KEY');
      if (!clientEmail) missingVars.push('FIREBASE_CLIENT_EMAIL');
      
      // If any variables are missing, throw a detailed error.
      throw new Error(`Missing required Firebase environment variables: ${missingVars.join(', ')}`);
    }

    // This line correctly formats the private key for the Firebase Admin SDK.
    const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

    // Initialize the Firebase Admin SDK with the credentials.
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: formattedPrivateKey,
      }),
    });
    
    console.log('Firebase Admin initialized successfully.');
  }

  // Assign the initialized services to the exported variables.
  auth = admin.auth();
  db = admin.firestore();

} catch (initError) {
  // Log a detailed error message if initialization fails.
  console.error('Firebase Admin initialization failed:', initError);
  
  // In case of an error, auth and db remain null. Your API endpoints
  // should check for this to handle the error gracefully.
}

// Export the auth and firestore services to be used in your API routes.
export { auth, db };
