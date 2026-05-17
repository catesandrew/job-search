import { Sidebar } from '@/components/sidebar'
import { SessionProvider } from '@/components/session-provider'
import { ChatPanel } from '@/components/chat/chat-panel'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
      <ChatPanel />
    </SessionProvider>
  )
}
