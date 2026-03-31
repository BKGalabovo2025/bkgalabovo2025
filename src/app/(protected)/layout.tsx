import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/sidebar"

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 min-w-0 bg-gray-50">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white px-4 sticky top-0 z-10">
            <SidebarTrigger />
            <div className="h-4 w-px bg-gray-200 mx-2" />
            <h1 className="font-semibold text-gray-800">Табло за управление</h1>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-x-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
