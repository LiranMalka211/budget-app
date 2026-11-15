import { LogOut, Menu, Settings } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/app/routes'
import { BrandMark } from '@/components/common/BrandMark'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useAuth } from '@/features/auth/authStore'
import { getLanguage } from '@/lib/i18n'
import { LanguageSwitcher } from './LanguageSwitcher'
import { NAV_ITEMS } from './navItems'
import { NavLinkItem } from './Sidebar'

/** Returns the user's initials for the avatar badge. */
function initials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
}

/** Header with the mobile drawer button, app title, language switcher and user menu. */
export function TopBar() {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)
  // The drawer opens from the leading edge: left in LTR, right in RTL.
  const drawerSide = getLanguage(i18n.resolvedLanguage ?? i18n.language).dir === 'rtl' ? 'right' : 'left'

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t('common.openMenu')}>
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side={drawerSide} className="w-72">
          <SheetHeader>
            <SheetTitle>
              <BrandMark />
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 px-2">
            {NAV_ITEMS.map((item) => (
              <NavLinkItem key={item.path} item={item} onNavigate={() => setDrawerOpen(false)} />
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      <BrandMark className="lg:hidden" />

      <div className="ms-auto flex items-center gap-1">
        <LanguageSwitcher />
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full" aria-label={t('common.menu')}>
                <Avatar className="size-8">
                  <AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">{initials(user.firstName, user.lastName)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex flex-col">
                <span>
                  {user.firstName} {user.lastName}
                </span>
                <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate(ROUTES.settings)}>
                <Settings /> {t('nav.settings')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout} variant="destructive">
                <LogOut /> {t('nav.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
