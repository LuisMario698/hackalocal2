import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { Language, getTranslation } from '../constants/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'es',
  setLanguage: async () => {},
  t: (key: string) => key,
});

export const useLanguage = () => useContext(LanguageContext);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLang] = useState<Language>('es');
  const { session } = useAuth();

  useEffect(() => {
    loadLanguage();
  }, [session]);

  const loadLanguage = async () => {
    try {
      // 1. Try to get from Supabase if logged in
      if (session?.user?.id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('language')
          .eq('id', session.user.id)
          .single();

        if (!error && data && data.language) {
          if (data.language === 'yaq' || data.language === 'es') {
            setLang(data.language as Language);
            return;
          }
        }
      }

      // 2. Otherwise fallback to AsyncStorage
      const stored = await AsyncStorage.getItem('app_language');
      if (stored === 'es' || stored === 'yaq') {
        setLang(stored as Language);
      }
    } catch (e) {
      console.warn('Failed to load language', e);
    }
  };

  const setLanguage = async (newLang: Language) => {
    setLang(newLang);
    try {
      await AsyncStorage.setItem('app_language', newLang);

      if (session?.user?.id) {
        await supabase
          .from('profiles')
          .update({ language: newLang })
          .eq('id', session.user.id);
      }
    } catch (e) {
      console.warn('Failed to save language', e);
    }
  };

  const t = (key: string) => {
    return getTranslation(language, key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
