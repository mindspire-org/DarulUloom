import { useMemo, useState } from "react";
import {
  LayoutDashboard,
  Ticket,
  CheckCircle,
  UserCheck,
  Users,
  FileText,
  Settings,
  Menu,
  X,
  GraduationCap,
  LogOut,
  UserCog,
  ShieldCheck,
  Home,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarProps {
  className?: string;
  collapsed?: boolean;
  onCollapsedChange?: (next: boolean) => void;
}

export function Sidebar({ className, collapsed, onCollapsedChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, logout } = useAuth();

  const effectiveCollapsed = useMemo(() => {
    return typeof collapsed === "boolean" ? collapsed : isCollapsed;
  }, [collapsed, isCollapsed]);

  const logoSrc = `${import.meta.env.BASE_URL}brand-logo.jpg`;

  // Define navigation items based on role
  const getNavItems = () => {
    if (!user) return [];

    if (user.role === "admin") {
      return [
        { title: "ڈیش بورڈ", url: "/dashboard", icon: LayoutDashboard },
        { title: "طلباء", url: "/students", icon: Users },
        { title: "درجات", url: "/grades", icon: GraduationCap },
        { title: "ہاسٹل", url: "/hostel", icon: Home },
        { title: "وفاقی تصدیق", url: "/counter2-verification", icon: ShieldCheck },
        { title: "رپورٹس", url: "/reports", icon: FileText },
        { title: "صارفین", url: "/users", icon: UserCog },
        { title: "سیٹنگز", url: "/settings", icon: Settings },
      ];
    } else if (user.role === "counter1") {
      return [
        { title: "ٹوکن کاؤنٹر", url: "/token-counter", icon: Ticket },
        { title: "ٹوکن مینجمنٹ", url: "/token-management", icon: Settings },
      ];
    } else if (user.role === "counter2") {
      return [
        { title: "تصدیق", url: "/verification", icon: CheckCircle },
        { title: "وفاقی تصدیق", url: "/counter2-verification", icon: ShieldCheck },
        { title: "کاؤنٹر 2 طلباء", url: "/counter2-students", icon: Users },
      ];
    }

    return [];
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 right-4 z-50 lg:hidden bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed right-0 top-0 z-40 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 shadow-xl flex flex-col",
          effectiveCollapsed ? "w-20" : "w-64",
          isMobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0",
          className
        )}
      >
        {/* Logo & Brand */}
        <div className="flex items-center gap-3 p-6 border-b border-sidebar-border">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white overflow-hidden shadow-sm p-1 border border-sidebar-border">
            <img src={logoSrc} alt="Jamia" className="h-full w-full object-contain mix-blend-multiply" />
          </div>
          {!effectiveCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight">جامعہ</span>
              <span className="text-xs text-sidebar-foreground/70">داخلہ و انتظامی نظام</span>
            </div>
          )}
        </div>

        {/* User Info */}
        {user && !effectiveCollapsed && (
          <div className="p-4 border-b border-sidebar-border bg-sidebar-accent/50">
            <div className="text-sm">
              <p className="font-semibold">{user.name}</p>
              <p className="text-xs text-sidebar-foreground/70">
                {user.role === "admin" ? "منتظم" : user.role === "counter1" ? "کاؤنٹر 1" : "کاؤنٹر 2"}
              </p>
            </div>
          </div>
        )}

        {/* Collapse button (desktop only) */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -left-3 top-20 hidden lg:flex h-6 w-6 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
          onClick={() => {
            const next = !effectiveCollapsed;
            if (typeof collapsed === "boolean") {
              onCollapsedChange?.(next);
              return;
            }
            setIsCollapsed(next);
          }}
        >
          <Menu className="h-3 w-3" />
        </Button>

        {/* Navigation */}
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200",
                effectiveCollapsed && "justify-center px-3"
              )}
              activeClassName="bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground shadow-lg"
              onClick={() => setIsMobileOpen(false)}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!effectiveCollapsed && <span className="font-medium">{item.title}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-sidebar-foreground/80 hover:bg-destructive/10 hover:text-destructive",
              effectiveCollapsed && "justify-center px-3"
            )}
            onClick={logout}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!effectiveCollapsed && <span className="mr-3">لاگ آؤٹ</span>}
          </Button>
        </div>

        {/* Footer */}
        {!effectiveCollapsed && (
          <div className="p-4 border-t border-sidebar-border">
            <div className="text-center text-xs text-sidebar-foreground/50">
              نسخہ ۱.۰.۰
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
