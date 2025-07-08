import { Globe, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';

export function LanguageSelector() {
  const { currentLanguage, languages, changeLanguage, isRTL } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">
            {currentLanguage?.native_name || 'Language'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align={isRTL ? "start" : "end"} 
        className="w-48 bg-card border shadow-lg"
      >
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.id}
            onClick={() => changeLanguage(language.code)}
            className="flex items-center justify-between px-3 py-2 hover:bg-muted cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">{language.native_name}</span>
              <span className="text-xs text-muted-foreground">
                ({language.name})
              </span>
            </div>
            {currentLanguage?.code === language.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}