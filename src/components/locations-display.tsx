'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, PlayCircle } from 'lucide-react';
import { useApp } from '@/context/app-provider';
import { ScrollArea } from './ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface BossLocation {
  worldName: string;
  bosses: any[];
}

export function LocationsDisplay() {
  const { activeSidePanel, setActiveSidePanel, allGameData, isGameDataLoading } = useApp();
  const isExpanded = activeSidePanel === 'locations';

  const bossLocations = useMemo((): BossLocation[] => {
    if (isGameDataLoading || !allGameData || allGameData.length === 0) {
      return [];
    }

    const locations: BossLocation[] = [];

    allGameData.forEach(world => {
      if (world?.npcs && Array.isArray(world.npcs) && world.npcs.length > 0) {
        const bossesInWorld = world.npcs.filter((npc: any) => npc && (npc.rank === 'SS' || npc.rank === 'SSS'));

        if (bossesInWorld.length > 0) {
          locations.push({
            worldName: world.name,
            bosses: bossesInWorld,
          });
        }
      }
    });

    return locations;
  }, [allGameData, isGameDataLoading]);


  const togglePanel = () => {
    setActiveSidePanel(isExpanded ? null : 'locations');
  };

  const handleItemClick = (item: any) => {
    const url = Array.isArray(item.videoUrl) ? item.videoUrl[0] : item.videoUrl;
    if (url) {
      // Create a temporary anchor element
      const a = document.createElement('a');
      a.href = url;
      
      // Use the download attribute to force download
      a.download = ''; // Let the browser determine the filename
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  return (
    <>
      <motion.div
        className="flex flex-col items-center transition-all duration-300 ease-in-out pointer-events-auto"
        initial={false}
        animate={{ width: isExpanded ? 300 : 'auto' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <div
          className="w-full h-3 bg-background/80 backdrop-blur-sm shrink-0"
          style={{ clipPath: 'polygon(0% 0%, 100% 0%, 55% 100%, 45% 100%)' }}
        />
        <div className="w-full bg-background/80 backdrop-blur-sm border-x border-b rounded-b-lg shadow-lg overflow-hidden flex flex-col items-center flex-grow">
          <div
            className="flex items-center justify-center gap-1.5 h-8 px-2 cursor-pointer w-full shrink-0"
            onClick={togglePanel}
          >
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-semibold">Bosses</span>
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                className="w-full"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <div className="px-1 pt-1 text-left w-[300px] h-80">
                  <ScrollArea className="h-full w-full pr-3">
                    {isGameDataLoading ? (
                        <div className='flex items-center justify-center h-full'><Loader2 className='h-6 w-6 animate-spin text-primary' /></div>
                    ) : (
                        <Accordion type="multiple" className="w-full">
                          {bossLocations.map(({ worldName, bosses }) => (
                            <AccordionItem value={worldName} key={worldName}>
                              <AccordionTrigger className="text-sm font-semibold py-2">
                                {worldName}
                              </AccordionTrigger>
                              <AccordionContent>
                                <ul className="text-xs space-y-1 pl-2">
                                  {bosses.map((boss, index) => (
                                    <li key={boss.id || boss.name || index}>
                                      <button
                                        onClick={() => handleItemClick(boss)}
                                        className={cn(
                                          'w-full text-left flex items-center gap-1.5',
                                          boss.videoUrl ? 'cursor-pointer hover:underline' : 'cursor-default'
                                        )}
                                        disabled={!boss.videoUrl}
                                      >
                                        <span>{boss.name}</span>
                                        {boss.videoUrl && <PlayCircle className='inline h-3 w-3 text-primary/70' />}
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                    )}
                  </ScrollArea>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}
