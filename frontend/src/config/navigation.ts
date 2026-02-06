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
  label: string;
  shortLabel?: string; // For mobile nav
  icon: LucideIcon;
  group: NavGroup;
}

export const navigationItems: NavItem[] = [
  // Main navigation
  { to: "/", label: "Dashboard", shortLabel: "Dashboard", icon: Zap, group: "main" },
  { to: "/history", label: "History", shortLabel: "History", icon: ClipboardList, group: "main" },
  { to: "/statistics", label: "Statistics", shortLabel: "Stats", icon: BarChart3, group: "main" },

  // Tools
  { to: "/qos", label: "QoS Tests", shortLabel: "QoS", icon: Activity, group: "tools" },
  { to: "/topology", label: "Network", shortLabel: "Network", icon: Network, group: "tools" },
  { to: "/root-cause", label: "Root-Cause", shortLabel: "Diagnosis", icon: Search, group: "tools" },
  { to: "/export", label: "Export", shortLabel: "Export", icon: Download, group: "tools" },

  // System
  { to: "/settings", label: "Settings", shortLabel: "Settings", icon: Settings, group: "system" },
  { to: "/docs", label: "Documentation", shortLabel: "Docs", icon: BookOpen, group: "system" },
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

export const navGroups: { key: NavGroup; label: string }[] = [
  { key: "main", label: "Main" },
  { key: "tools", label: "Tools" },
  { key: "system", label: "System" },
];
