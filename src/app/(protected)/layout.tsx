import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/sidebar";
import { Toaster } from 'react-hot-toast';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background font-sans">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 min-w-0 overflow-hidden border-l border-gray-100">
          <Toaster position="bottom-right" />
          <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white px-4 sticky top-0 z-30">
            <SidebarTrigger />
            <div className="h-4 w-px bg-border mx-2" />
            <h1 className="font-semibold truncate text-gray-800">
              СК БК Гълъбово
            </h1>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto bg-slate-50">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
