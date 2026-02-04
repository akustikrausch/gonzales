import { useState, type ReactNode } from "react";
import { Plus } from "lucide-react";

interface FABAction {
  id: string;
  icon: ReactNode;
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

interface FABProps {
  actions: FABAction[];
  icon?: ReactNode;
}

export function FAB({ actions, icon }: FABProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => setIsExpanded((prev) => !prev);
  const close = () => setIsExpanded(false);

  const handleAction = (action: FABAction) => {
    close();
    action.onClick();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`glass-fab-backdrop ${isExpanded ? "glass-fab-backdrop-visible" : ""}`}
        onClick={close}
        aria-hidden="true"
      />

      {/* FAB Container */}
      <div className="glass-fab-container">
        {/* Action items */}
        <div className={`glass-fab-actions ${isExpanded ? "glass-fab-actions-visible" : ""}`}>
          {actions.map((action) => (
            <button
              key={action.id}
              className={`glass-fab-action glass-fab-action-${action.variant || "secondary"}`}
              onClick={() => handleAction(action)}
              type="button"
            >
              <span className="glass-fab-action-icon">{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>

        {/* Main FAB button */}
        <button
          className={`glass-fab ${isExpanded ? "glass-fab-expanded" : ""}`}
          onClick={toggleExpanded}
          type="button"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? "Close menu" : "Open quick actions"}
        >
          {icon || <Plus className="w-6 h-6" />}
        </button>
      </div>
    </>
  );
}

export function QuickActionsFAB() {
  const handleRunTest = () => {
    // Will be connected via useSpeedTest hook in integration
    document.dispatchEvent(new CustomEvent("gonzales:run-test"));
  };

  const handleExport = () => {
    document.dispatchEvent(new CustomEvent("gonzales:export"));
  };

  const handleSettings = () => {
    document.dispatchEvent(new CustomEvent("gonzales:settings"));
  };

  const actions: FABAction[] = [
    {
      id: "run-test",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      label: "Run Speed Test",
      onClick: handleRunTest,
      variant: "primary",
    },
    {
      id: "export",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      label: "Export Data",
      onClick: handleExport,
      variant: "secondary",
    },
    {
      id: "settings",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      label: "Settings",
      onClick: handleSettings,
      variant: "secondary",
    },
  ];

  return <FAB actions={actions} />;
}
