'use client';

import { useState, useEffect } from 'react';

interface SystemPanicTimerProps {
  onTimeout: () => void;
}

export default function SystemPanicTimer({ onTimeout }: SystemPanicTimerProps) {
  const [timeLeft, setTimeLeft] = useState(17);

  useEffect(() => {
    if (timeLeft === 0) {
      onTimeout();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeout]);

  return (
    <div className="absolute top-4 left-4 z-[9999] flex flex-col items-center justify-center">
      <div className="bg-red-600/90 text-white font-mono p-4 rounded-lg shadow-2xl animate-pulse-strong border-4 border-white text-center">
        <h2 className="text-lg font-bold">SYSTEM FAILURE IMMINENT</h2>
        <p className="text-7xl font-bold">{timeLeft}</p>
      </div>
    </div>
  );
}
