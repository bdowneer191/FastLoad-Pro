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

// --- Enhanced Type Definitions ---
export interface Price extends StripePrice {
    id: string;
    unit_amount: number;
    currency: string;
    recurring?: {
        interval: 'day' | 'week' | 'month' | 'year';
        interval_count: number;
    };
    nickname?: string;
    active: boolean;
}

export interface Product extends StripeProduct {
    id: string;
    name: string;
    description?: string;
    active: boolean;
    prices: Price[];
    metadata?: Record<string, string>;
}

// --- Stripe Payments Instance ---
const app = getApp();
const payments = getStripePayments(app, {
    productsCollection: "products",
    customersCollection: "customers",
});

// --- Debug Helper Functions ---
const logDebug = (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
        console.log(`[StripePayments] ${message}`, data);
    }
};

const logError = (message: string, error?: any) => {
    console.error(`[StripePayments] ${message}`, error);
};

const logWarn = (message: string, data?: any) => {
    console.warn(`[StripePayments] ${message}`, data);
};

// --- Enhanced Product Fetching ---
export const fetchProducts = async (): Promise<Product[]> => {
    try {
        logDebug('Starting product fetch from Firestore...');

        // First, let's check what we have in our products collection
        const allProductsRaw = await getProducts(payments, {
            includePrices: true,
            activeOnly: false, // Get everything first for debugging
        });

        logDebug('Raw products from Firestore (all):', {
            count: allProductsRaw.length,
            products: allProductsRaw.map(p => ({
                id: p.id,
                name: p.name,
                active: p.active,
                pricesCount: p.prices?.length || 0
            }))
        });

        // Now get only active products
        const activeProductsRaw = await getProducts(payments, {
            includePrices: true,
            activeOnly: true,
        });

        logDebug('Raw active products from Firestore:', {
            count: activeProductsRaw.length,
            products: activeProductsRaw
        });

        if (activeProductsRaw.length === 0) {
            logWarn('No active products found in Firestore. Possible issues:', {
                suggestions: [
                    'Check if products are marked as active in Stripe Dashboard',
                    'Verify Stripe webhook is properly configured',
                    'Ensure products have been synced from Stripe to Firestore',
                    'Check if the firestore-stripe-payments extension is properly installed'
                ]
            });
            throw new Error(
                'No active products found. Please check your Stripe configuration and ensure products are properly synced to Firestore.'
            );
        }

        // Process and validate products
        const processedProducts: Product[] = [];

        for (const rawProduct of activeProductsRaw) {
            try {
                logDebug(`Processing product: ${rawProduct.name} (${rawProduct.id})`);

                // Validate required product fields
                if (!rawProduct.id || !rawProduct.name) {
                    logWarn('Product missing required fields:', rawProduct);
                    continue;
                }

                // Ensure prices is an array
                const prices = Array.isArray(rawProduct.prices) ? rawProduct.prices : [];
                
                // Validate and filter prices
                const validPrices: Price[] = prices
                    .filter((price: any) => {
                        const isValid = price &&
                                      price.id &&
                                      typeof price.unit_amount === 'number' &&
                                      price.unit_amount > 0 &&
                                      price.active !== false;
                        
                        if (!isValid) {
                            logWarn(`Invalid price for product ${rawProduct.name}:`, price);
                        }
                        
                        return isValid;
                    })
                    .map((price: any) => ({
                        ...price,
                        // Ensure required fields have defaults
                        currency: price.currency || 'usd',
                        active: price.active !== false
                    } as Price));

                if (validPrices.length === 0) {
                    logWarn(`Product ${rawProduct.name} has no valid prices, skipping:`, {
                        productId: rawProduct.id,
                        rawPrices: prices
                    });
                    continue;
                }

                // Sort prices by unit_amount (lowest to highest)
                validPrices.sort((a, b) => a.unit_amount - b.unit_amount);

                const processedProduct: Product = {
                    id: rawProduct.id,
                    name: rawProduct.name,
                    description: rawProduct.description || undefined,
                    active: rawProduct.active !== false,
                    prices: validPrices,
                    metadata: rawProduct.metadata || {},
                    // Include any other properties from the raw product
                    ...rawProduct
                };

                logDebug(`Successfully processed product: ${processedProduct.name}`, {
                    id: processedProduct.id,
                    pricesCount: processedProduct.prices.length,
                    priceRange: validPrices.length > 0 ? {
                        min: `$${(validPrices[0].unit_amount / 100).toFixed(2)}`,
                        max: `$${(validPrices[validPrices.length - 1].unit_amount / 100).toFixed(2)}`
                    } : 'No prices'
                });

                processedProducts.push(processedProduct);

            } catch (productError) {
                logError(`Error processing product ${rawProduct.name}:`, productError);
                // Continue processing other products
                continue;
            }
        }

        // Sort products by some criteria (you can customize this)
        processedProducts.sort((a, b) => {
            // Sort by lowest price first
            const aMinPrice = Math.min(...a.prices.map(p => p.unit_amount));
            const bMinPrice = Math.min(...b.prices.map(p => p.unit_amount));
            return aMinPrice - bMinPrice;
        });

        logDebug('Final processed products:', {
            count: processedProducts.length,
            products: processedProducts.map(p => ({
                name: p.name,
                id: p.id,
                pricesCount: p.prices.length,
                minPrice: p.prices.length > 0 ? `$${(Math.min(...p.prices.map(pr => pr.unit_amount)) / 100).toFixed(2)}` : 'N/A'
            }))
        });

        if (processedProducts.length === 0) {
            throw new Error(
                'No valid products with prices found. Please ensure your Stripe products have valid, active prices.'
            );
        }

        return processedProducts;

    } catch (error) {
        logError('Failed to fetch products:', error);
        
        // Provide helpful error messages based on the error type
        if (error instanceof Error) {
            if (error.message.includes('permission-denied')) {
                throw new Error('Permission denied accessing products. Please check your Firestore security rules.');
            }
            if (error.message.includes('not-found')) {
                throw new Error('Products collection not found. Please ensure the Stripe extension is properly configured.');
            }
            // Re-throw our custom errors
            if (error.message.includes('No active products') || error.message.includes('No valid products')) {
                throw error;
            }
        }

        throw new Error(`Failed to fetch subscription plans: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

// --- Enhanced Checkout Session Creation ---
export const createSubscriptionCheckout = async (priceId: string): Promise<void> => {
    try {
        logDebug('Creating checkout session for price:', priceId);

        if (!priceId) {
            throw new Error('Price ID is required');
        }

        if (!auth.currentUser) {
            throw new Error('User must be authenticated to create checkout session');
        }

        const session = await createCheckoutSession(payments, {
            price: priceId,
            success_url: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${window.location.origin}/cancel`,
            allow_promotion_codes: true,
            // Add customer email if available
            ...(auth.currentUser.email && { 
                customer_email: auth.currentUser.email 
            }),
        });

        logDebug('Checkout session created successfully:', {
            sessionId: session.id,
            url: session.url ? 'URL generated' : 'No URL'
        });

        if (!session.url) {
            throw new Error('No checkout URL returned from Stripe. Please try again.');
        }

        // Redirect to Stripe Checkout
        window.location.assign(session.url);

    } catch (error) {
        logError('Failed to create checkout session:', error);

        if (error instanceof Error) {
            if (error.message.includes('permission-denied')) {
                throw new Error('Permission denied. Please ensure you are logged in and try again.');
            }
            if (error.message.includes('not-found')) {
                throw new Error('Price not found. This subscription plan may no longer be available.');
            }
        }

        throw new Error(`Unable to start checkout: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

// --- Enhanced Subscription Updates ---
export const subscribeToSubscriptionUpdates = (
    callback: (subscriptions: any[]) => void
): (() => void) => {
    if (!auth.currentUser) {
        logWarn('No authenticated user for subscription updates');
        return () => {};
    }

    try {
        logDebug('Setting up subscription updates listener for user:', auth.currentUser.uid);

        const unsubscribe = onCurrentUserSubscriptionUpdate(payments, (snapshot) => {
            try {
                logDebug('Subscription update received:', {
                    subscriptionsCount: snapshot.subscriptions?.length || 0,
                    snapshot: snapshot
                });

                const subscriptions = (snapshot.subscriptions || []).map((sub) => {
                    logDebug('Processing subscription:', {
                        id: sub.id,
                        status: sub.status,
                        current_period_end: sub.current_period_end
                    });

                    return {
                        ...sub,
                        // Add any additional processing here
                    };
                });

                callback(subscriptions);
            } catch (callbackError) {
                logError('Error in subscription update callback:', callbackError);
            }
        });

        return unsubscribe;

    } catch (error) {
        logError('Error setting up subscription listener:', error);
        return () => {};
    }
};

// --- Enhanced User Subscriptions Fetching ---
export const getUserSubscriptions = async (): Promise<any[]> => {
    if (!auth.currentUser) {
        logWarn('No authenticated user for getting subscriptions');
        return [];
    }

    try {
        logDebug('Fetching subscriptions for user:', auth.currentUser.uid);

        const subscriptions = await getCurrentUserSubscriptions(payments);

        logDebug('User subscriptions fetched:', {
            count: subscriptions.length,
            subscriptions: subscriptions.map(sub => ({
                id: sub.id,
                status: sub.status,
                current_period_end: sub.current_period_end
            }))
        });

        return subscriptions;

    } catch (error) {
        logError('Error getting user subscriptions:', error);

        if (error instanceof Error && error.message.includes('permission-denied')) {
            logWarn('Permission denied accessing user subscriptions');
        }

        return [];
    }
};

// --- Additional Utility Functions ---

/**
 * Check if user has any active subscriptions
 */
export const hasActiveSubscription = async (): Promise<boolean> => {
    try {
        const subscriptions = await getUserSubscriptions();
        return subscriptions.some(sub => 
            sub.status === 'active' || 
            sub.status === 'trialing'
        );
    } catch (error) {
        logError('Error checking active subscription:', error);
        return false;
    }
};

/**
 * Get the user's current subscription plan details
 */
export const getCurrentPlan = async () => {
    try {
        const subscriptions = await getUserSubscriptions();
        const activeSub = subscriptions.find(sub => 
            sub.status === 'active' || 
            sub.status === 'trialing'
        );

        if (!activeSub) return null;

        return {
            id: activeSub.id,
            status: activeSub.status,
            current_period_end: activeSub.current_period_end,
            plan: activeSub.items?.[0]?.price || null
        };
    } catch (error) {
        logError('Error getting current plan:', error);
        return null;
    }
};

/**
 * Format price for display
 */
export const formatPrice = (price: Price): string => {
    const amount = (price.unit_amount / 100).toFixed(2);
    const currency = price.currency.toUpperCase();
    const interval = price.recurring ? `/${price.recurring.interval}` : '';
    
    return `${currency === 'USD' ? '$' : currency}${amount}${interval}`;
};
