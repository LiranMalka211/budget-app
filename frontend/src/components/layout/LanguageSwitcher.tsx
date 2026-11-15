import { Check, Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LANGUAGES } from '@/lib/i18n'

/** Dropdown that switches the UI language; Hebrew also flips the layout to RTL via useDirection. */
export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()
  const current = i18n.resolvedLanguage ?? i18n.language
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('common.language')}>
          <Languages />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem key={lang.code} onClick={() => void i18n.changeLanguage(lang.code)}>
            <span className="flex-1">{lang.label}</span>
            {current === lang.code && <Check className="size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
