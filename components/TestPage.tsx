import { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { app } from '../services/firebase';

const db = getFirestore(app);

const TestPage = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const test = async () => {
      try {
        const productsCol = collection(db, 'products');
        const productSnapshot = await getDocs(productsCol);
        const productList = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(productList);
      } catch (error: any) {
        setError(JSON.stringify(error, null, 2));
      }
    };

    test();
  }, []);

  return (
    <div>
      <h1>Test Page</h1>
      {error && (
        <div>
          <h2>Error</h2>
          <pre>{error}</pre>
        </div>
      )}
      <h2>Products</h2>
      <pre>{JSON.stringify(products, null, 2)}</pre>
    </div>
  );
};

export default TestPage;
