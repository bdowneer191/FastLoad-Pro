import { getApp } from "@firebase/app";
import {
    getStripePayments,
    getProducts,
    createCheckoutSession,
    onCurrentUserSubscriptionUpdate,
    getCurrentUserSubscriptions,
    Product as StripeProduct,
    Price as StripePrice,
} from "@invertase/firestore-stripe-payments";
import { auth } from "./firebase";

// --- ✅ FIX 1: Define and export clear interfaces for our app to use ---
// This ensures the rest of your app knows the exact shape of the data.
export interface Price extends StripePrice {}

export interface Product extends StripeProduct {
    prices: Price[];
}

const app = getApp();
const payments = getStripePayments(app, {
    productsCollection: "products",
    customersCollection: "customers",
});

// --- ✅ FIX 2: Correctly fetch products and their prices in ONE call ---
// The old code was fetching prices incorrectly, causing the type error.
export const fetchProducts = async (): Promise<Product[]> => {
    const products = await getProducts(payments, {
        includePrices: true,
        activeOnly: true,
    });
    // The type assertion is now safe because the data structure is correct.
    return products as Product[];
};

export const createSubscriptionCheckout = async (priceId: string) => {
    const session = await createCheckoutSession(payments, {
        price: priceId,
        success_url: `${window.location.origin}/success`,
        cancel_url: `${window.location.origin}/cancel`,
    });
    window.location.assign(session.url);
};

export const subscribeToSubscriptionUpdates = (
    callback: (subscriptions: any[]) => void
) => {
    if (!auth.currentUser) {
        return () => {};
    }

    return onCurrentUserSubscriptionUpdate(payments, (snapshot) => {
        const subscriptions = snapshot.subscriptions.map((sub) => ({
            ...sub,
            // You can process subscription data here if needed
        }));
        callback(subscriptions);
    });
};

export const getUserSubscriptions = async () => {
    if (!auth.currentUser) {
        return [];
    }
    const subscriptions = await getCurrentUserSubscriptions(payments);
    return subscriptions;
};
