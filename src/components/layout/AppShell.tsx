import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNavigation } from './BottomNavigation'
import { MobileHeader } from './MobileHeader'

export function AppShell() {
  return (
    <div className="flex min-h-dvh bg-bg lg:h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col lg:h-dvh lg:overflow-hidden">
        <MobileHeader />
        <main className="flex-1 pb-20 lg:overflow-y-auto lg:pb-0">
          <div className="mx-auto w-full max-w-3xl px-4 py-6 lg:px-10 lg:py-10">
            <Outlet />
          </div>
        </main>
      </div>
      <BottomNavigation />
    </div>
  )
}
