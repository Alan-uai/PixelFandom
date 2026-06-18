'use client';

import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useState, useEffect } from 'react';
import type { Message, SavedAnswer, WikiArticle } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getGameDataVersion, getAllGameData } from '@/supabase/game-data';
import { usePathname, useRouter } from 'next/navigation';
import { useAdmin } from '@/hooks/use-admin';
import { Loader2 } from 'lucide-react';
import { allGameData as staticGameData } from '@/lib/game-data-context';
import { supabase, SupabaseProvider, useUser } from '@/supabase';
import { UserPreferencesProvider } from '@/context/user-preferences-context';
import { BadgeCelebration } from '@/components/gamification/badge-celebration';

type ActiveSidePanel = 'codes' | 'locations' | null;

interface AppContextType {
  savedAnswers: SavedAnswer[];
  toggleSaveAnswer: (answer: Message) => void;
  isAnswerSaved: (answerId: string) => boolean;
  wikiArticles: WikiArticle[];
  isWikiLoading: boolean;
  isAuthDialogOpen: boolean;
  setAuthDialogOpen: (open: boolean) => void;
  gameDataVersion: string;
  allGameData: any[];
  isGameDataLoading: boolean;
  activeSidePanel: ActiveSidePanel;
  setActiveSidePanel: (panel: ActiveSidePanel) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const WIKI_CACHE_STORAGE_KEY = 'eternal-guide-wiki-cache';
const GAME_DATA_CACHE_KEY = 'eternal-guide-game-data-cache';
const LAST_VISITED_ROUTE_KEY = 'eternal-guide-last-route';

function AppStateProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  
  const [wikiArticles, setWikiArticles] = useState<WikiArticle[]>([]);
  const [allGameData, setAllGameData] = useState<any[]>([]);
  const [isAuthDialogOpen, setAuthDialogOpen] = useState(false);
  const [isGameDataLoading, setIsGameDataLoading] = useState(true);
  const [activeSidePanel, setActiveSidePanel] = useState<ActiveSidePanel>(null);
  const [savedAnswers, setSavedAnswers] = useState<SavedAnswer[]>([]);
  const [areSavedAnswersLoading, setAreSavedAnswersLoading] = useState(true);
  
  const [isInitialAppLoad, setIsInitialAppLoad] = useState(true);

  useEffect(() => {
    if (pathname && !pathname.startsWith('/admin')) {
      localStorage.setItem(LAST_VISITED_ROUTE_KEY, pathname);
    }
  }, [pathname]);

  useEffect(() => {
    if (!isAdminLoading && isInitialAppLoad) {
      const lastRoute = localStorage.getItem(LAST_VISITED_ROUTE_KEY);
      if (lastRoute && pathname !== lastRoute && !pathname.startsWith('/admin')) {
        router.replace(lastRoute);
      }
      setIsInitialAppLoad(false);
    }
  }, [isAdmin, isAdminLoading, isInitialAppLoad, router, pathname]);

  const [gameDataVersion, setGameDataVersion] = useState('1.0.0');

  useEffect(() => {
    async function fetchVersion() {
      try {
        const version = await getGameDataVersion();
        setGameDataVersion(version);
      } catch {
        const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
        setGameDataVersion(today);
      }
    }
    fetchVersion();
  }, []);

  useEffect(() => {
    const loadGameData = async () => {
        setIsGameDataLoading(true);
        try {
            const cachedData = localStorage.getItem(GAME_DATA_CACHE_KEY);
            if (cachedData) {
                const { version, data } = JSON.parse(cachedData);
                if (version === gameDataVersion) {
                    setAllGameData(data);
                    setIsGameDataLoading(false);
                    return;
                }
            }
            
            const supabaseData = await getAllGameData();
            
            let combinedData;
            if (supabaseData && supabaseData.length > 0) {
                const supabaseMap = new Map(supabaseData.map((item: any) => [item.id, item]));
                combinedData = staticGameData.map(staticItem => {
                    const supabaseItem = supabaseMap.get(staticItem.id);
                    return supabaseItem ? { ...staticItem, ...supabaseItem } : staticItem;
                });
            } else {
                console.warn("Could not fetch game data from Supabase, falling back to static data.");
                combinedData = staticGameData;
            }

            setAllGameData(combinedData);
            localStorage.setItem(GAME_DATA_CACHE_KEY, JSON.stringify({ version: gameDataVersion, data: combinedData }));

        } catch (error) {
            console.error("Failed to load all game data, falling back to static:", error);
            setAllGameData(staticGameData);
        } finally {
            setIsGameDataLoading(false);
        }
    };
    
    if (gameDataVersion) {
      loadGameData();
    }

  }, [gameDataVersion]);

