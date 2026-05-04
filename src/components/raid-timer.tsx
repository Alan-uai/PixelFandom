'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Raid {
  minute: number;
  name: string;
}

const lobbyRaids: Raid[] = [
  { minute: 0, name: 'Easy Dungeon' },
  { minute: 10, name: 'Medium Dungeon' },
  { minute: 15, name: 'Leaf Raid' },
  { minute: 20, name: 'Hard Dungeon' },
  { minute: 30, name: 'Insane Dungeon' },
  { minute: 40, name: 'Crazy Dungeon' },
  { minute: 50, name: 'Nightmare Dungeon' },
];

export function RaidTimer() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [nextRaid, setNextRaid] = useState<Raid | null>(null);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateNextRaid = () => {
      const now = new Date();
      const currentMinute = now.getMinutes();
      let upcomingRaid: Raid | undefined;

      // Find the next raid in the current hour
      upcomingRaid = lobbyRaids
        .slice()
        .sort((a, b) => a.minute - b.minute)
        .find(raid => raid.minute > currentMinute);

      // If no more raids in this hour, the next one is the first one of the next hour
      if (!upcomingRaid) {
        upcomingRaid = lobbyRaids.slice().sort((a, b) => a.minute - b.minute)[0];
      }
      
      setNextRaid(upcomingRaid || null);

      if (upcomingRaid) {
        const raidTime = new Date();
        if (upcomingRaid.minute <= currentMinute) {
          // It's for the next hour
          raidTime.setHours(raidTime.getHours() + 1);
        }
        raidTime.setMinutes(upcomingRaid.minute);
        raidTime.setSeconds(0);
        raidTime.setMilliseconds(0);
        
        const diff = raidTime.getTime() - now.getTime();
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        
        setTimeLeft(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      }
    };

    calculateNextRaid();
    const interval = setInterval(calculateNextRaid, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-14 w-full flex justify-center z-40 pointer-events-none">
        <div className="flex flex-col items-center transition-all duration-300 ease-in-out pointer-events-auto w-auto">
            <div 
                className="w-full h-3 bg-background/80 backdrop-blur-sm"
                style={{
                    clipPath: 'polygon(0% 0%, 100% 0%, 55% 100%, 45% 100%)'
                }}
            />
            <motion.div 
                className="w-full bg-background/80 backdrop-blur-sm border-x border-b rounded-b-lg shadow-lg overflow-hidden flex flex-col items-center"
                initial={false}
                animate={{ height: isExpanded ? 'auto' : '2rem' }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
                <div 
                    className="flex items-center justify-center gap-1.5 h-8 px-2 cursor-pointer"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <Timer className="h-3 w-3 text-muted-foreground" />
                    <span className='text-xs font-mono tracking-tighter'>{timeLeft}</span>
                </div>
                <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        className="px-3 pb-2 text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, delay: 0.1 }}
                    >
                        <p className="text-xs text-muted-foreground">Próxima Raid</p>
                        <p className="text-sm font-semibold text-primary -mt-1">{nextRaid?.name || 'Calculando...'}</p>
                    </motion.div>
                )}
                </AnimatePresence>
            </motion.div>
        </div>
    </div>
  );
}
