import React, { useState, useEffect } from 'react';

interface DigitalClockProps {
  startTime: string;
  onTick: (durationInSeconds: number) => void;
}

const DigitalClock: React.FC<DigitalClockProps> = ({ startTime, onTick }) => {
  const [duration, setDuration] = useState('00:00:00');

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const start = new Date(startTime);
      const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
      onTick(diff);

      const h = Math.floor(diff / 3600).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
      const s = Math.floor(diff % 60).toString().padStart(2, '0');

      setDuration(`${h}:${m}:${s}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, onTick]);

  return (
    <div className="flex items-center justify-center p-2 bg-gray-900 rounded-lg shadow-lg" style={{ perspective: '1000px' }}>
      <div className="relative" style={{ transformStyle: 'preserve-3d', transform: 'rotateX(-15deg) rotateY(25deg)' }}>
        <div
          className="text-5xl font-mono text-cyan-300 bg-gray-800 px-6 py-2 rounded-lg"
          style={{
            textShadow: '0 0 5px #0ff, 0 0 15px #0ff, 0 0 25px #0ff, 0 0 50px #0ff, 1px 1px 2px rgba(0,0,0,0.5)',
            transform: 'translateZ(30px)',
            boxShadow: '0 0 15px rgba(0, 255, 255, 0.6), inset 0 0 8px rgba(0, 255, 255, 0.4)',
            border: '2px solid rgba(0, 255, 255, 0.3)'
          }}
        >
          {duration}
        </div>
        <div
          className="absolute top-0 left-0 w-full h-full bg-black opacity-60 rounded-lg"
          style={{ transform: 'translateZ(-30px) rotateX(15deg) rotateY(-15deg) scale(1.1)' }}
        />
      </div>
    </div>
  );
};

export default DigitalClock;
