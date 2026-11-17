import { ArrowRight } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from 'cn'

/** One landing section: exactly `h` screens tall on desktop (see landing.css), its heading first. */
export function Section({
  id,
  h = 1,
  hm,
  className,
  children,
  labelledBy,
}: {
  id: string
  h?: 1 | 2
  /** Screens on a phone, when stacking makes the content taller than `h`. */
  hm?: 1 | 2
  className?: string
  children: ReactNode
  labelledBy?: string
}) {
  return (
    <section id={id} className={cn('screen', className)} style={{ '--h': h, '--hm': hm ?? h } as CSSProperties} aria-labelledby={labelledBy ?? `${id}-h`}>
      <div className="wrap">{children}</div>
    </section>
  )
}

/** The h2 and a muted lead that every section opens with. */
export function SectionHead({ id, title, lead, className }: { id: string; title: string; lead?: string; className?: string }) {
  return (
    <div className={cn('max-w-3xl', className)}>
      <h2 id={`${id}-h`}>{title}</h2>
      {lead && <p className="mt-4 text-lg leading-7 text-muted-foreground">{lead}</p>}
    </div>
  )
}

type ActionProps = { to: string; children: ReactNode; className?: string; size?: 'md' | 'xl' }

/** The dealt "arrow" button look: a solid primary with an arrow that moves 3px on hover, 44px tall (88px for the closing). */
export function PrimaryAction({ to, children, className, size = 'md' }: ActionProps) {
  return (
    <Link
      to={to}
      className={cn(
        'btn-step group inline-flex items-center justify-center gap-2 rounded-full bg-primary font-medium text-primary-foreground shadow-sm',
        size === 'md' ? 'h-11 px-6 text-[15px]' : 'h-16 w-full px-8 font-heading text-2xl sm:h-[88px] sm:text-[32px]',
        className,
      )}
    >
      {children}
      <ArrowRight
        className={cn('transition-transform duration-150 group-hover:translate-x-[3px] rtl:rotate-180 rtl:group-hover:-translate-x-[3px]', size === 'md' ? 'size-4' : 'size-7')}
        aria-hidden
      />
    </Link>
  )
}

/** The arrow look's secondary: a plain text link with a drawn underline, no step. */
export function SecondaryAction({ to, children, className }: ActionProps) {
  const inPage = to.startsWith('#')
  const cls = cn(
    'link-draw inline-flex h-11 items-center gap-1.5 text-[15px] font-medium text-foreground rounded-sm',
    className,
  )
  return inPage ? (
    <a href={to} className={cls}>
      {children}
    </a>
  ) : (
    <Link to={to} className={cls}>
      {children}
    </Link>
  )
}
