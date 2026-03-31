import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/sidebar"

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-gray-50">
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col min-w-0">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white sticky top-0 z-40">
            <SidebarTrigger className="-ml-1" />
            <div className="h-4 w-[1px] bg-gray-200 mx-2 hidden sm:block" />
            <h1 className="font-semibold text-gray-800 truncate">Табло за управление</h1>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
