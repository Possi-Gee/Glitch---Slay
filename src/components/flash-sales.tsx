
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Zap } from 'lucide-react';
import { useHomepage } from '@/hooks/use-homepage';

export function FlashSales() {
  const { state } = useHomepage();
  const [timeLeft, setTimeLeft] = useState({ hours: '00', minutes: '00', seconds: '00' });

  useEffect(() => {
    if (state.loading) return;

    const calculateTimeLeft = () => {
      const difference = +new Date(state.flashSale.endDate) - +new Date();
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
    let timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearInterval(timer);
      } else {
        setTimeLeft(calculateTimeLeft());
        timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state.flashSale.endDate, state.loading]);

  if (state.loading) {
    // Render a placeholder on the server/during load to avoid hydration mismatch
    return (
      <div className="bg-red-600 text-white p-2 flex items-center justify-between h-[48px]">
        {/* Skeleton or empty state */}
      </div>
    );
  }
  
  return (
    <div className="bg-red-600 text-white p-2 flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-1.5 sm:gap-2">
            <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-300" />
            <span className="text-sm sm:text-lg font-bold">Flash Sales</span>
        </div>
        <div className="text-xs sm:text-sm">
          <span className="hidden sm:inline">TIME LEFT: </span>
          <span className="font-bold">{timeLeft.hours}h : {timeLeft.minutes}m : {timeLeft.seconds}s</span>
        </div>
      </div>
      <Link href="/sales" className="text-xs sm:text-sm font-semibold hover:underline">
        See All
      </Link>
    </div>
  );
}
