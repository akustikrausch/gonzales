import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Zap,
  ClipboardList,
  BarChart3,
  Menu,
  X,
  Activity,
  Network,
  Download,
  Settings,
  BookOpen,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const mainNavItems: NavItem[] = [
  { to: "/", label: "Dashboard", icon: Zap },
  { to: "/history", label: "History", icon: ClipboardList },
  { to: "/statistics", label: "Stats", icon: BarChart3 },
];

const moreNavItems: NavItem[] = [
  { to: "/qos", label: "QoS Tests", icon: Activity },
  { to: "/topology", label: "Network", icon: Network },
  { to: "/export", label: "Export", icon: Download },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/docs", label: "Documentation", icon: BookOpen },
];

function BottomSheet({
  isOpen,
  onClose,
  items,
}: {
  isOpen: boolean;
  onClose: () => void;
  items: NavItem[];
}) {
  const location = useLocation();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        style={{ backdropFilter: "blur(2px)" }}
      />
      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 glass-card rounded-t-2xl"
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 16px)",
          animation: "slideUp 0.2s ease-out",
        }}
      >
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
        `}</style>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div
            className="w-10 h-1 rounded-full"
            style={{ backgroundColor: "var(--g-border)" }}
          />
        </div>
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 pb-3 border-b"
          style={{ borderColor: "var(--g-border)" }}
        >
          <span className="font-semibold" style={{ color: "var(--g-text)" }}>
            More
          </span>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: "var(--g-text-secondary)" }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Items */}
        <nav className="p-2">
          {items.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className="flex items-center gap-4 px-4 py-3 rounded-xl transition-colors"
                style={{
                  backgroundColor: isActive ? "var(--g-accent-dim)" : "transparent",
                  color: isActive ? "var(--g-accent)" : "var(--g-text)",
                }}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </>
  );
}

export function MobileNav() {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const location = useLocation();

  // Check if current path is in "more" items
  const isMoreActive = moreNavItems.some((item) => location.pathname === item.to);

  return (
    <>
      <BottomSheet
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        items={moreNavItems}
      />
      <nav
        className="glass-header fixed bottom-0 left-0 right-0 flex items-center justify-around"
        style={{
          height: "var(--g-mobile-nav-height)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          zIndex: 30,
        }}
      >
        {mainNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className="flex flex-col items-center gap-1 py-2 px-4"
            style={({ isActive }) => ({
              color: isActive ? "var(--g-blue)" : "var(--g-text-secondary)",
            })}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
        {/* More button */}
        <button
          onClick={() => setIsMoreOpen(true)}
          className="flex flex-col items-center gap-1 py-2 px-4"
          style={{
            color: isMoreActive ? "var(--g-blue)" : "var(--g-text-secondary)",
          }}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>
    </>
  );
}
