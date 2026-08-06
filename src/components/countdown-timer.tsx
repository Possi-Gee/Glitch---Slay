'use client';

import { useEffect, useState } from 'react';

interface CountdownTimerProps {
  targetDate: string | Date;
  className?: string;
}

export function CountdownTimer({ targetDate, className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({ hours: '00', minutes: '00', seconds: '00' });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      let newTimeLeft = { hours: '00', minutes: '00', seconds: '00' };
      if (difference > 0) {
        newTimeLeft = {
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24).toString().padStart(2, '0'),
          minutes: Math.floor((difference / 1000 / 60) % 60).toString().padStart(2, '0'),
          seconds: Math.floor((difference / 1000) % 60).toString().padStart(2, '0')
        };
      }
      return newTimeLeft;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className={className}>
      <span className="font-mono font-bold text-lg">
        {timeLeft.hours}h : {timeLeft.minutes}m : {timeLeft.seconds}s
      </span>
    </div>
  );
}
