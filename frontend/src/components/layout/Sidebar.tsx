import { Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import { cn } from 'cn'
import { NAV_ITEMS, type NavItem } from './navItems'

/** A single navigation link that highlights when its route is active. */
export function NavLinkItem({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const { t } = useTranslation()
  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground',
        )
      }
    >
      <item.icon className="size-4 shrink-0" />
      <span className="truncate">{t(item.labelKey)}</span>
    </NavLink>
  )
}

/** Desktop-only side navigation (hidden below the `lg` breakpoint). */
export function Sidebar() {
  const { t } = useTranslation()
  return (
    <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-e bg-sidebar lg:flex">
      <div className="flex h-14 items-center gap-2 px-5 font-semibold">
        <Wallet className="size-5" />
        <span>{t('common.appName')}</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
        {NAV_ITEMS.map((item) => (
          <NavLinkItem key={item.path} item={item} />
        ))}
      </nav>
    </aside>
  )
}
