import { memo } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Logo } from "../ui/Logo";
import { useStatus } from "../../hooks/useApi";
import {
  getNavItemsByGroup,
  type NavItem,
} from "../../config/navigation";

interface SidebarProps {
  collapsed?: boolean;
}

const NavGroup = memo(function NavGroup({
  items,
  collapsed,
  groupLabel,
}: {
  items: NavItem[];
  collapsed: boolean;
  groupLabel?: string;
}) {
  const { t } = useTranslation();
  return (
    <ul role="list" aria-label={groupLabel} className="list-none p-0 m-0">
      {items.map((item) => {
        const label = t(item.labelKey);
        return (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.to === "/"}
              title={collapsed ? label : undefined}
              aria-label={collapsed ? label : undefined}
              className={({ isActive }) =>
                `glass-nav-item mb-0.5 ${
                  collapsed ? "justify-center !px-2.5 !gap-0" : ""
                } ${isActive ? "glass-nav-item-active" : ""}`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className="glass-nav-icon w-4 h-4 shrink-0" aria-hidden="true" />
                  {!collapsed && <span>{label}</span>}
                  {isActive && <span className="sr-only">{t("nav.currentPage")}</span>}
                </>
              )}
            </NavLink>
          </li>
        );
      })}
    </ul>
  );
});

function GroupDivider({ label }: { label: string }) {
  return (
    <div
      className="mt-4 mb-2 px-3"
      style={{ color: "var(--g-text-tertiary)" }}
    >
      <span className="text-[10px] uppercase tracking-wider font-medium">
        {label}
      </span>
    </div>
  );
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const { t } = useTranslation();
  const { data: status } = useStatus();

  const mainItems = getNavItemsByGroup("main");
  const toolsItems = getNavItemsByGroup("tools");
  const systemItems = getNavItemsByGroup("system");

  return (
    <aside
      className="glass-sidebar min-h-screen flex flex-col transition-all"
      aria-label="Sidebar"
      style={{
        width: collapsed
          ? "var(--g-sidebar-collapsed)"
          : "var(--g-sidebar-width)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 border-b"
        style={{
          padding: collapsed ? "var(--g-space-4)" : "var(--g-space-5)",
          borderColor: "var(--g-border)",
          justifyContent: collapsed ? "center" : "flex-start",
        }}
      >
        <Logo size={28} aria-hidden="true" />
        {!collapsed && (
          <div>
            <h1
              className="text-lg font-bold tracking-tight"
              style={{ color: "var(--g-text)" }}
            >
              Gonzales
            </h1>
            <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>
              {t("sidebar.speedMonitor")}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 overflow-y-auto"
        style={{ padding: "var(--g-space-3)" }}
        aria-label={t("nav.primaryNavigation")}
      >
        {/* Main group */}
        <NavGroup items={mainItems} collapsed={collapsed} groupLabel={t("nav.mainNavigation")} />

        {/* Tools group */}
        {!collapsed && <GroupDivider label={t("nav.groupTools")} />}
        {collapsed && <div className="my-2" aria-hidden="true" />}
        <NavGroup items={toolsItems} collapsed={collapsed} groupLabel={t("nav.groupTools")} />

        {/* System group */}
        {!collapsed && <GroupDivider label={t("nav.groupSystem")} />}
        {collapsed && <div className="my-2" aria-hidden="true" />}
        <NavGroup items={systemItems} collapsed={collapsed} groupLabel={t("nav.systemSettings")} />
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div
          className="border-t"
          style={{
            padding: "var(--g-space-4)",
            borderColor: "var(--g-border)",
          }}
        >
          <a
            href="https://github.com/akustikrausch/gonzales/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] hover:underline transition-colors"
            style={{ color: "var(--g-text-secondary)" }}
            title={t("sidebar.viewReleases")}
          >
            Gonzales v{status?.version ?? "..."}
          </a>
        </div>
      )}
    </aside>
  );
}
