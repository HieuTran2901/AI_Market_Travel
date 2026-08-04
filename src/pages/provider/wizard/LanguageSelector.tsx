import { useState, useRef, useEffect } from 'react';
import { useListingLanguage } from '../../../context/ListingLanguageContext';
import { Globe2, ChevronDown, Check } from 'lucide-react';

const languages = [
  { code: 'en-US', label: 'English (US)', flag: '🇺🇸' },
  { code: 'vi-VN', label: 'Vietnamese', flag: '🇻🇳' },
  { code: 'ja-JP', label: 'Japanese', flag: '🇯🇵' },
  { code: 'ko-KR', label: 'Korean', flag: '🇰🇷' },
  { code: 'zh-CN', label: 'Chinese (Simplified)', flag: '🇨🇳' },
  { code: 'fr-FR', label: 'French', flag: '🇫🇷' },
  { code: 'es-ES', label: 'Spanish', flag: '🇪🇸' },
  { code: 'de-DE', label: 'German', flag: '🇩🇪' }
];

export function LanguageSelector() {
  const { language, setLanguage } = useListingLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedLang = languages.find(l => l.label === language || l.code === language) || languages[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <Globe2 className="h-4 w-4 text-blue-600" />
        <span className="flex items-center gap-1.5">
          <span>{selectedLang.flag}</span>
          <span>{selectedLang.label}</span>
        </span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-slate-100 bg-white p-1 shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setLanguage(lang.label);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-4 py-2 text-sm ${
                  language === lang.label || language === lang.code
                    ? 'bg-blue-50 font-bold text-blue-700'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </div>
                {(language === lang.label || language === lang.code) && (
                  <Check className="h-4 w-4 text-blue-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
