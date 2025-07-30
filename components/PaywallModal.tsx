import { useState, useEffect } from 'react';
// Import types and functions from your stripePayments service file
import {
    fetchProducts,
    createSubscriptionCheckout,
    Product,
} from '../services/stripePayments';

interface PaywallModalProps {
    onClose: () => void;
}

const PaywallModal = ({ onClose }: PaywallModalProps) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    // ✅ State to hold a user-facing error message
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadProducts = async () => {
            // Reset error state on each load attempt
            setError(null);
            try {
                const fetchedProducts = await fetchProducts();
                setProducts(fetchedProducts);
            } catch (err) {
                // ✅ If fetchProducts fails (e.g., due to the 404 error), set an error message
                console.error("Failed to fetch products from Firestore:", err);
                setError("Could not load subscription plans. Please check your connection and try again.");
            } finally {
                setLoading(false);
            }
        };
        loadProducts();
    }, []);

    // This function remains the same
    const goToCheckout = async (priceId: string) => {
        try {
            await createSubscriptionCheckout(priceId);
        } catch (checkoutError) {
            console.error("Could not create checkout session:", checkoutError);
            alert("Error: Could not start the payment process.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex justify-center items-center">
            <div className="bg-brand-surface rounded-lg shadow-lg p-8 max-w-4xl w-full">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-brand-text-primary">Upgrade Your Plan</h2>
                    <button onClick={onClose} className="text-brand-text-secondary hover:text-white text-2xl">&times;</button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent-start"></div>
                    </div>
                // ✅ If an error occurred during fetch, display it to the user
                ) : error ? (
                    <div className="text-center text-red-400 py-10">{error}</div>
                // Only if loading is false AND there is no error, show the products
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {products.map((product, index) => {
                            const price = product.prices?.[0];

                            if (!price || !price.unit_amount) {
                                return null;
                            }

                            return (
                                <div
                                    key={product.id}
                                    className={`border rounded-lg p-6 flex flex-col ${index === 1 ? 'border-2 border-brand-accent-start' : 'border-brand-border'}`}
                                >
                                    <h4 className="text-xl font-bold text-brand-text-primary">{product.name ?? 'Subscription Plan'}</h4>
                                    
                                    <p className="text-3xl font-bold text-brand-text-primary my-4">
                                        ${(price.unit_amount / 100).toFixed(2)}
                                        <span className="text-base font-normal">/mo</span>
                                    </p>
                                    
                                    <p className="text-sm text-brand-text-secondary mb-6 h-12">{product.description ?? ''}</p>
                                    
                                    <button
                                        onClick={() => goToCheckout(price.id)}
                                        className="mt-auto w-full px-4 py-2 bg-brand-accent-start text-white rounded-lg font-semibold hover:bg-brand-accent-end transition-colors"
                                    >
                                        Choose Plan
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaywallModal;
