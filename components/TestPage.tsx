import { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { app } from '../services/firebase';
import { getAuth } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';

const auth = getAuth(app);
const db = getFirestore(app);

const TestPage = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [userData, setUserData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user] = useAuthState(auth);

  useEffect(() => {
    const getProducts = async () => {
      try {
        const productsCol = collection(db, 'products');
        const productSnapshot = await getDocs(productsCol);
        const productList = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(productList);
      } catch (error: any) {
        setError(JSON.stringify(error, null, 2));
      }
    };

    getProducts();
  }, []);

  const getUserData = async () => {
    if (!user) {
      setError("User not authenticated");
      return;
    }

    try {
      const userDocRef = doc(db, 'customers', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        setUserData(userDocSnap.data());
      } else {
        setUserData(null);
      }
    } catch (error: any) {
      setError(JSON.stringify(error, null, 2));
    }
  };

  return (
    <div>
      <h1>Test Page</h1>
      <button onClick={getUserData}>Get User Data</button>
      {error && (
        <div>
          <h2>Error</h2>
          <pre>{error}</pre>
        </div>
      )}
      <h2>User Data</h2>
      <pre>{JSON.stringify(userData, null, 2)}</pre>
      <h2>Products</h2>
      <pre>{JSON.stringify(products, null, 2)}</pre>
    </div>
  );
};

export default TestPage;
