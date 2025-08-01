import React, { useState, useEffect } from 'react';
import Clock from 'react-clock';
import 'react-clock/dist/Clock.css';
import { formatDuration } from '../utils/time';
import { auth, db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface SessionTimerProps {
  startTime: string;
}

const SessionTimer: React.FC<SessionTimerProps> = ({ startTime }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [value, setValue] = useState(new Date());
  const [timezone, setTimezone] = useState('UTC');
  useEffect(() => {
    const fetchUserTimezone = async () => {
      if (auth.currentUser) {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists() && docSnap.data().timezone) {
          setTimezone(docSnap.data().timezone);
        }
      }
    };

    fetchUserTimezone();
  }, []);

  useEffect(() => {
    const sessionStartDate = new Date(startTime);
    
    const timerInterval = setInterval(() => {
      const now = new Date();
      setElapsedSeconds((now.getTime() - sessionStartDate.getTime()) / 1000);

      // Create a new date object with the user's timezone
      const userTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
      setValue(userTime);
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [startTime, timezone]);

  return (
    <div className="p-3 mb-4 bg-brand-surface rounded-lg text-center shadow-lg" style={{ perspective: '1000px' }}>
        <h3 className="font-semibold text-brand-accent-start">Active Session</h3>
        <div className="flex justify-center items-center gap-6 mt-1 text-sm text-brand-text-secondary">
            <div style={{ transform: 'rotateY(-10deg) rotateX(10deg)', transformStyle: 'preserve-3d' }}>
                <Clock value={value} size={100} renderNumbers={true} />
            </div>
            <div>
                <span className="text-xs text-brand-text-secondary block">Session Timer</span>
                <span className="font-mono text-lg">{formatDuration(elapsedSeconds)}</span>
            </div>
        </div>
    </div>
  );
};

export default SessionTimer;