import { ReactNode, useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [compactSidebar, setCompactSidebar] = useState(false);

  useEffect(() => {
    try {
      const cached = localStorage.getItem("jamia.settings");
      if (cached && cached !== "undefined") {
        const parsed = JSON.parse(cached);
        const next = Boolean(parsed?.appearance?.compactSidebar);
        setCompactSidebar(next);
      }
    } catch {
      // ignore
    }

    const handler = (e: Event) => {
      const ce = e as CustomEvent;
      const next = Boolean(ce?.detail?.compactSidebar);
      setCompactSidebar(next);
    };

    window.addEventListener("jamia:appearance", handler as EventListener);
    return () => {
      window.removeEventListener("jamia:appearance", handler as EventListener);
    };
  }, []);

  const persistCompactSidebar = (next: boolean) => {
    try {
      const cached = localStorage.getItem("jamia.settings");
      const parsed = (cached && cached !== "undefined") ? JSON.parse(cached) : {};
      const notifications = parsed?.notifications;
      const appearance = { ...(parsed?.appearance ?? {}), compactSidebar: next };
      localStorage.setItem("jamia.settings", JSON.stringify({ notifications, appearance }));
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        collapsed={compactSidebar}
        onCollapsedChange={(next) => {
          setCompactSidebar(next);
          persistCompactSidebar(next);
          try {
            window.dispatchEvent(
              new CustomEvent("jamia:appearance", { detail: { compactSidebar: next } })
            );
          } catch {
            // ignore
          }
        }}
      />

      {/* Main content area */}
      <div className={cn(compactSidebar ? "lg:mr-20" : "lg:mr-64", "transition-all duration-300")}>
        {/* Header */}
        <Header title={title} />

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
