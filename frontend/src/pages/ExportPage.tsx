import { Download } from "lucide-react";
import { ExportPanel } from "../components/export/ExportPanel";

export function ExportPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[#1D1D1F] flex items-center gap-2">
        <Download className="w-5 h-5" />
        Export
      </h2>
      <ExportPanel />
    </div>
  );
}
