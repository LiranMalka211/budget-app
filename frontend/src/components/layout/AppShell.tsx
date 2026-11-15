import type { ReactNode } from 'react'
import { BottomNav } from './BottomNav'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

/** Responsive frame for all authenticated pages: sidebar on desktop, top bar plus bottom tabs on mobile and tablet. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-4 pb-24 sm:px-6 sm:pt-6 lg:pb-8">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
