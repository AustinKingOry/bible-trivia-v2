
import { Sidebar } from '@/components/layout/Sidebar'
import { Toast } from '@/components/shared/Toast'

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0A1628]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Toast />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}