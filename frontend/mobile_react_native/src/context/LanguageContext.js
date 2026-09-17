import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [langue, setLangue] = useState('fr');

  useEffect(() => {
    (async () => {
      const saved = await SecureStore.getItemAsync('langue_preferee');
      if (saved) setLangue(saved);
    })();
  }, []);

  const changerLangue = async (nouvelleLangue) => {
    setLangue(nouvelleLangue);
    await SecureStore.setItemAsync('langue_preferee', nouvelleLangue);
  };

  return (
    <LanguageContext.Provider value={{ langue, changerLangue }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLangue() {
  return useContext(LanguageContext);
}
