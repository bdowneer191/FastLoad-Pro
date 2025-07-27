import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';

interface PaywallModalProps {
  onClose: () => void;
}

const PaywallModal = ({ onClose }: PaywallModalProps) => {
  const goToCheckout = async (priceId: string) => {
    try {
      const functions = getFunctions(getApp(), 'us-central1');
      const createCheckoutSession = httpsCallable(
        functions,
        'ext-firestore-stripe-payments-createCheckoutSession'
      );

      const session = await createCheckoutSession({
        price: priceId,
        success_url: window.location.href, // Redirect here after success
        cancel_url: window.location.href, // Redirect here if they cancel
      });

      // Redirect to Stripe's checkout page
      window.location.assign((session.data as any).url);

    } catch (error) {
      console.error("Could not create checkout session:", error);
      alert("Error: Could not start the payment process.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Choose Your Plan</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold">Pro Plan - $29/mo</h3>
            <p>All the best features for professionals.</p>
            <button onClick={() => goToCheckout('price_1PQR7iRvG3mYcZ3c4n8d1y2x')} className="mt-2 w-full bg-blue-500 text-white py-2 rounded-lg">
              Choose Pro
            </button>
          </div>
          <div>
            <h3 className="text-xl font-semibold">Agency Plan - $79/mo</h3>
            <p>The ultimate toolkit for agencies.</p>
            <button onClick={() => goToCheckout('price_1PQR7iRvG3mYcZ3c4n8d1y2y')} className="mt-2 w-full bg-blue-500 text-white py-2 rounded-lg">
              Choose Agency
            </button>
          </div>
        </div>
        <button onClick={onClose} className="mt-6 w-full bg-gray-300 text-gray-700 py-2 rounded-lg">
          Close
        </button>
      </div>
    </div>
  );
};

export default PaywallModal;
