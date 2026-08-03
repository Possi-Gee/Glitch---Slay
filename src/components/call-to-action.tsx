
'use client';

import { useState } from 'react';
import { useHomepage } from '@/hooks/use-homepage';
import { ChevronDown, ChevronUp, X, Bell } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export function CallToAction() {
  const { state } = useHomepage();
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (state.loading) {
    return <div className="h-[2px]" />;
  }

  if (!state.callToAction.active || dismissed) {
    return null;
  }

  const text = state.callToAction.text;
  const isLong = text.length > 60;

  return (
    <div className="relative">
      <button
        onClick={() => isLong && setExpanded(!expanded)}
        className={`w-full bg-accent text-accent-foreground transition-all duration-300 ${
          expanded ? 'pb-4' : ''
        } ${isLong ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <div className="container mx-auto px-4 sm:px-8">
          <div className="flex items-center justify-center gap-2 pt-2">
            <Bell className="h-3.5 w-3.5 flex-shrink-0" />
            {!expanded && (
              <div className="flex items-center gap-2 min-w-0 max-w-full">
                <p className="text-xs font-bold uppercase tracking-wider truncate whitespace-nowrap">
                  {text}
                </p>
                {isLong && (
                  <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 animate-bounce" />
                )}
              </div>
            )}
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-center pt-2 leading-relaxed">
                  {text}
                </p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <ChevronUp className="h-3.5 w-3.5" />
                  <span className="text-[10px] uppercase tracking-widest opacity-70">Show less</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          setDismissed(true);
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-accent-foreground/60 hover:text-accent-foreground transition-colors"
        aria-label="Dismiss announcement"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
