'use client';

import { createContext, useContext, useState, type Dispatch, type SetStateAction, type ReactNode } from 'react';

interface WikiSearchContextType {
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
}

const WikiSearchContext = createContext<WikiSearchContextType>({
  searchQuery: '',
  setSearchQuery: () => {},
});

export function WikiSearchProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');
  return (
    <WikiSearchContext.Provider value={{ searchQuery, setSearchQuery }}>
      {children}
    </WikiSearchContext.Provider>
  );
}

export function useWikiSearch() {
  return useContext(WikiSearchContext);
}
