import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Dashboard", icon: "⚡" },
  { to: "/history", label: "History", icon: "📋" },
  { to: "/statistics", label: "Statistics", icon: "📊" },
  { to: "/export", label: "Export", icon: "📥" },
  { to: "/settings", label: "Settings", icon: "⚙️" },
];

export function Sidebar() {
  return (
    <aside className="w-56 bg-white border-r border-[#E5E5EA] min-h-screen flex flex-col">
      <div className="p-5 border-b border-[#E5E5EA]">
        <h1 className="text-lg font-bold text-[#1D1D1F] tracking-tight">
          Gonzales
        </h1>
        <p className="text-xs text-[#86868B] mt-0.5">Speed Monitor</p>
      </div>
      <nav className="flex-1 p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
                isActive
                  ? "bg-[#007AFF]/10 text-[#007AFF]"
                  : "text-[#1D1D1F] hover:bg-black/5"
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-[#E5E5EA]">
        <p className="text-[10px] text-[#86868B]">by Warp9</p>
      </div>
    </aside>
  );
}
