import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { User } from 'firebase/auth';

interface UserData {
    geminiApiKey?: string;
    pageSpeedApiKey?: string;
    freeTrialUsage?: number;
}

export const useUserData = (user: User | null) => {
    const [userData, setUserData] = useState<UserData>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const userDocRef = doc(db, 'users', user.uid);

        const fetchUserData = async () => {
            try {
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists()) {
                    setUserData(docSnap.data() as UserData);
                }
            } catch (error) {
                console.error("Error fetching user data:", JSON.stringify(error, null, 2));
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [user]);

    const updateUserData = async (data: Partial<UserData>) => {
        if (!user) return;
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, data, { merge: true });
        setUserData(prevData => ({ ...prevData, ...data }));
    };

    return { userData, loading, updateUserData };
};
