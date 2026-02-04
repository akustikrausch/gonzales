import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { PageTransition } from "../common/PageTransition";
import { useIsMobile, useIsTablet } from "../../hooks/useMediaQuery";

export function AppShell() {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  return (
    <div className="flex min-h-screen" style={{ background: "var(--g-bg)" }}>
      {/* Skip to main content link for keyboard users */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      {/* Live region for screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-live-polite"
        id="sr-announcer"
      />

      {!isMobile && <Sidebar collapsed={isTablet} />}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main
          id="main-content"
          tabIndex={-1}
          role="main"
          aria-label="Main content"
          className="flex-1 overflow-auto focus:outline-none"
          style={{
            padding: isMobile ? "var(--g-space-4)" : "var(--g-space-6)",
            paddingBottom: isMobile ? "calc(var(--g-mobile-nav-height) + var(--g-space-4))" : "var(--g-space-6)",
          }}
        >
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
      {isMobile && <MobileNav />}
    </div>
  );
}
