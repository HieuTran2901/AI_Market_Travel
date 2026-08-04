import { createContext, useContext, useState, ReactNode } from 'react';

interface ListingLanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
}

const ListingLanguageContext = createContext<ListingLanguageContextType | undefined>(undefined);

export function ListingLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState('English (US)');

  return (
    <ListingLanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </ListingLanguageContext.Provider>
  );
}

export function useListingLanguage() {
  const context = useContext(ListingLanguageContext);
  if (context === undefined) {
    throw new Error('useListingLanguage must be used within a ListingLanguageProvider');
  }
  return context;
}
