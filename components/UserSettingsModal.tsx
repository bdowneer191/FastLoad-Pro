import { ChangeEvent } from 'react';
import { User, updateProfile, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';

interface UserSettingsModalProps {
    user: User;
    isOpen: boolean;
    onClose: () => void;
}

const UserSettingsModal = ({ user, isOpen, onClose }: UserSettingsModalProps) => {
    if (!isOpen) return null;

    const goToCheckout = async (priceId: string) => {
        try {
            const functions = getFunctions(getApp(), 'us-central1');
            const createCheckoutSession = httpsCallable(
                functions,
                'ext-firestore-stripe-payments-createCheckoutSession'
            );

            const session = await createCheckoutSession({
                price: priceId,
                success_url: window.location.href,
                cancel_url: window.location.href,
            });

            window.location.assign((session.data as any).url);
        } catch (error) {
            console.error("Could not create checkout session:", error);
            alert("Error: Could not start the payment process.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex justify-center items-center">
            <div className="bg-brand-surface rounded-lg shadow-lg p-8 max-w-2xl w-full">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-brand-text-primary">User Profile & Settings</h2>
                    <button onClick={onClose} className="text-brand-text-secondary hover:text-white">&times;</button>
                </div>

                {/* Profile Information Section */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-brand-text-primary mb-4">Profile Information</h3>
                    <div className="flex items-center gap-4">
                        <img
                            src={user.photoURL || undefined}
                            alt={user.displayName || 'User Avatar'}
                            className="w-20 h-20 rounded-full border-4 border-brand-border"
                        />
                        <div className="flex flex-col gap-2">
                            <input
                                type="file"
                                id="avatar-upload"
                                className="hidden"
                                accept="image/png, image/jpeg"
                                onChange={async (event: ChangeEvent<HTMLInputElement>) => {
                                    if (!event.target.files) return;

                                    const file = event.target.files[0];

                                    const response = await fetch(
                                        `/api/upload?filename=${file.name}`,
                                        {
                                            method: 'POST',
                                            body: file,
                                        },
                                    );

                                    const newBlob = (await response.json());

                                    await updateProfile(user, { photoURL: newBlob.url });
                                }}
                            />
                            <label
                                htmlFor="avatar-upload"
                                className="px-4 py-2 bg-brand-accent-start text-white rounded-lg cursor-pointer hover:bg-brand-accent-end transition-colors"
                            >
                                Upload Photo
                            </label>
                            <p className="text-xs text-brand-text-secondary">PNG, JPG up to 5MB.</p>
                        </div>
                    </div>
                    <div className="mt-4">
                        <label htmlFor="displayName" className="block text-sm font-medium text-brand-text-secondary mb-1">
                            Display Name
                        </label>
                        <input
                            type="text"
                            id="displayName"
                            defaultValue={user.displayName || ''}
                            className="w-full p-2 bg-brand-background border border-brand-border rounded-lg"
                        />
                    </div>
                    <div className="mt-4">
                        <button
                            className="px-4 py-2 bg-brand-accent-start text-white rounded-lg cursor-pointer hover:bg-brand-accent-end transition-colors"
                            onClick={async () => {
                                const displayNameInput = document.getElementById('displayName') as HTMLInputElement;
                                const newDisplayName = displayNameInput.value;

                                if (newDisplayName && newDisplayName !== user.displayName) {
                                    await updateProfile(user, { displayName: newDisplayName });
                                    // You might want to show a success message here
                                }
                            }}
                        >
                            Save Changes
                        </button>
                    </div>
                    <div className="mt-4">
                        <label htmlFor="email" className="block text-sm font-medium text-brand-text-secondary mb-1">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={user.email || ''}
                            disabled
                            className="w-full p-2 bg-brand-background border border-brand-border rounded-lg text-brand-text-secondary"
                        />
                    </div>
                </div>

                {/* Account Management Section */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-brand-text-primary mb-4">Account Management</h3>
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-brand-text-secondary mb-1">
                            Password
                        </label>
                        <button
                            className="px-4 py-2 bg-brand-accent-start text-white rounded-lg cursor-pointer hover:bg-brand-accent-end transition-colors"
                            onClick={async () => {
                                if (user.email) {
                                    await sendPasswordResetEmail(auth, user.email);
                                    // You might want to show a success message here
                                }
                            }}
                        >
                            Send Reset Link
                        </button>
                    </div>
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-brand-text-secondary mb-1">
                            User Role
                        </label>
                        <p className="text-brand-text-primary">User</p>
                    </div>
                </div>

                <div className="mt-6">
                    <button
                        onClick={() => signOut(auth)}
                        className="text-xs text-brand-text-secondary hover:text-brand-accent-start transition-colors"
                    >
                        Sign Out
                    </button>
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
    );
};

export default UserSettingsModal;
