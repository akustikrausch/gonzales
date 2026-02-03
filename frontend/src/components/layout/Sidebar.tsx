import { NavLink } from "react-router-dom";
import { Zap, ClipboardList, BarChart3, Download, Settings, type LucideIcon } from "lucide-react";
import { Logo } from "../ui/Logo";
import { useStatus } from "../../hooks/useApi";

const navItems: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/", label: "Dashboard", icon: Zap },
  { to: "/history", label: "History", icon: ClipboardList },
  { to: "/statistics", label: "Statistics", icon: BarChart3 },
  { to: "/export", label: "Export", icon: Download },
  { to: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  collapsed?: boolean;
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const { data: status } = useStatus();

  return (
    <aside
      className="glass-sidebar min-h-screen flex flex-col transition-all"
      style={{
        width: collapsed ? "var(--g-sidebar-collapsed)" : "var(--g-sidebar-width)",
      }}
    >
      <div
        className="flex items-center gap-3 border-b"
        style={{
          padding: collapsed ? "var(--g-space-4)" : "var(--g-space-5)",
          borderColor: "var(--g-border)",
          justifyContent: collapsed ? "center" : "flex-start",
        }}
      >
        <Logo size={28} />
        {!collapsed && (
          <div>
            <h1
              className="text-lg font-bold tracking-tight"
              style={{ color: "var(--g-text)" }}
            >
              Gonzales
            </h1>
            <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>
              Speed Monitor
            </p>
          </div>
        )}
      </div>
      <nav className="flex-1" style={{ padding: "var(--g-space-3)" }}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `glass-nav-item mb-0.5 ${
                collapsed ? "justify-center !px-2.5 !gap-0" : ""
              } ${isActive ? "glass-nav-item-active" : ""}`
            }
          >
            <item.icon className="glass-nav-icon w-4 h-4" />
            {!collapsed && item.label}
          </NavLink>
        ))}
      </nav>
      {!collapsed && (
        <div
          className="border-t"
          style={{
            padding: "var(--g-space-4)",
            borderColor: "var(--g-border)",
          }}
        >
          <p className="text-[10px]" style={{ color: "var(--g-text-secondary)" }}>
            Gonzales v{status?.version ?? "..."}
          </p>
        </div>
      )}
    </aside>
  );
}
