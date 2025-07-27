import { useState, useEffect } from 'react';
import { fetchProducts, createSubscriptionCheckout } from '../services/stripePayments';

// --- ✅ FIX 1: Define a separate, clear 'Price' interface ---
// This is the correct structure for a price object from Stripe.
interface Price {
    id: string;
    unit_amount: number;
    currency: string;
}

// --- ✅ FIX 2: Update the 'Product' interface to use the 'Price' interface ---
// Name and description are made optional to prevent errors if they are null.
interface Product {
    id: string;
    name?: string;
    description?: string;
    // A product has an array of 'Price' objects.
    prices: Price[];
}

interface PaywallModalProps {
    onClose: () => void;
}

const PaywallModal = ({ onClose }: PaywallModalProps) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProducts = async () => {
            try {
                // The 'as Product[]' assertion will now work correctly with the updated interfaces.
                const fetchedProducts = await fetchProducts();
                setProducts(fetchedProducts as Product[]);
            } catch (error) {
                console.error("Failed to fetch products:", error);
            } finally {
                setLoading(false);
            }
        };
        loadProducts();
    }, []);

    const goToCheckout = async (priceId: string) => {
        try {
            await createSubscriptionCheckout(priceId);
        } catch (error) {
            console.error("Could not create checkout session:", error);
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
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {products.map((product, index) => {
                            // Safely get the first price.
                            const price = product.prices?.[0];

                            // If a product has no price, don't render it. This prevents crashes.
                            if (!price) {
                                return null;
                            }

                            return (
                                <div
                                    key={product.id}
                                    className={`border rounded-lg p-6 flex flex-col ${index === 1 ? 'border-2 border-brand-accent-start' : 'border-brand-border'}`}
                                >
                                    {/* ✅ FIX 3: Provide a fallback in case the name is missing */}
                                    <h4 className="text-xl font-bold text-brand-text-primary">{product.name ?? 'Subscription Plan'}</h4>
                                    
                                    <p className="text-3xl font-bold text-brand-text-primary my-4">
                                        ${(price.unit_amount / 100).toFixed(2)}
                                        <span className="text-base font-normal">/mo</span>
                                    </p>
                                    
                                    {/* Provide a fallback for the description */}
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
