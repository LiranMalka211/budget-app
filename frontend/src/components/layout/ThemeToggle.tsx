import { Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/lib/theme/ThemeProvider'

/** Icon button that flips between light and dark (an explicit choice; "system" lives in Settings). */
export function ThemeToggle({ className }: { className?: string }) {
  const { t } = useTranslation()
  const { resolved, setTheme } = useTheme()
  const dark = resolved === 'dark'
  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      aria-label={dark ? t('common.switchToLight') : t('common.switchToDark')}
      aria-pressed={dark}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
    >
      {dark ? <Sun /> : <Moon />}
    </Button>
  )
}
