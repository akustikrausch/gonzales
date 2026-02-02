import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { useIsMobile, useIsTablet } from "../../hooks/useMediaQuery";

export function AppShell() {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  return (
    <div className="flex min-h-screen" style={{ background: "var(--g-bg)" }}>
      {!isMobile && <Sidebar collapsed={isTablet} />}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main
          className="flex-1 overflow-auto"
          style={{
            padding: isMobile ? "var(--g-space-4)" : "var(--g-space-6)",
            paddingBottom: isMobile ? "calc(var(--g-mobile-nav-height) + var(--g-space-4))" : "var(--g-space-6)",
          }}
        >
          <Outlet />
        </main>
      </div>
      {isMobile && <MobileNav />}
    </div>
  );
}
