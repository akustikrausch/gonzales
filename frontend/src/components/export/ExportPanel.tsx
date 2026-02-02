import { useState } from "react";
import { FileSpreadsheet, FileText } from "lucide-react";
import { api } from "../../api/client";
import { GlassCard } from "../ui/GlassCard";
import { GlassButton } from "../ui/GlassButton";
import { DateRangeFilter } from "../history/DateRangeFilter";

export function ExportPanel() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const params = {
    start_date: startDate ? new Date(startDate).toISOString() : undefined,
    end_date: endDate ? new Date(endDate).toISOString() : undefined,
  };

  return (
    <div className="space-y-6">
      <GlassCard>
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--g-text)" }}>
          Date Range
        </h3>
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
        <p className="text-xs mt-2" style={{ color: "var(--g-text-secondary)" }}>
          Leave empty to export all data.
        </p>
      </GlassCard>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <GlassCard hover>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: "var(--g-text)" }}>
            <FileSpreadsheet className="w-4 h-4" style={{ color: "var(--g-text-secondary)" }} />
            CSV Export
          </h3>
          <p className="text-xs mb-4" style={{ color: "var(--g-text-secondary)" }}>
            Download raw measurement data as a CSV spreadsheet.
          </p>
          <a href={api.getExportCsvUrl(params)} download>
            <GlassButton variant="primary">
              <FileSpreadsheet className="w-4 h-4" />
              Download CSV
            </GlassButton>
          </a>
        </GlassCard>

        <GlassCard hover>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: "var(--g-text)" }}>
            <FileText className="w-4 h-4" style={{ color: "var(--g-text-secondary)" }} />
            PDF Report
          </h3>
          <p className="text-xs mb-4" style={{ color: "var(--g-text-secondary)" }}>
            Generate a formatted report with statistics and measurement table.
          </p>
          <a href={api.getExportPdfUrl(params)} download>
            <GlassButton variant="primary" className="!bg-[var(--g-green)] hover:!bg-[#2DB84D]">
              <FileText className="w-4 h-4" />
              Download PDF
            </GlassButton>
          </a>
        </GlassCard>
      </div>
    </div>
  );
}
