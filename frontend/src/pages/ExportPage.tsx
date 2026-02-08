import { useTranslation } from "react-i18next";
import { Download } from "lucide-react";
import { ExportPanel } from "../components/export/ExportPanel";

export function ExportPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <h2
        className="text-xl font-bold flex items-center gap-2 g-animate-in"
        style={{ color: "var(--g-text)" }}
      >
        <Download className="w-5 h-5" />
        {t("export.title")}
      </h2>
      <div className="g-animate-in g-stagger-1">
        <ExportPanel />
      </div>
    </div>
  );
}
