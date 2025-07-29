import { useState } from 'react';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { app, auth } from '../services/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

const db = getFirestore(app);

const NewTestPage = () => {
  const [readData, setReadData] = useState<any | null>(null);
  const [writeData, setWriteData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user] = useAuthState(auth);

  const readUserData = async () => {
    if (!user) {
      setError("User not authenticated");
      return;
    }

    try {
      const userDocRef = doc(db, 'customers', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        setReadData(userDocSnap.data());
      } else {
        setReadData(null);
      }
    } catch (error: any) {
      setError(JSON.stringify(error, null, 2));
    }
  };

  const writeUserData = async () => {
    if (!user) {
      setError("User not authenticated");
      return;
    }

    try {
      const userDocRef = doc(db, 'customers', user.uid);
      await setDoc(userDocRef, { test: "test" });
      setWriteData({ success: true });
    } catch (error: any) {
      setError(JSON.stringify(error, null, 2));
    }
  };

  return (
    <div>
      <h1>New Test Page</h1>
      <button onClick={readUserData}>Read User Data</button>
      <button onClick={writeUserData}>Write User Data</button>
      {error && (
        <div>
          <h2>Error</h2>
          <pre>{error}</pre>
        </div>
      )}
      <h2>Read Data</h2>
      <pre>{JSON.stringify(readData, null, 2)}</pre>
      <h2>Write Data</h2>
      <pre>{JSON.stringify(writeData, null, 2)}</pre>
    </div>
  );
};

export default NewTestPage;
