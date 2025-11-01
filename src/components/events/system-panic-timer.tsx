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
    <div className="absolute top-8 right-8 z-[9999] bg-red-600/90 text-white font-mono p-4 rounded-lg shadow-2xl animate-pulse-strong border-2 border-white">
      <h2 className="text-xl font-bold text-center">SYSTEM FAILURE IMMINENT</h2>
      <p className="text-7xl font-bold text-center">{timeLeft}</p>
    </div>
  );
}
