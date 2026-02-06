import { lazy, Suspense, useCallback } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { SpeedTestProvider } from "./context/SpeedTestContext";
import { ToastProvider } from "./context/ToastContext";
import { ToastContainer } from "./components/ui/Toast";
import { OnboardingWizard } from "./components/onboarding";
import { Spinner } from "./components/ui/Spinner";
import { useVersionCheck } from "./hooks/useVersionCheck";
import { useOnboarding } from "./hooks/useOnboarding";

/**
 * Checks frontend/backend version match and auto-reloads on mismatch.
 * This ensures users always get fresh assets after an update.
 */
function VersionGuard({ children }: { children: React.ReactNode }) {
  useVersionCheck();
  return <>{children}</>;
}

/**
 * Detect HA Ingress path prefix for router basename.
 * Without this, routes don't match when served under /api/hassio_ingress/<token>/
 */
function getBasename(): string {
  const path = window.location.pathname;
  const match = path.match(/^(\/api\/hassio_ingress\/[^/]+)/);
  return match ? match[1] : "";
}

const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage }))
);
const HistoryPage = lazy(() =>
  import("./pages/HistoryPage").then((m) => ({ default: m.HistoryPage }))
);
const StatisticsPage = lazy(() =>
  import("./pages/StatisticsPage").then((m) => ({ default: m.StatisticsPage }))
);
const ExportPage = lazy(() =>
  import("./pages/ExportPage").then((m) => ({ default: m.ExportPage }))
);
const SettingsPage = lazy(() =>
  import("./pages/SettingsPage").then((m) => ({ default: m.SettingsPage }))
);
const QosPage = lazy(() =>
  import("./pages/QosPage").then((m) => ({ default: m.QosPage }))
);
const TopologyPage = lazy(() =>
  import("./pages/TopologyPage").then((m) => ({ default: m.TopologyPage }))
);
const DocsPage = lazy(() =>
  import("./pages/DocsPage").then((m) => ({ default: m.DocsPage }))
);
const RootCausePage = lazy(() =>
  import("./pages/RootCausePage").then((m) => ({ default: m.RootCausePage }))
);

function PageLoader() {
  return (
    <div className="flex items-center justify-center" style={{ minHeight: "50vh" }}>
      <Spinner size={32} />
    </div>
  );
}

function AppContent() {
  const { showOnboarding, completeOnboarding, skipOnboarding } = useOnboarding();

  const handleOnboardingComplete = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  const handleOnboardingSkip = useCallback(() => {
    skipOnboarding();
  }, [skipOnboarding]);

  return (
    <>
      <ToastContainer />
      {showOnboarding && (
        <OnboardingWizard
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="statistics" element={<StatisticsPage />} />
            <Route path="qos" element={<QosPage />} />
            <Route path="topology" element={<TopologyPage />} />
            <Route path="root-cause" element={<RootCausePage />} />
            <Route path="export" element={<ExportPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="docs" element={<DocsPage />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}

export default function App() {
  return (
    <VersionGuard>
      <BrowserRouter basename={getBasename()}>
        <ToastProvider>
          <SpeedTestProvider>
            <AppContent />
          </SpeedTestProvider>
        </ToastProvider>
      </BrowserRouter>
    </VersionGuard>
  );
}
