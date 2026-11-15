import {
  CalendarClock,
  FileUp,
  LayoutDashboard,
  type LucideIcon,
  ReceiptText,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react'
import { ROUTES } from '@/app/routes'

/** One entry in the navigation menus. `labelKey` is an i18n key under `nav.*`. */
export interface NavItem {
  labelKey: string
  path: string
  icon: LucideIcon
}

/** Full navigation list used by the desktop sidebar and the mobile drawer. */
export const NAV_ITEMS: NavItem[] = [
  { labelKey: 'nav.dashboard', path: ROUTES.dashboard, icon: LayoutDashboard },
  { labelKey: 'nav.transactions', path: ROUTES.transactions, icon: ReceiptText },
  { labelKey: 'nav.scheduled', path: ROUTES.scheduled, icon: CalendarClock },
  { labelKey: 'nav.import', path: ROUTES.import, icon: FileUp },
  { labelKey: 'nav.insights', path: ROUTES.insights, icon: Sparkles },
  { labelKey: 'nav.family', path: ROUTES.family, icon: Users },
  { labelKey: 'nav.settings', path: ROUTES.settings, icon: Settings },
]

/** Subset shown in the mobile bottom bar (the rest live in the drawer). */
export const BOTTOM_NAV_ITEMS: NavItem[] = NAV_ITEMS.slice(0, 5)
