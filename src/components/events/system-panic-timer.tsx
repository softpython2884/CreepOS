'use client';

import { useState, useEffect } from 'react';

interface SystemPanicTimerProps {
  onTimeout: () => void;
}

export default function SystemPanicTimer({ onTimeout }: SystemPanicTimerProps) {
  const [timeLeft, setTimeLeft] = useState(8);

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
    <div className="absolute inset-0 z-[9999] flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-red-600/90 text-white font-mono p-8 rounded-lg shadow-2xl animate-pulse-strong border-4 border-white text-center">
        <h2 className="text-2xl font-bold">SYSTEM FAILURE IMMINENT</h2>
        <p className="text-9xl font-bold">{timeLeft}</p>
      </div>
    </div>
  );
}
