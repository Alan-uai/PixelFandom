'use client';

import { useState, useEffect } from 'react';
import { supabase } from './client';
import { useSupabase } from './provider';

export function useCollection<T>(query: string | null, dependencies: any[] = []) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!query) {
      setData([]);
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.from(query).select('*');
        
        if (error) throw error;
        setData(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, ...dependencies]);

  return { data, isLoading, error, refetch: () => setData(prev => prev) };
}

export function useDoc<T>(query: string | null, dependencies: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!query) {
      setData(null);
      setIsLoading(false);
      return;
    }

    const [table, id] = query.split('/');
    
    if (!table || !id) {
      setData(null);
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
        
        if (error) throw error;
        setData(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, ...dependencies]);

  return { data, isLoading, error, refetch: () => setData(prev => prev) };
}

export function useUserData<T>(table: string) {
  const { user } = useSupabase();
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setData([]);
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.from(table).select('*').eq('user_id', user.id);
        
        if (error) throw error;
        setData(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [table, user]);

  return { data, isLoading, error };
}

export function useUserDoc<T>(table: string) {
  const { user } = useSupabase();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setData(null);
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const { data: userData, error } = await supabase
          .from(table)
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (error) throw error;
        setData(userData);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [table, user]);

  return { data, isLoading, error };
}

export function useGameData(table: string) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const { data: gameData, error } = await supabase.from(table).select('*').order('name');
        
        if (error) throw error;
        setData(gameData || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [table]);

  return { data, isLoading, error };
}

export function useWorlds() {
  return useGameData('worlds');
}

export function useDungeons() {
  return useGameData('dungeons');
}

export function useSwords() {
  return useGameData('swords');
}

export function useArmors() {
  return useGameData('armors');
}

export function useBosses() {
  return useGameData('bosses');
}

export function useQuests() {
  return useGameData('quests');
}

export function useChests() {
  return useGameData('chests');
}

export function useRings() {
  return useGameData('rings');
}

export function useGamepasses() {
  return useGameData('gamepasses');
}

export function useAuras() {
  return useGameData('auras');
}

export function usePets() {
  return useGameData('pets');
}

export function useFighters() {
  return useGameData('fighters');
}

export function useAchievements() {
  return useGameData('achievements');
}

export function usePowers() {
  return useGameData('powers');
}

export function useObelisks() {
  return useGameData('obelisks');
}