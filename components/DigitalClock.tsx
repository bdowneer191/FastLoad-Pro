import React, { useState, useEffect } from 'react';

interface DigitalClockProps {
  startTime: string;
}

const DigitalClock: React.FC<DigitalClockProps> = ({ startTime }) => {
  const [duration, setDuration] = useState('00:00:00');

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const start = new Date(startTime);
      const diff = Math.floor((now.getTime() - start.getTime()) / 1000);

      const h = Math.floor(diff / 3600).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
      const s = Math.floor(diff % 60).toString().padStart(2, '0');

      setDuration(`${h}:${m}:${s}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="flex items-center justify-center p-2 bg-gray-900 rounded-lg shadow-lg" style={{ perspective: '1000px' }}>
        <div className="relative" style={{ transformStyle: 'preserve-3d', transform: 'rotateX(-10deg) rotateY(20deg)' }}>
            <div
                className="text-4xl font-mono text-cyan-400 bg-gray-800 px-4 py-2 rounded-lg"
                style={{
                    textShadow: '0 0 5px #0ff, 0 0 10px #0ff, 0 0 20px #0ff, 0 0 40px #0ff',
                    transform: 'translateZ(20px)',
                    boxShadow: '0 0 10px rgba(0, 255, 255, 0.5), inset 0 0 5px rgba(0, 255, 255, 0.3)',
                    border: '1px solid rgba(0, 255, 255, 0.2)'
                }}
            >
                {duration}
            </div>
            <div
                className="absolute top-0 left-0 w-full h-full bg-black opacity-50 rounded-lg"
                style={{ transform: 'translateZ(-20px) rotateX(10deg) rotateY(-10deg) scale(1.05)' }}
            />
        </div>
    </div>
  );
};

export default DigitalClock;
