import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import { cn } from 'cn'
import { ROUTES } from '@/app/routes'
import { BrandMark } from '@/components/common/BrandMark'
import { NAV_ITEMS, type NavItem } from './navItems'

/** A single navigation link that highlights when its route is active. */
export function NavLinkItem({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const { t } = useTranslation()
  return (
    <NavLink
      to={item.path}
      end={item.path === ROUTES.dashboard}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground [&>svg]:text-sidebar-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
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
  return (
    <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-e bg-sidebar lg:flex">
      <div className="flex h-16 items-center px-5">
        <BrandMark />
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3 py-3">
        {NAV_ITEMS.map((item) => (
          <NavLinkItem key={item.path} item={item} />
        ))}
      </nav>
    </aside>
  )
}
