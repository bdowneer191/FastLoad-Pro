import { getApp } from 'firebase/app';
import { getStripePayments, createCheckoutSession } from '@invertase/firestore-stripe-payments';

interface PaywallModalProps {
    onClose: () => void;
}

const payments = getStripePayments(getApp(), {
    productsCollection: "products",
    customersCollection: "customers",
});

const PaywallModal = ({ onClose }: PaywallModalProps) => {
    const goToCheckout = async (priceId: string) => {
        try {
            const session = await createCheckoutSession(payments, {
                price: priceId,
                success_url: window.location.href,
                cancel_url: window.location.href,
            });
            window.location.assign(session.url);
        } catch (error) {
            console.error("Could not create checkout session:", error);
            alert("Error: Could not start the payment process.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex justify-center items-center">
            <div className="bg-brand-surface rounded-lg shadow-lg p-8 max-w-2xl w-full">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-brand-text-primary">Upgrade Your Plan</h2>
                    <button onClick={onClose} className="text-brand-text-secondary hover:text-white">&times;</button>
                </div>

                {/* Subscription / Pricing Section */}
                <div className="mt-8">
                    <h3 className="text-lg font-semibold text-brand-text-primary mb-4">Upgrade Your Plan</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Basic Plan */}
                        <div className="border border-brand-border rounded-lg p-4 flex flex-col">
                            <h4 className="text-xl font-bold text-brand-text-primary">Basic Plan</h4>
                            <p className="text-2xl font-bold text-brand-text-primary my-2">$12.99/mo</p>
                            <p className="text-sm text-brand-text-secondary mb-4">Best package to get started</p>
                            <button
                                onClick={() => goToCheckout('price_1PJsSDRs9dDKEu3l3a4S2F3c')}
                                className="mt-auto w-full px-4 py-2 bg-brand-accent-start text-white rounded-lg cursor-pointer hover:bg-brand-accent-end transition-colors"
                            >
                                Choose Plan
                            </button>
                        </div>
                        {/* Pro Plan */}
                        <div className="border-2 border-brand-accent-start rounded-lg p-4 flex flex-col relative">
                            <span className="absolute top-0 right-0 bg-brand-accent-start text-white text-xs font-bold px-2 py-1 rounded-bl-lg">Best Value</span>
                            <h4 className="text-xl font-bold text-brand-text-primary">Pro Plan</h4>
                            <p className="text-2xl font-bold text-brand-text-primary my-2">$29.99/mo</p>
                            <p className="text-sm text-brand-text-secondary mb-4">All the best features for professionals.</p>
                            <button
                                onClick={() => goToCheckout('price_1PJsTWRs9dDKEu3l3SCx2aT7')}
                                className="mt-auto w-full px-4 py-2 bg-brand-accent-start text-white rounded-lg cursor-pointer hover:bg-brand-accent-end transition-colors"
                            >
                                Choose Plan
                            </button>
                        </div>
                        {/* Agency Plan */}
                        <div className="border border-brand-border rounded-lg p-4 flex flex-col">
                            <h4 className="text-xl font-bold text-brand-text-primary">Agency Plan</h4>
                            <p className="text-2xl font-bold text-brand-text-primary my-2">$79.99/mo</p>
                            <p className="text-sm text-brand-text-secondary mb-4">The ultimate toolkit for agencies.</p>
                            <button
                                onClick={() => goToCheckout('price_1PJsUDRs9dDKEu3lO2yO3zP1')}
                                className="mt-auto w-full px-4 py-2 bg-brand-accent-start text-white rounded-lg cursor-pointer hover:bg-brand-accent-end transition-colors"
                            >
                                Choose Plan
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default PaywallModal;
