import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import { cn } from 'cn'
import { BOTTOM_NAV_ITEMS } from './navItems'

/** Fixed bottom tab bar for phones and tablets (hidden on desktop). */
export function BottomNav() {
  const { t } = useTranslation()
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden">
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {BOTTOM_NAV_ITEMS.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 px-1 py-2 text-[11px] font-medium',
                  isActive ? 'text-foreground' : 'text-muted-foreground',
                )
              }
            >
              <item.icon className="size-5" />
              <span className="truncate">{t(item.labelKey)}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
