import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Language = Tables<'languages'>;
type Translation = Tables<'translations'>;

interface TranslationMap {
  [key: string]: string;
}

interface LanguageContextType {
  currentLanguage: Language | null;
  languages: Language[];
  translations: TranslationMap;
  isRTL: boolean;
  loading: boolean;
  changeLanguage: (languageCode: string) => Promise<void>;
  t: (key: string, fallback?: string) => string;
  refreshTranslations: () => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

const STATIC_FALLBACK_TRANSLATIONS: TranslationMap = {
  'auth.title': 'Welcome Back',
  'auth.subtitle': 'Sign in to access your training dashboard',
  'auth.email': 'Email Address',
  'auth.password': 'Password',
  'auth.signIn': 'Sign In',
  'auth.signUp': 'Create Account',
};

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [currentLanguage, setCurrentLanguage] = useState<Language | null>(null);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [translations, setTranslations] = useState<TranslationMap>({});
  const [loading, setLoading] = useState(true);

  // Load available languages
  const loadLanguages = async () => {
    try {
      const { data, error } = await supabase
        .from('languages')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setLanguages(data || []);
      
      // Set default language if none selected
      if (!currentLanguage && data && data.length > 0) {
        const defaultLang = data.find(lang => lang.code === 'en') || data[0];
        setCurrentLanguage(defaultLang);
        localStorage.setItem('selectedLanguage', defaultLang.code);
      }
    } catch (error) {
      console.error('Error loading languages:', error);
    }
  };

  // Load translations for current language
  const loadTranslations = async (language: Language) => {
    try {
      const { data, error } = await supabase
        .from('translations')
        .select('translation_key, translation_value')
        .eq('language_id', language.id);

      if (error) throw error;
      
      const translationMap: TranslationMap = {};
      data?.forEach(translation => {
        translationMap[translation.translation_key] = translation.translation_value;
      });
      
      setTranslations(translationMap);
    } catch (error) {
      console.error('Error loading translations:', error);
    }
  };

  // Initialize language context
  useEffect(() => {
    const initializeLanguage = async () => {
      await loadLanguages();
      
      // Check for saved language preference
      const savedLanguage = localStorage.getItem('selectedLanguage');
      if (savedLanguage) {
        const language = languages.find(lang => lang.code === savedLanguage);
        if (language) {
          setCurrentLanguage(language);
        }
      }
      
      setLoading(false);
    };

    initializeLanguage();
  }, []);

  // Load translations when language changes
  useEffect(() => {
    if (currentLanguage) {
      loadTranslations(currentLanguage);
      // Update document direction
      document.documentElement.dir = currentLanguage.is_rtl ? 'rtl' : 'ltr';
      document.documentElement.lang = currentLanguage.code;
    }
  }, [currentLanguage]);

  const changeLanguage = async (languageCode: string) => {
    const language = languages.find(lang => lang.code === languageCode);
    if (language) {
      setCurrentLanguage(language);
      localStorage.setItem('selectedLanguage', languageCode);
    }
  };

  const refreshTranslations = async () => {
    await loadLanguages();
    if (currentLanguage) {
      await loadTranslations(currentLanguage);
    }
  };

  // Translation function with static fallback
  const t = (key: string, fallback?: string) => {
    return translations[key] || STATIC_FALLBACK_TRANSLATIONS[key] || (fallback ?? key);
  };

  const value: LanguageContextType = {
    currentLanguage,
    languages,
    translations,
    isRTL: currentLanguage?.is_rtl || false,
    loading,
    changeLanguage,
    t,
    refreshTranslations,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}