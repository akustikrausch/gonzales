import {
  Zap,
  ClipboardList,
  BarChart3,
  Activity,
  Network,
  Download,
  Settings,
  BookOpen,
  Search,
  type LucideIcon,
} from "lucide-react";

export type NavGroup = "main" | "tools" | "system";

export interface NavItem {
  to: string;
  labelKey: string; // i18n key for label
  shortLabelKey?: string; // i18n key for mobile nav
  icon: LucideIcon;
  group: NavGroup;
}

export const navigationItems: NavItem[] = [
  // Main navigation
  { to: "/", labelKey: "nav.dashboard", shortLabelKey: "nav.dashboard", icon: Zap, group: "main" },
  { to: "/history", labelKey: "nav.history", shortLabelKey: "nav.history", icon: ClipboardList, group: "main" },
  { to: "/statistics", labelKey: "nav.statistics", shortLabelKey: "nav.shortStats", icon: BarChart3, group: "main" },

  // Tools
  { to: "/qos", labelKey: "nav.qos", shortLabelKey: "nav.shortQos", icon: Activity, group: "tools" },
  { to: "/topology", labelKey: "nav.network", shortLabelKey: "nav.shortNetwork", icon: Network, group: "tools" },
  { to: "/root-cause", labelKey: "nav.rootCause", shortLabelKey: "nav.shortDiagnosis", icon: Search, group: "tools" },
  { to: "/export", labelKey: "nav.export", shortLabelKey: "nav.export", icon: Download, group: "tools" },

  // System
  { to: "/settings", labelKey: "nav.settings", shortLabelKey: "nav.settings", icon: Settings, group: "system" },
  { to: "/docs", labelKey: "nav.docs", shortLabelKey: "nav.shortDocs", icon: BookOpen, group: "system" },
];

export function getNavItemsByGroup(group: NavGroup): NavItem[] {
  return navigationItems.filter((item) => item.group === group);
}

export function getMainNavItems(): NavItem[] {
  return getNavItemsByGroup("main");
}

export function getMoreNavItems(): NavItem[] {
  return navigationItems.filter((item) => item.group !== "main");
}

export const navGroupKeys: { key: NavGroup; labelKey: string }[] = [
  { key: "main", labelKey: "nav.groupMain" },
  { key: "tools", labelKey: "nav.groupTools" },
  { key: "system", labelKey: "nav.groupSystem" },
];
