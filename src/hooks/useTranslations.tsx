import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Language = Tables<'languages'>;
type Translation = Tables<'translations'>;

interface TranslationWithLanguage extends Translation {
  language: Language;
}

export function useTranslations() {
  const [translations, setTranslations] = useState<TranslationWithLanguage[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTranslations = async () => {
    try {
      setLoading(true);
      
      // Fetch all translations with language info
      const { data: translationsData, error: translationsError } = await supabase
        .from('translations')
        .select(`
          *,
          language:languages(*)
        `)
        .order('translation_key');

      if (translationsError) throw translationsError;

      // Fetch all languages
      const { data: languagesData, error: languagesError } = await supabase
        .from('languages')
        .select('*')
        .order('name');

      if (languagesError) throw languagesError;

      setTranslations(translationsData as TranslationWithLanguage[] || []);
      setLanguages(languagesData || []);
    } catch (error) {
      console.error('Error fetching translations:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTranslation = async (translation: Omit<Translation, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('translations')
        .insert(translation)
        .select(`
          *,
          language:languages(*)
        `)
        .single();

      if (error) throw error;
      
      await fetchTranslations(); // Refresh the list
      return data;
    } catch (error) {
      console.error('Error creating translation:', error);
      throw error;
    }
  };

  const updateTranslation = async (id: string, updates: Partial<Translation>) => {
    try {
      const { data, error } = await supabase
        .from('translations')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          language:languages(*)
        `)
        .single();

      if (error) throw error;
      
      await fetchTranslations(); // Refresh the list
      return data;
    } catch (error) {
      console.error('Error updating translation:', error);
      throw error;
    }
  };

  const deleteTranslation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('translations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchTranslations(); // Refresh the list
    } catch (error) {
      console.error('Error deleting translation:', error);
      throw error;
    }
  };

  const createLanguage = async (language: Omit<Language, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('languages')
        .insert(language)
        .select()
        .single();

      if (error) throw error;
      
      await fetchTranslations(); // Refresh the list
      return data;
    } catch (error) {
      console.error('Error creating language:', error);
      throw error;
    }
  };

  const updateLanguage = async (id: string, updates: Partial<Language>) => {
    try {
      const { data, error } = await supabase
        .from('languages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      await fetchTranslations(); // Refresh the list
      return data;
    } catch (error) {
      console.error('Error updating language:', error);
      throw error;
    }
  };

  const deleteLanguage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('languages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchTranslations(); // Refresh the list
    } catch (error) {
      console.error('Error deleting language:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchTranslations();
  }, []);

  return {
    translations,
    languages,
    loading,
    createTranslation,
    updateTranslation,
    deleteTranslation,
    createLanguage,
    updateLanguage,
    deleteLanguage,
    refetch: fetchTranslations,
  };
}