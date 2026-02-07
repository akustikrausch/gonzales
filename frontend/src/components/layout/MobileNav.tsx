import { useState, useEffect, useRef, useCallback } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { getMainNavItems, getMoreNavItems, type NavItem } from "../../config/navigation";
import { useStatus } from "../../hooks/useApi";

const mainNavItems = getMainNavItems();
const moreNavItems = getMoreNavItems();

function BottomSheet({
  isOpen,
  onClose,
  items,
  version,
}: {
  isOpen: boolean;
  onClose: () => void;
  items: NavItem[];
  version?: string;
}) {
  const location = useLocation();
  const [isClosing, setIsClosing] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  // Handle close with animation
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 150); // Match animation duration
  }, [onClose]);

  // Focus trap and keyboard handling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
        return;
      }

      // Focus trap
      if (e.key === "Tab" && sheetRef.current) {
        const focusableElements = sheetRef.current.querySelectorAll<HTMLElement>(
          'button, [href], [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // Focus first element when opened
    setTimeout(() => firstFocusableRef.current?.focus(), 100);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen && !isClosing) return null;

  return (
    <>
      {/* Backdrop with fade animation */}
      <div
        className={`fixed inset-0 z-40 ${isClosing ? "g-animate-backdrop-out" : "g-animate-backdrop-in"}`}
        onClick={handleClose}
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
        }}
        aria-hidden="true"
      />
      {/* Sheet with slide animation */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="More navigation options"
        className={`fixed bottom-0 left-0 right-0 z-50 glass-card rounded-t-2xl ${
          isClosing ? "g-animate-slide-down" : "g-animate-slide-up"
        }`}
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 16px)",
        }}
      >
        {/* Handle indicator */}
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
            ref={firstFocusableRef}
            onClick={handleClose}
            className="flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--g-surface)]"
            style={{
              color: "var(--g-text-secondary)",
              width: "44px",
              height: "44px",
            }}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Items */}
        <nav className="p-2" aria-label="Additional navigation">
          {items.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={handleClose}
                className="flex items-center gap-4 px-4 py-3 rounded-xl transition-colors min-h-[48px]"
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
        {version && (
          <div
            className="px-4 py-2 border-t"
            style={{ borderColor: "var(--g-border)" }}
          >
            <a
              href="https://github.com/akustikrausch/gonzales/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] hover:underline"
              style={{ color: "var(--g-text-tertiary)" }}
            >
              Gonzales v{version}
            </a>
          </div>
        )}
      </div>
    </>
  );
}

export function MobileNav() {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const location = useLocation();
  const { data: status } = useStatus();

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
        version={status?.version}
      />
      {/* Fixed nav container with proper safe-area handling */}
      <nav
        className="fixed bottom-0 left-0 right-0 glass-header"
        style={{ zIndex: 30 }}
        aria-label="Main navigation"
      >
        {/* Navigation items container - fixed height with proper touch targets */}
        <div
          className="flex items-center justify-around"
          style={{ height: "var(--g-mobile-nav-height)" }}
        >
          {mainNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className="flex flex-col items-center justify-center transition-colors"
              style={({ isActive }) => ({
                color: isActive ? "var(--g-blue)" : "var(--g-text-secondary)",
                minWidth: "var(--g-space-16, 64px)",
                height: "var(--g-mobile-nav-height)",
                padding: "0 var(--g-space-2)",
              })}
            >
              {({ isActive }) => (
                <>
                  <item.icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                  <span className="text-xs font-medium mt-1">
                    {item.shortLabel || item.label}
                  </span>
                  {isActive && <span className="sr-only">(current page)</span>}
                </>
              )}
            </NavLink>
          ))}
          {/* More button with proper touch target */}
          <button
            onClick={() => setIsMoreOpen(true)}
            className="flex flex-col items-center justify-center transition-colors"
            style={{
              color: isMoreActive ? "var(--g-blue)" : "var(--g-text-secondary)",
              minWidth: "var(--g-space-16, 64px)",
              height: "var(--g-mobile-nav-height)",
              padding: "0 var(--g-space-2)",
            }}
            aria-label="More options"
            aria-expanded={isMoreOpen}
            aria-haspopup="dialog"
          >
            <Menu className="w-5 h-5 shrink-0" />
            <span className="text-xs font-medium mt-1">More</span>
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
