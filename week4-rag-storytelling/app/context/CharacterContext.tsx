'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface Character {
  name: string;
  description: string;
  personality: string;
}

interface CharacterContextType {
  characters: Character[];
  setCharacters: (characters: Character[]) => void;
}

const CharacterContext = createContext<CharacterContextType | undefined>(undefined);

export function CharacterProvider({ children }: { children: ReactNode }) {
  const [characters, setCharacters] = useState<Character[]>([]);

  return (
    <CharacterContext.Provider value={{ characters, setCharacters }}>
      {children}
    </CharacterContext.Provider>
  );
}

export function useCharacters() {
  const context = useContext(CharacterContext);
  if (context === undefined) {
    throw new Error('useCharacters must be used within a CharacterProvider');
  }
  return context;
} 