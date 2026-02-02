import { useState } from "react";
import { FileSpreadsheet, FileText } from "lucide-react";
import { api } from "../../api/client";
import { Card } from "../common/Card";
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
      <Card>
        <h3 className="text-sm font-semibold text-[#1D1D1F] mb-4">Date Range</h3>
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
        <p className="text-xs text-[#86868B] mt-2">
          Leave empty to export all data.
        </p>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-sm font-semibold text-[#1D1D1F] mb-2 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#86868B]" />
            CSV Export
          </h3>
          <p className="text-xs text-[#86868B] mb-4">
            Download raw measurement data as a CSV spreadsheet.
          </p>
          <a
            href={api.getExportCsvUrl(params)}
            download
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#007AFF] text-white text-sm font-medium
                       rounded-lg hover:bg-[#0066D6] transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Download CSV
          </a>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-[#1D1D1F] mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#86868B]" />
            PDF Report
          </h3>
          <p className="text-xs text-[#86868B] mb-4">
            Generate a formatted report with statistics and measurement table.
          </p>
          <a
            href={api.getExportPdfUrl(params)}
            download
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#34C759] text-white text-sm font-medium
                       rounded-lg hover:bg-[#2DB84D] transition-colors"
          >
            <FileText className="w-4 h-4" />
            Download PDF
          </a>
        </Card>
      </div>
    </div>
  );
}
