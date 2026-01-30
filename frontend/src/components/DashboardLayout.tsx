import { Sidebar } from "@/components/Sidebar";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      {/* Main Content */}
      <main className={cn("flex-1 overflow-auto", className)}>
        {children}
      </main>
    </div>
  );
}
