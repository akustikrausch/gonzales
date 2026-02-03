import { NavLink } from "react-router-dom";
import { Zap, ClipboardList, BarChart3, Download, Settings, Activity, Network, type LucideIcon } from "lucide-react";

const navItems: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/", label: "Dashboard", icon: Zap },
  { to: "/history", label: "History", icon: ClipboardList },
  { to: "/statistics", label: "Stats", icon: BarChart3 },
  { to: "/qos", label: "QoS", icon: Activity },
  { to: "/topology", label: "Network", icon: Network },
  { to: "/export", label: "Export", icon: Download },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  return (
    <nav
      className="glass-header fixed bottom-0 left-0 right-0 flex items-center justify-around"
      style={{
        height: "var(--g-mobile-nav-height)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        zIndex: 50,
      }}
    >
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className="flex flex-col items-center gap-1 py-1 px-2"
          style={({ isActive }) => ({
            color: isActive ? "var(--g-blue)" : "var(--g-text-secondary)",
          })}
        >
          <item.icon className="w-5 h-5" />
          <span className="text-[10px] font-medium">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
