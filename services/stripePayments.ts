import { getApp } from "@firebase/app";
import {
    getStripePayments,
    getProducts,
    createCheckoutSession,
    onCurrentUserSubscriptionUpdate,
    getCurrentUserSubscriptions,
} from "@invertase/firestore-stripe-payments";
import { auth } from "./firebase";

const app = getApp();
const payments = getStripePayments(app, {
    productsCollection: "products",
    customersCollection: "customers",
});

export const fetchProducts = async () => {
    const products = await getProducts(payments, { activeOnly: true });

    const productsWithPrices = await Promise.all(
        products.map(async (product) => {
            const prices = await getProducts(payments, {
                includePrices: true,
                where: [["product", "==", product.id]],
            });
            return { ...product, prices };
        })
    );

    return productsWithPrices;
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
