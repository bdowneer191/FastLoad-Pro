import { ChangeEvent } from 'react';
import { User, updateProfile, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { auth } from '../services/firebase';

interface UserSettingsModalProps {
    user: User;
    isOpen: boolean;
    onClose: () => void;
}

const UserSettingsModal = ({ user, isOpen, onClose }: UserSettingsModalProps) => {
    if (!isOpen) return null;

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
            </div>
        </div>
    );
};

export default UserSettingsModal;
