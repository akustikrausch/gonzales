import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { PageTransition } from "../common/PageTransition";
import { QuickActionsFAB } from "../ui/FAB";
import { useIsMobile, useIsTablet } from "../../hooks/useMediaQuery";
import { useSpeedTest } from "../../context/SpeedTestContext";

export function AppShell() {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const navigate = useNavigate();
  const { runTest } = useSpeedTest();

  // Handle FAB custom events
  useEffect(() => {
    const handleRunTest = () => runTest();
    const handleExport = () => navigate("/export");
    const handleSettings = () => navigate("/settings");

    document.addEventListener("gonzales:run-test", handleRunTest);
    document.addEventListener("gonzales:export", handleExport);
    document.addEventListener("gonzales:settings", handleSettings);

    return () => {
      document.removeEventListener("gonzales:run-test", handleRunTest);
      document.removeEventListener("gonzales:export", handleExport);
      document.removeEventListener("gonzales:settings", handleSettings);
    };
  }, [runTest, navigate]);

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
      <QuickActionsFAB />
    </div>
  );
}
