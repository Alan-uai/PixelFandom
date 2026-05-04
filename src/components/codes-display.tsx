
'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from './ui/scroll-area';
import { useApp } from '@/context/app-provider';

interface CategorizedCodes {
  likes: string[];
  fav: string[];
  update: string[];
  visits: string[];
}

export function CodesDisplay() {
  const { activeSidePanel, setActiveSidePanel, wikiArticles } = useApp();
  const isExpanded = activeSidePanel === 'codes';
  const { toast } = useToast();

  const allCodesRaw = useMemo(() => {
    const upgradesCostsArticle = wikiArticles.find(a => a.id === 'upgrades-costs');
    if (!upgradesCostsArticle) return [];
    
    const codeRegex = /`([^`]+)`/g;
    return upgradesCostsArticle.content.match(codeRegex)?.map(c => c.replace(/`/g, '')) || [];
  }, [wikiArticles]);

  const codes = useMemo((): CategorizedCodes => {
    return allCodesRaw.reduce<CategorizedCodes>((acc, code) => {
      const lowerCode = code.toLowerCase();
      if (lowerCode.includes('like')) {
        acc.likes.push(code);
      } else if (lowerCode.includes('fav')) {
        acc.fav.push(code);
      } else if (lowerCode.includes('update') || lowerCode.includes('upd')) {
        acc.update.push(code);
      } else if (lowerCode.includes('visits')) {
        acc.visits.push(code);
      }
      return acc;
    }, { likes: [], fav: [], update: [], visits: [] });
  }, [allCodesRaw]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Código Copiado!',
      description: `${code} foi copiado para a área de transferência.`,
    });
  };
  
  const togglePanel = () => {
    setActiveSidePanel(isExpanded ? null : 'codes');
  }

  return (
    <motion.div 
        className="flex flex-col items-center transition-all duration-300 ease-in-out pointer-events-auto"
        initial={false}
        animate={{ width: isExpanded ? 300 : 'auto' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
        <div 
            className="w-full h-3 bg-background/80 backdrop-blur-sm shrink-0"
            style={{
                clipPath: 'polygon(0% 0%, 100% 0%, 55% 100%, 45% 100%)'
            }}
        />
        <div className="w-full bg-background/80 backdrop-blur-sm border-x border-b rounded-b-lg shadow-lg overflow-hidden flex flex-col items-center flex-grow">
            <div 
                className="flex items-center justify-center gap-1.5 h-8 px-2 cursor-pointer w-full shrink-0"
                onClick={togglePanel}
            >
                <Gift className="h-4 w-4 text-muted-foreground" />
                <span className='text-xs font-semibold'>Códigos</span>
            </div>
            <AnimatePresence>
            {isExpanded && (
                <motion.div
                    className="w-full"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                    <div className="p-3 pt-1 text-center w-[300px] h-72">
                      <ScrollArea className="h-full w-full pr-4">
                        <div className="space-y-3">
                            {codes.update.length > 0 && (
                                <div className='space-y-1'>
                                    <p className='text-xs font-semibold text-muted-foreground'>Update</p>
                                    <ul className="space-y-1">
                                        {codes.update.map(code => (
                                            <li key={code} onClick={() => handleCopyCode(code)} className="cursor-pointer text-sm font-mono text-primary bg-primary/10 rounded-md py-1 flex items-center justify-center gap-2 hover:bg-primary/20">
                                                {code} <Copy className="h-3 w-3" />
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {codes.likes.length > 0 && (
                                <div className='space-y-1'>
                                    <p className='text-xs font-semibold text-muted-foreground'>Likes</p>
                                    <ul className="space-y-1">
                                        {codes.likes.map(code => (
                                            <li key={code} onClick={() => handleCopyCode(code)} className="cursor-pointer text-sm font-mono text-primary bg-primary/10 rounded-md py-1 flex items-center justify-center gap-2 hover:bg-primary/20">
                                                {code} <Copy className="h-3 w-3" />
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {codes.fav.length > 0 && (
                                <div className='space-y-1'>
                                    <p className='text-xs font-semibold text-muted-foreground'>Fav</p>
                                    <ul className="space-y-1">
                                        {codes.fav.map(code => (
                                            <li key={code} onClick={() => handleCopyCode(code)} className="cursor-pointer text-sm font-mono text-primary bg-primary/10 rounded-md py-1 flex items-center justify-center gap-2 hover:bg-primary/20">
                                                {code} <Copy className="h-3 w-3" />
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {codes.visits.length > 0 && (
                                <div className='space-y-1'>
                                    <p className='text-xs font-semibold text-muted-foreground'>Visits</p>
                                    <ul className="space-y-1">
                                        {codes.visits.map(code => (
                                            <li key={code} onClick={() => handleCopyCode(code)} className="cursor-pointer text-sm font-mono text-primary bg-primary/10 rounded-md py-1 flex items-center justify-center gap-2 hover:bg-primary/20">
                                                {code} <Copy className="h-3 w-3" />
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                      </ScrollArea>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    </motion.div>
  );
}
