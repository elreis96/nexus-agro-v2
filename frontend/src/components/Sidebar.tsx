import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  AlertTriangle,
  ClipboardList,
  LogOut,
  Menu,
  X,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
  requiredRole?: "admin" | "user";
}

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(true);

  // Listen to global toggle events from header button
  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    window.addEventListener('sidebar:toggle', handleToggle);
    return () => window.removeEventListener('sidebar:toggle', handleToggle);
  }, []);

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      label: "Analytics",
      path: "/analytics",
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      label: "Gestão de Risco",
      path: "/risk-terminal",
      icon: <AlertTriangle className="w-5 h-5" />,
    },
    {
      label: "Logs de Auditoria",
      path: "/admin",
      icon: <ClipboardList className="w-5 h-5" />,
      requiredRole: "admin",
    },
  ];

  const filteredItems = navItems.filter(
    (item) => !item.requiredRole || (item.requiredRole === "admin" && isAdmin)
  );

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const toggleSidebar = () => setIsOpen((prev) => !prev);

  const handleNavigate = (path: string) => {
    navigate(path);
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Mobile Toggle Button - sempre visível no mobile */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed bottom-6 right-6 z-50 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
        title={isOpen ? "Fechar menu" : "Abrir menu"}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar - sempre visível no desktop, colapsável no mobile */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-card/70 backdrop-blur-md border-r border-border/40 shadow-[12px_0_32px_rgba(0,0,0,0.25)] z-40 transition-all duration-300",
          // Mobile: esconde completamente quando fechado
          "md:translate-x-0",
          isOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0 md:w-16"
        )}
      >
        <div className="relative flex flex-col h-full space-y-6">
          {/* Logo/Brand + Toggle */}
          <div className={cn(
            "flex items-center border-b border-border/30 transition-all",
            isOpen ? "justify-between p-4 md:p-6" : "justify-center p-4"
          )}>
            {isOpen ? (
              <>
                <div className="space-y-1">
                  <h1 className="text-xl font-bold text-gradient-green">AgroData</h1>
                  <p className="text-xs text-muted-foreground">Intelligence Platform</p>
                </div>
                <button
                  onClick={toggleSidebar}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                  title="Recolher menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                title="Expandir menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className={cn("flex-1 space-y-2", isOpen ? "px-4 md:px-6" : "px-2")}>
            {filteredItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={cn(
                  "w-full flex items-center rounded-lg transition-all duration-200",
                  isOpen ? "gap-3 px-4 py-3" : "justify-center p-3",
                  isActive(item.path)
                    ? "bg-primary/20 text-primary font-medium border border-primary/30"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
                title={!isOpen ? item.label : undefined}
              >
                {item.icon}
                {isOpen && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div className={cn(
            "border-t border-border/30",
            isOpen ? "space-y-3 p-4 md:p-6" : "space-y-2 p-2"
          )}>
            {isOpen && (
              <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                <p className="text-xs font-semibold text-foreground mb-1">
                  Pipeline Status
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-muted-foreground">
                    Railway: Online
                  </span>
                </div>
              </div>
            )}

            <Button
              onClick={handleSignOut}
              variant="outline"
              className={cn(
                "w-full transition-all",
                isOpen ? "justify-center gap-2" : "justify-center p-3"
              )}
              title={!isOpen ? "Sair" : undefined}
            >
              <LogOut className="w-4 h-4" />
              {isOpen && "Sair"}
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Spacer for Desktop */}
      <div className={cn("hidden md:block transition-all duration-300", isOpen ? "w-64" : "w-16")} />
    </>
  );
}
