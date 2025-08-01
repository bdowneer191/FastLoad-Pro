import React, { useState, useEffect } from 'react';
import { formatDuration } from '../utils/time.ts';

interface SessionTimerProps {
  startTime: string;
}

const SessionTimer: React.FC<SessionTimerProps> = ({ startTime }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const sessionStartDate = new Date(startTime);
    
    const timerInterval = setInterval(() => {
      const now = new Date();
      setElapsedSeconds((now.getTime() - sessionStartDate.getTime()) / 1000);
      setCurrentTime(now);
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [startTime]);

  return (
    <div className="p-3 mb-4 bg-brand-surface rounded-lg text-center shadow-lg">
        <h3 className="font-semibold text-brand-accent-start">Active Session</h3>
        <div className="flex justify-center items-center gap-6 mt-1 text-sm text-brand-text-secondary">
            <div>
                <span className="text-xs text-brand-text-secondary block">Current Time</span>
                <span className="font-mono text-lg">{currentTime.toLocaleTimeString()}</span>
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