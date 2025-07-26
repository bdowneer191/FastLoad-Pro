import admin from 'firebase-admin';

// These variables will hold the initialized Firebase services.
let auth: admin.auth.Auth;
let db: admin.firestore.Firestore;

// This block of code will only run once when the serverless function is first started.
try {
  // Check if the app is already initialized to prevent re-initialization on hot reloads.
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

    // IMPORTANT: When you paste the private key into Vercel, it removes the newlines.
    // This line of code replaces the "\\n" characters (which Vercel creates) with actual newline characters ("\n"),
    // which is the format the Firebase Admin SDK expects.
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
  // This helps in debugging issues with environment variables or credentials.
  console.error('Firebase Admin initialization failed:', initError);
  
  // In case of an error, explicitly set auth and db to null.
  // Your API endpoints should check if these are null to handle the error gracefully.
  auth = null;
  db = null;
}

// Export the auth and firestore services to be used in your API routes.
export { auth, db };
