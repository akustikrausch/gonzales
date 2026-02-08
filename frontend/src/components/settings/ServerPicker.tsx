import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useServers } from "../../hooks/useApi";
import { GlassSelect } from "../ui/GlassSelect";
import { Spinner } from "../ui/Spinner";

interface ServerPickerProps {
  value: number;
  onChange: (serverId: number) => void;
}

export function ServerPicker({ value, onChange }: ServerPickerProps) {
  const { t } = useTranslation();
  const { data, isLoading, error } = useServers();
  const [search, setSearch] = useState("");

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Spinner size={16} />
        <span className="text-sm" style={{ color: "var(--g-text-secondary)" }}>
          {t("settings.loadingServers")}
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm" style={{ color: "var(--g-red)" }}>
        {t("settings.failedToLoadServers")}
      </p>
    );
  }

  const servers = data?.servers || [];
  const filtered = search
    ? servers.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.location.toLowerCase().includes(search.toLowerCase()) ||
          s.country.toLowerCase().includes(search.toLowerCase())
      )
    : servers;

  return (
    <div className="space-y-2">
      <input
        type="text"
        placeholder={t("settings.searchServers")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="glass-input"
      />
      <GlassSelect
        value={String(value)}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        <option value="0">{t("settings.autoNearestServer")}</option>
        {filtered.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} - {s.location}, {s.country}
          </option>
        ))}
      </GlassSelect>
    </div>
  );
}
