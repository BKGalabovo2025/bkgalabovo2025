import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Toaster } from 'react-hot-toast';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <Toaster position="bottom-right" />
      
      {/* Background decorative elements - moved outside flex flow */}
      <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-blue-100/30 dark:bg-blue-900/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none z-0" />
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-zinc-200/20 dark:bg-zinc-800/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none z-0" />
      
      <AppSidebar />
      
      <SidebarInset className="relative z-10 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto p-6 md:p-8 lg:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
