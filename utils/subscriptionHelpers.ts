export const getSubscriptionStatus = (subscription: any) => {
    if (!subscription) return 'none';

    switch (subscription.status) {
        case 'active':
            return 'active';
        case 'past_due':
            return 'past_due';
        case 'canceled':
            return 'canceled';
        case 'unpaid':
            return 'unpaid';
        default:
            return 'unknown';
    }
};

export const canAccessPremiumFeatures = (subscription: any) => {
    const status = getSubscriptionStatus(subscription);
    return status === 'active' || status === 'past_due';
};

export const getSubscriptionPlan = (subscription: any) => {
    if (!subscription?.items?.[0]?.price?.nickname) {
        return 'Unknown Plan';
    }
    return subscription.items[0].price.nickname;
};
