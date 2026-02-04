import { NavLink } from "react-router-dom";
import { Logo } from "../ui/Logo";
import { useStatus } from "../../hooks/useApi";
import {
  getNavItemsByGroup,
  type NavItem,
} from "../../config/navigation";

interface SidebarProps {
  collapsed?: boolean;
}

function NavGroup({
  items,
  collapsed,
}: {
  items: NavItem[];
  collapsed: boolean;
}) {
  return (
    <>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          title={collapsed ? item.label : undefined}
          className={({ isActive }) =>
            `glass-nav-item mb-0.5 ${
              collapsed ? "justify-center !px-2.5 !gap-0" : ""
            } ${isActive ? "glass-nav-item-active" : ""}`
          }
        >
          <item.icon className="glass-nav-icon w-4 h-4 shrink-0" />
          {!collapsed && <span>{item.label}</span>}
        </NavLink>
      ))}
    </>
  );
}

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
  const { data: status } = useStatus();

  const mainItems = getNavItemsByGroup("main");
  const toolsItems = getNavItemsByGroup("tools");
  const systemItems = getNavItemsByGroup("system");

  return (
    <aside
      className="glass-sidebar min-h-screen flex flex-col transition-all"
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
        <Logo size={28} />
        {!collapsed && (
          <div>
            <h1
              className="text-lg font-bold tracking-tight"
              style={{ color: "var(--g-text)" }}
            >
              Gonzales
            </h1>
            <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>
              Speed Monitor
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto" style={{ padding: "var(--g-space-3)" }}>
        {/* Main group - no label */}
        <NavGroup items={mainItems} collapsed={collapsed} />

        {/* Tools group */}
        {!collapsed && <GroupDivider label="Tools" />}
        {collapsed && <div className="my-2" />}
        <NavGroup items={toolsItems} collapsed={collapsed} />

        {/* System group */}
        {!collapsed && <GroupDivider label="System" />}
        {collapsed && <div className="my-2" />}
        <NavGroup items={systemItems} collapsed={collapsed} />
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
          <p
            className="text-[10px] cursor-help"
            style={{ color: "var(--g-text-secondary)" }}
            title="Backend version - refresh page if outdated"
          >
            Gonzales v{status?.version ?? "..."}
          </p>
        </div>
      )}
    </aside>
  );
}
