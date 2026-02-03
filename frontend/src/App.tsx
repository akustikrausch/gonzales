import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { SpeedTestProvider } from "./context/SpeedTestContext";
import { Spinner } from "./components/ui/Spinner";

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

function PageLoader() {
  return (
    <div className="flex items-center justify-center" style={{ minHeight: "50vh" }}>
      <Spinner size={32} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={getBasename()}>
      <SpeedTestProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<DashboardPage />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="statistics" element={<StatisticsPage />} />
              <Route path="export" element={<ExportPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </Suspense>
      </SpeedTestProvider>
    </BrowserRouter>
  );
}
