import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { getMainNavItems, getMoreNavItems, type NavItem } from "../../config/navigation";

const mainNavItems = getMainNavItems();
const moreNavItems = getMoreNavItems();

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
                  backgroundColor: isActive
                    ? "var(--g-accent-dim)"
                    : "transparent",
                  color: isActive ? "var(--g-accent)" : "var(--g-text)",
                }}
              >
                <item.icon className="w-5 h-5 shrink-0" />
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
  const isMoreActive = moreNavItems.some(
    (item) => location.pathname === item.to
  );

  return (
    <>
      <BottomSheet
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        items={moreNavItems}
      />
      {/* Fixed nav container with proper safe-area handling */}
      <nav
        className="fixed bottom-0 left-0 right-0"
        style={{
          zIndex: 30,
          background: "var(--g-card-bg)",
          borderTop: "1px solid var(--g-card-border)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {/* Navigation items container - fixed height */}
        <div
          className="flex items-center justify-around"
          style={{
            height: "var(--g-mobile-nav-height)",
          }}
        >
          {mainNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className="flex flex-col items-center justify-center h-full"
              style={({ isActive }) => ({
                color: isActive ? "var(--g-blue)" : "var(--g-text-secondary)",
                paddingInline: "var(--g-space-4)",
                minWidth: "64px",
              })}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="text-[10px] font-medium mt-1">
                {item.shortLabel || item.label}
              </span>
            </NavLink>
          ))}
          {/* More button */}
          <button
            onClick={() => setIsMoreOpen(true)}
            className="flex flex-col items-center justify-center h-full"
            style={{
              color: isMoreActive ? "var(--g-blue)" : "var(--g-text-secondary)",
              paddingInline: "var(--g-space-4)",
              minWidth: "64px",
            }}
          >
            <Menu className="w-5 h-5 shrink-0" />
            <span className="text-[10px] font-medium mt-1">More</span>
          </button>
        </div>
        {/* Safe area spacer - only adds padding, not affecting nav item positioning */}
        <div
          style={{
            height: "env(safe-area-inset-bottom, 0px)",
            background: "var(--g-card-bg)",
          }}
        />
      </nav>
    </>
  );
}
