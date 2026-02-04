import { useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Gauge,
  Settings,
  BarChart3,
  Download,
  AlertTriangle,
  Shield,
  Zap,
  Clock,
  Server,
  Activity,
  Network,
  GitCompare,
  TrendingUp,
  MousePointerClick,
  Bell,
  Sparkles,
  Terminal,
} from "lucide-react";
import { GlassCard } from "../components/ui/GlassCard";

interface DocSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function DocSection({ title, icon, children, defaultOpen = false }: DocSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <GlassCard className="overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-[var(--g-surface)]"
      >
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: "var(--g-accent-dim)" }}
          >
            {icon}
          </div>
          <span className="font-semibold" style={{ color: "var(--g-text)" }}>
            {title}
          </span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-5 h-5" style={{ color: "var(--g-text-secondary)" }} />
        ) : (
          <ChevronRight className="w-5 h-5" style={{ color: "var(--g-text-secondary)" }} />
        )}
      </button>
      {isOpen && (
        <div
          className="px-4 pb-4 pt-2 border-t"
          style={{ borderColor: "var(--g-border)", color: "var(--g-text-secondary)" }}
        >
          {children}
        </div>
      )}
    </GlassCard>
  );
}

function DocParagraph({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed mb-3 last:mb-0">{children}</p>;
}

function DocHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="font-semibold text-sm mb-2 mt-4 first:mt-0" style={{ color: "var(--g-text)" }}>
      {children}
    </h4>
  );
}

function DocList({ items }: { items: string[] }) {
  return (
    <ul className="text-sm space-y-1 ml-4 mb-3">
      {items.map((item, i) => (
        <li key={i} className="list-disc list-outside">
          {item}
        </li>
      ))}
    </ul>
  );
}

function DocTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto mb-3">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--g-border)" }}>
            {headers.map((h, i) => (
              <th
                key={i}
                className="text-left py-2 px-2 font-medium"
                style={{ color: "var(--g-text)" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid var(--g-border)" }}>
              {row.map((cell, j) => (
                <td key={j} className="py-2 px-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DocsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 g-animate-in mb-6">
        <BookOpen className="w-5 h-5" style={{ color: "var(--g-accent)" }} />
        <h2 className="text-xl font-bold" style={{ color: "var(--g-text)" }}>
          Documentation
        </h2>
      </div>

      <div className="grid gap-4">
        <DocSection
          title="Getting Started"
          icon={<Zap className="w-4 h-4" style={{ color: "var(--g-accent)" }} />}
          defaultOpen={true}
        >
          <DocParagraph>
            Gonzales automatically tests your internet speed and keeps track of the results.
            It runs speed tests at regular intervals and provides detailed analytics.
          </DocParagraph>
          <DocHeading>What you get</DocHeading>
          <DocList
            items={[
              "Dashboard showing current internet speed with live updates",
              "History of all past speed tests with filtering options",
              "Alerts when your internet is slower than expected",
              "Statistics to see if your ISP delivers what you pay for",
              "QoS tests for specific applications (Netflix, Zoom, Gaming)",
              "Network topology analysis to identify bottlenecks",
            ]}
          />
        </DocSection>

        <DocSection
          title="Dashboard"
          icon={<Gauge className="w-4 h-4" style={{ color: "var(--g-accent)" }} />}
        >
          <DocParagraph>
            The main dashboard shows your latest speed test results at a glance.
          </DocParagraph>
          <DocHeading>Speed Metrics</DocHeading>
          <DocList
            items={[
              "Download Speed: How fast you can receive data (streaming, downloads)",
              "Upload Speed: How fast you can send data (video calls, uploads)",
              "Ping: How quickly your connection responds (important for gaming)",
              "Jitter: Variation in ping times (affects call quality)",
            ]}
          />
          <DocHeading>Color Indicators</DocHeading>
          <DocList
            items={[
              "Green: Your speed is above your configured threshold",
              "Red: Your speed is below threshold - potential issue",
            ]}
          />
        </DocSection>

        <DocSection
          title="Configuration"
          icon={<Settings className="w-4 h-4" style={{ color: "var(--g-accent)" }} />}
        >
          <DocHeading>Test Interval</DocHeading>
          <DocParagraph>
            How often Gonzales runs a speed test. Default is 30 minutes.
            Range: 1-1440 minutes. Recommendation: 30-60 minutes is usually enough.
          </DocParagraph>
          <DocHeading>Speed Thresholds</DocHeading>
          <DocParagraph>
            Enter the speed your ISP promises you. Check your contract or bill for these values.
          </DocParagraph>
          <DocHeading>Tolerance</DocHeading>
          <DocParagraph>
            How much slower than your plan is still acceptable. Default: 15% (meaning 85% of your plan speed is OK).
            Internet speeds naturally fluctuate, so some tolerance is normal.
          </DocParagraph>
          <DocTable
            headers={["Plan", "Tolerance", "Minimum OK Speed"]}
            rows={[
              ["1000 Mbps", "15%", "850 Mbps"],
              ["500 Mbps", "15%", "425 Mbps"],
              ["100 Mbps", "20%", "80 Mbps"],
            ]}
          />
          <DocHeading>ISP / Provider Name</DocHeading>
          <DocParagraph>
            Enter your internet provider's name. This will be included in professional compliance reports for documentation purposes.
          </DocParagraph>
        </DocSection>

        <DocSection
          title="Statistics & Analytics"
          icon={<BarChart3 className="w-4 h-4" style={{ color: "var(--g-accent)" }} />}
        >
          <DocParagraph>
            The Statistics page shows detailed analytics about your connection.
          </DocParagraph>
          <DocHeading>ISP Score</DocHeading>
          <DocParagraph>
            A grade from A to F based on how consistently your ISP delivers promised speeds.
            Factors include average speed, compliance rate, and stability.
          </DocParagraph>
          <DocHeading>Time-of-Day Analysis</DocHeading>
          <DocParagraph>
            See how your speeds vary throughout the day. Useful for identifying
            peak congestion times (usually evenings).
          </DocParagraph>
          <DocHeading>SLA Compliance</DocHeading>
          <DocParagraph>
            Percentage of tests that met your configured threshold.
            This helps document ISP performance for potential complaints.
          </DocParagraph>
        </DocSection>

        <DocSection
          title="QoS Tests"
          icon={<Activity className="w-4 h-4" style={{ color: "var(--g-accent)" }} />}
        >
          <DocParagraph>
            Quality of Service tests check if your connection meets requirements for specific applications.
          </DocParagraph>
          <DocHeading>Available Profiles</DocHeading>
          <DocTable
            headers={["Application", "Min Download", "Max Ping", "Max Jitter"]}
            rows={[
              ["Netflix 4K", "25 Mbps", "100 ms", "30 ms"],
              ["Zoom HD", "3 Mbps", "150 ms", "40 ms"],
              ["Cloud Gaming", "35 Mbps", "40 ms", "10 ms"],
              ["VPN Work", "10 Mbps", "100 ms", "50 ms"],
              ["Video Upload", "20 Mbps", "200 ms", "-"],
            ]}
          />
          <DocParagraph>
            Each profile tests multiple metrics. Green means all requirements are met,
            red indicates some requirements are not satisfied.
          </DocParagraph>
        </DocSection>

        <DocSection
          title="Network Topology"
          icon={<Network className="w-4 h-4" style={{ color: "var(--g-accent)" }} />}
        >
          <DocParagraph>
            Network topology analysis traces the route your data takes to reach the internet,
            helping identify where slowdowns occur.
          </DocParagraph>
          <DocHeading>How to Use</DocHeading>
          <DocList
            items={[
              "Click 'Analyze Now' to run a traceroute analysis",
              "Each hop shows latency and packet loss",
              "Local network hops (your router) are highlighted",
              "Bottlenecks are marked with warnings",
            ]}
          />
          <DocHeading>Latency Colors</DocHeading>
          <DocList
            items={[
              "Green (<20ms): Excellent response time",
              "Yellow (20-50ms): Good, normal for internet hops",
              "Red (>50ms): High latency, potential issue",
              "Gray: Timeout - node didn't respond",
            ]}
          />
        </DocSection>

        <DocSection
          title="Export & Reports"
          icon={<Download className="w-4 h-4" style={{ color: "var(--g-accent)" }} />}
        >
          <DocHeading>Export Formats</DocHeading>
          <DocList
            items={[
              "CSV: For spreadsheets (Excel, Google Sheets)",
              "PDF: Professional report with charts and analysis",
            ]}
          />
          <DocHeading>Professional Report</DocHeading>
          <DocParagraph>
            The PDF report includes executive summary, SLA compliance metrics,
            time-of-day analysis, and is suitable for documentation or ISP complaints.
            Configure your ISP name in Settings for it to appear on reports.
          </DocParagraph>
        </DocSection>

        <DocSection
          title="Troubleshooting"
          icon={<AlertTriangle className="w-4 h-4" style={{ color: "var(--g-amber)" }} />}
        >
          <DocHeading>Blank Page / Loading Issues</DocHeading>
          <DocList
            items={[
              "Restart the addon in Home Assistant",
              "Clear browser cache (Ctrl+Shift+R)",
              "Wait 30 seconds and try again",
            ]}
          />
          <DocHeading>Speed Test Failures</DocHeading>
          <DocList
            items={[
              "Check your internet connection",
              "Firewall may be blocking Ookla servers",
              "Try setting a specific preferred server ID",
              "Wait and retry - servers may be busy",
            ]}
          />
          <DocHeading>Speeds Lower Than Expected</DocHeading>
          <DocList
            items={[
              "WiFi vs Cable: Wired connections are faster",
              "Time of day: Evening is typically slower",
              "Other devices using bandwidth",
              "Distance from router to Home Assistant device",
            ]}
          />
          <DocHeading>Sensors Show Unavailable</DocHeading>
          <DocParagraph>
            Run at least one speed test manually. Sensors update after a completed test.
          </DocParagraph>
        </DocSection>

        <DocSection
          title="Data & Privacy"
          icon={<Shield className="w-4 h-4" style={{ color: "var(--g-green)" }} />}
        >
          <DocHeading>Where Data is Stored</DocHeading>
          <DocTable
            headers={["File", "Contents"]}
            rows={[
              ["gonzales.db", "All speed test results"],
              ["config.json", "Your settings"],
              [".api_key", "Security key (auto-generated)"],
            ]}
          />
          <DocHeading>Privacy</DocHeading>
          <DocParagraph>
            All data stays on your device. Gonzales only connects to Ookla servers
            to measure speed. No analytics, no tracking, no cloud storage.
          </DocParagraph>
        </DocSection>

        <DocSection
          title="Home Assistant Integration"
          icon={<Server className="w-4 h-4" style={{ color: "var(--g-blue)" }} />}
        >
          <DocHeading>Available Sensors</DocHeading>
          <DocTable
            headers={["Sensor", "Entity ID"]}
            rows={[
              ["Download Speed", "sensor.gonzales_download_speed"],
              ["Upload Speed", "sensor.gonzales_upload_speed"],
              ["Ping", "sensor.gonzales_ping_latency"],
              ["Jitter", "sensor.gonzales_ping_jitter"],
              ["Packet Loss", "sensor.gonzales_packet_loss"],
              ["ISP Score", "sensor.gonzales_isp_score"],
              ["Last Test", "sensor.gonzales_last_test_time"],
            ]}
          />
          <DocHeading>Automation Example</DocHeading>
          <DocParagraph>
            Create automations to get notified when internet is slow:
          </DocParagraph>
          <pre
            className="text-xs p-3 rounded-lg overflow-x-auto mb-3"
            style={{ backgroundColor: "var(--g-surface)" }}
          >
{`trigger:
  platform: numeric_state
  entity_id: sensor.gonzales_download_speed
  below: 100
action:
  service: notify.mobile_app
  data:
    title: "Slow Internet"
    message: "Speed: {{ states('sensor.gonzales_download_speed') }} Mbps"`}
          </pre>
        </DocSection>

        <DocSection
          title="Connection Comparison"
          icon={<GitCompare className="w-4 h-4" style={{ color: "var(--g-accent)" }} />}
        >
          <DocParagraph>
            Automatically detects and compares performance across different connection types
            (Ethernet, Wi-Fi, VPN) to help you understand which connection works best.
          </DocParagraph>
          <DocHeading>Connection Types</DocHeading>
          <DocList
            items={[
              "Ethernet: Wired connections (eth*, enp* interfaces)",
              "Wi-Fi: Wireless connections (wlan*, wlp* interfaces)",
              "VPN: Virtual private network connections (tun*, tap* interfaces)",
            ]}
          />
          <DocHeading>Comparison Metrics</DocHeading>
          <DocParagraph>
            The comparison shows average speeds, reliability scores, and recommendations
            for which connection type is best for downloads, uploads, and latency.
          </DocParagraph>
        </DocSection>

        <DocSection
          title="Predictive Analytics"
          icon={<TrendingUp className="w-4 h-4" style={{ color: "var(--g-accent)" }} />}
        >
          <DocParagraph>
            Advanced prediction algorithms forecast your future internet speeds
            based on historical patterns and seasonal factors.
          </DocParagraph>
          <DocHeading>Features</DocHeading>
          <DocList
            items={[
              "7-day forecast with confidence intervals",
              "Day-of-week seasonal factors (e.g., weekends vs weekdays)",
              "Exponential smoothing for trend analysis",
              "Data quality score indicates prediction reliability",
            ]}
          />
          <DocHeading>Confidence Levels</DocHeading>
          <DocParagraph>
            Predictions include upper and lower bounds showing the expected range.
            Higher data quality scores mean more reliable predictions.
          </DocParagraph>
        </DocSection>

        <DocSection
          title="Quick Actions"
          icon={<MousePointerClick className="w-4 h-4" style={{ color: "var(--g-accent)" }} />}
        >
          <DocParagraph>
            The floating action button (FAB) in the bottom-right corner provides
            quick access to common actions from any page.
          </DocParagraph>
          <DocHeading>Available Actions</DocHeading>
          <DocList
            items={[
              "Run Speed Test: Start a manual speed test immediately",
              "Export Data: Go to the export page",
              "Settings: Quick access to configuration",
            ]}
          />
          <DocParagraph>
            Click the + button to expand the menu, then select an action.
            Click outside or on the backdrop to close.
          </DocParagraph>
        </DocSection>

        <DocSection
          title="Notifications"
          icon={<Bell className="w-4 h-4" style={{ color: "var(--g-accent)" }} />}
        >
          <DocParagraph>
            Toast notifications appear in the top-right corner to provide feedback
            about actions and important events.
          </DocParagraph>
          <DocHeading>Notification Types</DocHeading>
          <DocList
            items={[
              "Success (green): Action completed successfully",
              "Error (red): Something went wrong",
              "Warning (orange): Important notice",
              "Info (blue): General information",
            ]}
          />
          <DocHeading>Home Assistant Automations</DocHeading>
          <DocParagraph>
            Combine Gonzales sensors with Home Assistant to create custom notifications
            on your phone, smart speakers, or other devices when speeds drop.
          </DocParagraph>
        </DocSection>

        <DocSection
          title="Setup Wizard"
          icon={<Sparkles className="w-4 h-4" style={{ color: "var(--g-accent)" }} />}
        >
          <DocParagraph>
            First-time users see an onboarding wizard that guides through initial setup.
          </DocParagraph>
          <DocHeading>Wizard Steps</DocHeading>
          <DocList
            items={[
              "Welcome: Introduction to Gonzales",
              "ISP Info: Enter your internet provider name (optional)",
              "Thresholds: Set download and upload speed expectations",
              "Interval: Choose how often to run tests",
              "Finish: Review and save settings",
            ]}
          />
          <DocParagraph>
            You can skip the wizard and configure settings later. To re-run the wizard,
            clear your browser's local storage for this site.
          </DocParagraph>
        </DocSection>

        <DocSection
          title="Terminal Interface"
          icon={<Terminal className="w-4 h-4" style={{ color: "var(--g-accent)" }} />}
        >
          <DocParagraph>
            Gonzales includes a command-line interface (CLI) and text-based user interface (TUI)
            for terminal-only environments.
          </DocParagraph>
          <DocHeading>CLI Commands</DocHeading>
          <DocTable
            headers={["Command", "Description"]}
            rows={[
              ["gonzales run", "Run a speed test"],
              ["gonzales status", "Show current status"],
              ["gonzales history", "View measurement history"],
              ["gonzales stats", "Show statistics"],
              ["gonzales export", "Export data to file"],
              ["gonzales config", "View or modify settings"],
              ["gonzales server", "Start the web server"],
            ]}
          />
          <DocHeading>TUI Navigation</DocHeading>
          <DocList
            items={[
              "d: Dashboard",
              "h: History",
              "a: Analytics/Statistics",
              "s: Settings",
              "t: Run speed test",
              "?: Help screen",
              "q: Quit",
            ]}
          />
          <DocParagraph>
            Install CLI with: pip install gonzales[cli]
          </DocParagraph>
        </DocSection>

        <DocSection
          title="Technical Details"
          icon={<Clock className="w-4 h-4" style={{ color: "var(--g-text-secondary)" }} />}
        >
          <DocHeading>Architecture</DocHeading>
          <DocParagraph>
            Gonzales uses FastAPI (Python) with SQLite for storage.
            The frontend is built with React and communicates via REST API.
            Speed tests use the Ookla Speedtest CLI (third-party, see license notice).
          </DocParagraph>
          <DocHeading>Resource Usage</DocHeading>
          <DocList
            items={[
              "Memory: ~100-200 MB during speed tests",
              "Disk: ~50 KB per test",
              "Network: Full bandwidth for 2-3 minutes during tests",
            ]}
          />
        </DocSection>
      </div>

      <p
        className="text-xs text-center mt-6 g-animate-in"
        style={{ color: "var(--g-text-secondary)" }}
      >
        For more detailed documentation, visit the{" "}
        <a
          href="https://github.com/akustikrausch/gonzales-ha"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:no-underline"
          style={{ color: "var(--g-accent)" }}
        >
          GitHub repository
        </a>
      </p>
    </div>
  );
}
