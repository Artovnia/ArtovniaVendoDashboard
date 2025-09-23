import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Select, Text } from '@medusajs/ui';

import { languages } from '../../../i18n/languages';

/**
 * Component for switching between available languages
 * Uses local storage for persistence but falls back to in-memory state if unavailable
 */
export const LanguageSwitcher = () => {
  const { i18n: i18nInstance } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18nInstance.language || 'en');
  
  // Available languages for the dropdown (currently only English and Polish)
  const availableLanguages = languages.filter(lang => ['en', 'pl'].includes(lang.code));
  
  // Handle language change
  const handleLanguageChange = useCallback((value: string) => {
    setCurrentLanguage(value);
    
    // Change language in i18n instance
    i18nInstance.changeLanguage(value);
    
    // Store language preference in localStorage for persistence
    try {
      localStorage.setItem('vendor_lang', value);
    } catch (e) {
      console.warn('Failed to save language preference to localStorage', e);
    }
  }, [i18nInstance]);
  
  // Initialize language from stored preference on component mount
  useEffect(() => {
    try {
      // Try to get language from vendor-specific storage key
      const storedLang = localStorage.getItem('vendor_lang');
      if (storedLang && ['en', 'pl'].includes(storedLang)) {
        handleLanguageChange(storedLang);
      }
    } catch (e) {
      console.warn('Failed to retrieve language preference from localStorage', e);
    }
  }, [handleLanguageChange]);
  
  return (
    <div className="flex items-center gap-2">
      <Text size="small" className="text-ui-fg-subtle">
        Język:
      </Text>
      <Select
        size="small"
        value={currentLanguage}
        onValueChange={handleLanguageChange}
      >
        <Select.Trigger>
          {currentLanguage === 'en' ? 'English' : 'Polski'}
        </Select.Trigger>
        <Select.Content>
          {availableLanguages.map((lang) => (
            <Select.Item key={lang.code} value={lang.code}>
              {lang.display_name}
            </Select.Item>
          ))}
        </Select.Content>
      </Select>
    </div>
  );
};