  useEffect(() => {
    try {
      const wikiCacheItem = window.localStorage.getItem(WIKI_CACHE_STORAGE_KEY);
      if (wikiCacheItem) {
        setWikiArticles(JSON.parse(wikiCacheItem));
      }
    } catch (error) {
      console.error("Falha ao carregar wiki do armazenamento local", error);
    }
  }, []);
  
  useEffect(() => {
    const fetchWikiArticles = async () => {
      const { data } = await supabase.from('wiki_articles').select('*');
      if (data && data.length > 0) {
        const hasChanged = JSON.stringify(data) !== JSON.stringify(wikiArticles);
        if (hasChanged) {
          setWikiArticles(data as WikiArticle[]);
          try {
            window.localStorage.setItem(WIKI_CACHE_STORAGE_KEY, JSON.stringify(data));
          } catch(error) {
            console.error("Falha ao salvar wiki no armazenamento local", error);
          }
        }
      }
    };
    fetchWikiArticles();
  }, [wikiArticles]);

  useEffect(() => {
    if (!user || user.is_anonymous) {
      setSavedAnswers([]);
      setAreSavedAnswersLoading(false);
      return;
    }

    const fetchSavedAnswers = async () => {
      const { data } = await supabase
        .from('saved_answers')
        .select('*')
        .eq('user_id', user.id);

      if (data) {
        setSavedAnswers(data as SavedAnswer[]);
      }
      setAreSavedAnswersLoading(false);
    };

    fetchSavedAnswers();
  }, [user]);

  const isAnswerSaved = useCallback((answerId: string) => {
    return !!savedAnswers && savedAnswers.some((saved) => saved.id === answerId);
  }, [savedAnswers]);

  const toggleSaveAnswer = useCallback(async (answer: Message) => {
    if (!user || user.is_anonymous) {
      toast({
        variant: 'destructive',
        title: 'Ação necessária',
        description: 'Você precisa estar logado para salvar respostas.',
      });
      setAuthDialogOpen(true);
      return;
    }

    if (isAnswerSaved(answer.id)) {
      await supabase
        .from('saved_answers')
        .delete()
        .eq('id', answer.id)
        .eq('user_id', user.id);

      setSavedAnswers(prev => prev.filter(s => s.id !== answer.id));

      toast({
        variant: 'default',
        title: "Resposta Removida",
        description: "A resposta foi removida da sua lista salva.",
      });
    } else {
      const newAnswer = {
        id: answer.id,
        user_id: user.id,
        question: answer.question || '',
        answer: answer.content,
        created_at: new Date().toISOString(),
      };

      await supabase
        .from('saved_answers')
        .upsert(newAnswer, { onConflict: 'id' });

      setSavedAnswers(prev => [...prev, newAnswer as unknown as SavedAnswer]);

      toast({
        variant: 'default',
        title: "Resposta Salva!",
        description: "Encontre-a na seção 'Respostas Salvas'.",
      });
    }
  }, [user, isAnswerSaved, toast, setAuthDialogOpen]);
  
  const value: AppContextType = { 
    savedAnswers: savedAnswers || [], 
    toggleSaveAnswer, 
    isAnswerSaved,
    wikiArticles: wikiArticles || [],
    isWikiLoading: areSavedAnswersLoading && wikiArticles.length === 0,
    isAuthDialogOpen,
    setAuthDialogOpen,
    gameDataVersion,
    allGameData,
    isGameDataLoading,
    activeSidePanel,
    setActiveSidePanel,
  };
  
  if (isInitialAppLoad || isAdminLoading || (isGameDataLoading && allGameData.length === 0)) {
      return (
          <div className="flex h-screen w-screen items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      );
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <SupabaseProvider>
      <UserPreferencesProvider>
        <AppStateProvider>
          {children}
          <BadgeCelebration />
        </AppStateProvider>
      </UserPreferencesProvider>
    </SupabaseProvider>
  )
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp deve ser usado dentro de um AppProvider');
  }
  return context;
}
