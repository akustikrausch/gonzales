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
  Server,
  Activity,
  Network,
  Wifi,
  HardDrive,
  RefreshCw,
  FileText,
  Home,
  Brain,
  Search,
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

function CodeBlock({ children }: { children: string }) {
  return (
    <pre
      className="text-xs p-3 rounded-lg overflow-x-auto mb-3"
      style={{ backgroundColor: "var(--g-surface)" }}
    >
      {children}
    </pre>
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
            Gonzales monitors your internet speed automatically. It runs tests at regular intervals
            and tracks your ISP's performance over time. No technical knowledge required.
          </DocParagraph>
          <DocHeading>First Steps</DocHeading>
          <DocList
            items={[
              "1. Install Gonzales as a Home Assistant addon",
              "2. Restart Home Assistant after first addon start",
              "3. Add the Gonzales integration (Settings → Devices & Services)",
              "4. Click 'Gonzales' in the sidebar to open the dashboard",
              "5. The first speed test runs automatically within minutes",
            ]}
          />
          <DocHeading>Features Overview</DocHeading>
          <DocTable
            headers={["Feature", "Description"]}
            rows={[
              ["Dashboard", "Real-time speed display with live test progress"],
              ["History", "All past tests with filtering and deletion"],
              ["Statistics", "ISP grading, trends, and SLA compliance"],
              ["QoS Tests", "Application-specific tests (Netflix, Zoom, Gaming)"],
              ["Topology", "Network route analysis to find bottlenecks"],
              ["Export", "CSV data export and professional PDF reports"],
            ]}
          />
          <DocHeading>Keyboard Shortcuts</DocHeading>
          <DocTable
            headers={["Key", "Action"]}
            rows={[
              ["Tab / Shift+Tab", "Navigate between elements"],
              ["Enter / Space", "Activate buttons and links"],
              ["Escape", "Close dialogs and menus"],
            ]}
          />
        </DocSection>

        <DocSection
          title="Dashboard"
          icon={<Gauge className="w-4 h-4" style={{ color: "var(--g-accent)" }} />}
        >
          <DocParagraph>
            The dashboard shows your latest speed test results and allows you to run manual tests.
          </DocParagraph>
          <DocHeading>Speed Metrics Explained</DocHeading>
          <DocTable
            headers={["Metric", "What It Means", "Good Values"]}
            rows={[
              ["Download", "Speed for receiving data (streaming, downloads)", "Depends on your plan"],
              ["Upload", "Speed for sending data (video calls, uploads)", "Depends on your plan"],
              ["Ping", "Response time - how fast the connection reacts", "< 20ms excellent, < 50ms good"],
              ["Jitter", "Variation in ping - affects call quality", "< 10ms excellent, < 30ms acceptable"],
              ["Packet Loss", "Data packets that didn't arrive", "0% ideal, < 1% acceptable"],
            ]}
          />
          <DocHeading>Color Indicators</DocHeading>
          <DocList
            items={[
              "Green: Speed is above your configured threshold - everything OK",
              "Red: Speed is below threshold - potential problem with your connection",
              "The threshold considers your tolerance setting (default 15%)",
            ]}
          />
          <DocHeading>Header Status</DocHeading>
          <DocParagraph>
            The header shows scheduler status and next test time. When the scheduler is active,
            you'll see a countdown to the next automatic test (e.g., "45 min"). During tests,
            you'll see "Test running..." with a pulsing animation.
          </DocParagraph>
          <DocHeading>Running Manual Tests</DocHeading>
          <DocParagraph>
            Click "Run Test" to start a speed test immediately. The test takes 2-3 minutes and
            uses your full bandwidth. Results appear in real-time as the test progresses through
            download, upload, and latency phases.
          </DocParagraph>
        </DocSection>

        <DocSection
          title="Configuration"
          icon={<Settings className="w-4 h-4" style={{ color: "var(--g-accent)" }} />}
        >
          <DocHeading>Test Interval</DocHeading>
          <DocTable
            headers={["Interval", "Tests/Day", "Data Usage", "Recommended For"]}
            rows={[
              ["15 min", "96", "~10-15 GB", "Short-term monitoring, ISP issues"],
              ["30 min", "48", "~5-7 GB", "Active monitoring"],
              ["60 min (default)", "24", "~2.5-4 GB", "Normal use - best balance"],
              ["120 min", "12", "~1.2-2 GB", "Light monitoring"],
              ["240 min", "6", "~0.6-1 GB", "Minimal monitoring"],
            ]}
          />
          <DocParagraph>
            Each speed test uses approximately 100-150 MB of data. Choose an interval that
            balances monitoring frequency with data usage.
          </DocParagraph>
          <DocHeading>Download & Upload Thresholds</DocHeading>
          <DocParagraph>
            Enter the speeds your ISP promises in your contract. These are used to:
          </DocParagraph>
          <DocList
            items={[
              "Calculate whether tests pass or fail (green/red colors)",
              "Compute SLA compliance percentage",
              "Generate the ISP score grade",
              "Create professional reports for ISP complaints",
            ]}
          />
          <DocParagraph>
            Where to find your promised speeds: Check your ISP contract, bill, router admin page,
            or contact your ISP directly.
          </DocParagraph>
          <DocHeading>Tolerance Setting</DocHeading>
          <DocParagraph>
            Internet speeds naturally fluctuate. The tolerance defines how much below your
            threshold is still considered acceptable.
          </DocParagraph>
          <DocTable
            headers={["Your Plan", "Tolerance", "Minimum OK", "What It Means"]}
            rows={[
              ["1000 Mbps", "15%", "850 Mbps", "850+ Mbps = green, below = red"],
              ["500 Mbps", "15%", "425 Mbps", "425+ Mbps = green, below = red"],
              ["100 Mbps", "20%", "80 Mbps", "80+ Mbps = green, below = red"],
              ["50 Mbps", "10%", "45 Mbps", "45+ Mbps = green, below = red"],
            ]}
          />
          <DocHeading>ISP / Provider Name</DocHeading>
          <DocParagraph>
            Enter your internet provider's name (e.g., "Telekom", "Vodafone", "O2").
            This appears on professional PDF reports and helps identify the provider
            when documenting issues.
          </DocParagraph>
          <DocHeading>Preferred Server ID</DocHeading>
          <DocParagraph>
            By default (ID = 0), Gonzales auto-selects the nearest Ookla server. If results
            seem inconsistent, you can specify a server:
          </DocParagraph>
          <DocList
            items={[
              "Go to speedtest.net and click 'Change Server'",
              "Select a server near you",
              "Note the server ID from the URL or page",
              "Enter this ID in Gonzales settings",
            ]}
          />
        </DocSection>

        <DocSection
          title="Statistics & Analytics"
          icon={<BarChart3 className="w-4 h-4" style={{ color: "var(--g-accent)" }} />}
        >
          <DocHeading>ISP Score & Grade</DocHeading>
          <DocParagraph>
            The ISP score (0-100) rates your provider's overall performance. It considers:
          </DocParagraph>
          <DocList
            items={[
              "Average speed vs. your threshold (how close to promised speeds)",
              "Consistency (how stable are the speeds)",
              "SLA compliance (percentage of tests meeting threshold)",
              "Reliability (failed test rate)",
            ]}
          />
          <DocTable
            headers={["Grade", "Score Range", "Interpretation"]}
            rows={[
              ["A", "90-100", "Excellent - ISP delivers as promised"],
              ["B", "80-89", "Good - Minor issues occasionally"],
              ["C", "70-79", "Fair - Noticeable underperformance"],
              ["D", "60-69", "Poor - Frequent problems"],
              ["F", "0-59", "Failing - Consider switching ISP"],
            ]}
          />
          <DocHeading>Time-of-Day Analysis</DocHeading>
          <DocParagraph>
            This chart shows how your speeds vary throughout the day. Typical patterns:
          </DocParagraph>
          <DocList
            items={[
              "Morning (6-9): Usually good speeds, low congestion",
              "Daytime (9-17): Generally stable",
              "Evening (17-23): Often slower - peak usage time",
              "Night (23-6): Usually fastest - least users online",
            ]}
          />
          <DocParagraph>
            If you see consistent slowdowns at certain times, this data helps when
            complaining to your ISP - it proves the issue is recurring.
          </DocParagraph>
          <DocHeading>SLA Compliance</DocHeading>
          <DocParagraph>
            Shows the percentage of tests that met your configured threshold.
            This is important for ISP complaints:
          </DocParagraph>
          <DocList
            items={[
              "Above 95%: ISP is delivering well",
              "90-95%: Acceptable, minor issues",
              "80-90%: Issues worth documenting",
              "Below 80%: Strong grounds for complaint or contract cancellation",
            ]}
          />
          <DocHeading>Trend Analysis</DocHeading>
          <DocParagraph>
            The trend chart shows whether your connection is improving, stable, or degrading
            over time. Look for:
          </DocParagraph>
          <DocList
            items={[
              "Downward trend: Connection getting worse - contact ISP",
              "Stable line: Consistent performance",
              "Sudden drops: May indicate network issues or ISP problems",
              "Seasonal patterns: Some areas have congestion at certain times",
            ]}
          />
        </DocSection>

        <DocSection
          title="Smart Test Scheduling"
          icon={<Brain className="w-4 h-4" style={{ color: "var(--g-accent)" }} />}
        >
          <DocParagraph>
            Smart Test Scheduling automatically adjusts test frequency based on your network
            conditions. When problems are detected, it tests more frequently to gather data.
            When stable, it returns to normal intervals to save bandwidth.
          </DocParagraph>
          <DocHeading>Three-Phase Model</DocHeading>
          <DocTable
            headers={["Phase", "Interval", "When Active"]}
            rows={[
              ["Normal", "Your configured interval (e.g., 60 min)", "Network is stable"],
              ["Burst", "10 minutes", "Anomaly detected - gathering diagnostic data"],
              ["Recovery", "15 → 30 → 45 → Normal", "After burst, gradually returning to normal"],
            ]}
          />
          <DocHeading>Stability Detection</DocHeading>
          <DocParagraph>
            The scheduler analyzes your recent test results to calculate a stability score (0-100%):
          </DocParagraph>
          <DocList
            items={[
              "Coefficient of Variation (CV): Measures how consistent your speeds are",
              "Z-Score Analysis: Detects anomalies that deviate significantly from your baseline",
              "Weighted Score: Download (50%), Upload (30%), Ping (20%)",
              "Score above 85% = Stable, below triggers burst mode",
            ]}
          />
          <DocHeading>Safety Mechanisms</DocHeading>
          <DocTable
            headers={["Mechanism", "Default", "Purpose"]}
            rows={[
              ["Min Interval", "5 minutes", "Prevents excessive testing"],
              ["Max Interval", "240 minutes", "Ensures regular monitoring"],
              ["Circuit Breaker", "10 tests / 30 min", "Stops runaway burst mode"],
              ["Daily Data Budget", "2 GB", "Limits total bandwidth used for tests"],
              ["Burst Max Tests", "6 tests", "Limits burst mode duration"],
              ["Burst Cooldown", "60 minutes", "Prevents immediate re-entry into burst"],
            ]}
          />
          <DocHeading>Data Budget</DocHeading>
          <DocParagraph>
            Each speed test uses approximately 100-200 MB. The 2 GB daily budget allows
            10-20 tests per day in worst case. When 80% of budget is used, a warning appears.
            At 100%, testing pauses until midnight reset.
          </DocParagraph>
          <DocHeading>Enabling Smart Scheduling</DocHeading>
          <DocList
            items={[
              "Go to Settings → Smart Scheduler section",
              "Toggle 'Enable Smart Scheduling' on",
              "Configure burst interval and data budget as needed",
              "Monitor the phase indicator and stability score",
            ]}
          />
        </DocSection>

        <DocSection
          title="Root-Cause Analysis"
          icon={<Search className="w-4 h-4" style={{ color: "var(--g-accent)" }} />}
        >
          <DocParagraph>
            Root-Cause Analysis correlates data from speed tests, network topology, and
            historical patterns to identify WHERE and WHY your connection has problems.
          </DocParagraph>
          <DocHeading>Network Health Score</DocHeading>
          <DocParagraph>
            A composite 0-100 score based on all network layers. This gives you a quick
            overview of your overall connection quality:
          </DocParagraph>
          <DocTable
            headers={["Score", "Rating", "Interpretation"]}
            rows={[
              ["90-100", "Excellent", "All layers performing well"],
              ["70-89", "Good", "Minor issues, generally stable"],
              ["50-69", "Fair", "Noticeable problems worth investigating"],
              ["Below 50", "Poor", "Significant issues affecting performance"],
            ]}
          />
          <DocHeading>Layer Health Breakdown</DocHeading>
          <DocParagraph>
            Each network layer is scored individually to pinpoint problems:
          </DocParagraph>
          <DocTable
            headers={["Layer", "What It Measures", "Common Issues"]}
            rows={[
              ["DNS", "First-hop latency to DNS servers", "High latency = DNS misconfiguration"],
              ["Local Network", "Your router and home network", "High latency = router/WiFi issues"],
              ["ISP Backbone", "ISP internal infrastructure (hops 4-10)", "Congestion = ISP capacity problems"],
              ["ISP Last-Mile", "Connection to your home", "Peak-hour drops = neighborhood congestion"],
              ["Server", "Speedtest server performance", "Inconsistent = server overload"],
            ]}
          />
          <DocHeading>Problem Fingerprints</DocHeading>
          <DocParagraph>
            The system automatically detects and classifies problems with confidence levels:
          </DocParagraph>
          <DocList
            items={[
              "Severity: Critical (red), Warning (yellow), Info (blue)",
              "Confidence: How certain the system is about the diagnosis (0-100%)",
              "Evidence: Specific data points supporting the diagnosis",
              "Occurrence: How often and when the problem appears",
            ]}
          />
          <DocHeading>Hop-Speed Correlation</DocHeading>
          <DocParagraph>
            Uses Pearson correlation to find which network hops affect your speed:
          </DocParagraph>
          <DocList
            items={[
              "Each traceroute hop is correlated with download speed",
              "Negative correlation (red) = this hop may be a bottleneck",
              "When latency at a specific hop increases, your speed decreases",
              "Helps identify exactly where in the network path problems occur",
            ]}
          />
          <DocHeading>Time-Based Patterns</DocHeading>
          <DocParagraph>
            Detects recurring patterns based on time:
          </DocParagraph>
          <DocList
            items={[
              "Peak-hour degradation: Slower speeds during evening hours (17-23h)",
              "Off-peak performance: Better speeds during night/early morning",
              "Weekday vs weekend patterns: Different usage patterns",
              "Helpful for ISP complaints - proves consistent issues at specific times",
            ]}
          />
          <DocHeading>Recommendations</DocHeading>
          <DocParagraph>
            Based on detected issues, the system generates prioritized action items:
          </DocParagraph>
          <DocList
            items={[
              "Priority 1: Critical actions for immediate improvement",
              "Priority 2: Recommended optimizations",
              "Priority 3: Nice-to-have improvements",
              "Each recommendation includes expected impact and difficulty level",
            ]}
          />
          <DocHeading>Accessing Root-Cause Analysis</DocHeading>
          <DocList
            items={[
              "Click 'Root-Cause' in the navigation menu",
              "Analysis requires at least 10 speed tests for accuracy",
              "Topology data (traceroute) improves hop correlation analysis",
              "More historical data = better pattern detection",
            ]}
          />
        </DocSection>

        <DocSection
          title="QoS Tests"
          icon={<Activity className="w-4 h-4" style={{ color: "var(--g-accent)" }} />}
        >
          <DocParagraph>
            Quality of Service tests check if your connection meets the requirements for
            specific applications. Each app has different needs.
          </DocParagraph>
          <DocHeading>Application Requirements</DocHeading>
          <DocTable
            headers={["Application", "Min Download", "Min Upload", "Max Ping", "Max Jitter"]}
            rows={[
              ["Netflix 4K", "25 Mbps", "3 Mbps", "100 ms", "30 ms"],
              ["YouTube 4K", "20 Mbps", "3 Mbps", "100 ms", "30 ms"],
              ["Zoom HD Video", "3.8 Mbps", "3 Mbps", "150 ms", "40 ms"],
              ["Teams/Skype", "4 Mbps", "4 Mbps", "100 ms", "30 ms"],
              ["Cloud Gaming", "35 Mbps", "5 Mbps", "40 ms", "10 ms"],
              ["Online Gaming", "5 Mbps", "2 Mbps", "50 ms", "15 ms"],
              ["VPN Work", "10 Mbps", "5 Mbps", "100 ms", "50 ms"],
              ["Video Upload (1080p)", "10 Mbps", "20 Mbps", "200 ms", "-"],
              ["Video Upload (4K)", "25 Mbps", "50 Mbps", "200 ms", "-"],
            ]}
          />
          <DocHeading>Understanding Results</DocHeading>
          <DocList
            items={[
              "Green check: All requirements met - app should work well",
              "Red X: One or more requirements not met - expect issues",
              "Individual metrics show which specific requirement failed",
            ]}
          />
          <DocHeading>Troubleshooting Failed QoS</DocHeading>
          <DocParagraph>
            If a QoS test fails:
          </DocParagraph>
          <DocList
            items={[
              "Ping too high: Use wired connection, check for background downloads",
              "Jitter too high: Usually WiFi interference - try different channel",
              "Download too low: Contact ISP, check for network congestion",
              "Upload too low: Common with cable connections - may need upgrade",
            ]}
          />
        </DocSection>

        <DocSection
          title="Network Topology"
          icon={<Network className="w-4 h-4" style={{ color: "var(--g-accent)" }} />}
        >
          <DocParagraph>
            Network topology traces the path your data takes to reach the internet.
            This helps identify where slowdowns occur.
          </DocParagraph>
          <DocHeading>What Each Hop Means</DocHeading>
          <DocTable
            headers={["Hop Type", "Example", "What It Is"]}
            rows={[
              ["Your Router", "192.168.1.1", "Your home network gateway"],
              ["ISP Node", "10.x.x.x", "Your ISP's internal network"],
              ["Backbone", "Various public IPs", "Internet infrastructure"],
              ["Destination", "speedtest.net server", "Test server"],
            ]}
          />
          <DocHeading>Latency Colors</DocHeading>
          <DocList
            items={[
              "Green (< 20ms): Excellent - no issues",
              "Yellow (20-50ms): Good - normal for internet hops",
              "Orange (50-100ms): Elevated - may cause lag",
              "Red (> 100ms): High - likely causing problems",
              "Gray (timeout): Node didn't respond - may be blocking ICMP",
            ]}
          />
          <DocHeading>Common Issues</DocHeading>
          <DocList
            items={[
              "High latency at first hop: Router problem - restart or replace",
              "High latency at ISP node: ISP issue - contact support",
              "High latency far away: Normal for distant servers",
              "All hops timeout: Firewall may be blocking traceroute",
            ]}
          />
          <DocHeading>Packet Loss</DocHeading>
          <DocParagraph>
            Packet loss above 0% indicates unstable connection. Any packet loss on
            your local network (first 1-2 hops) needs immediate attention - check cables
            and router.
          </DocParagraph>
        </DocSection>

        <DocSection
          title="Export & Reports"
          icon={<Download className="w-4 h-4" style={{ color: "var(--g-accent)" }} />}
        >
          <DocHeading>Export Formats</DocHeading>
          <DocTable
            headers={["Format", "Use Case", "Contains"]}
            rows={[
              ["CSV", "Data analysis in Excel/Sheets", "All raw measurement data"],
              ["PDF Report", "ISP complaints, documentation", "Summary, charts, analysis"],
            ]}
          />
          <DocHeading>CSV Export</DocHeading>
          <DocParagraph>
            The CSV file contains all measurements with columns for timestamp, download,
            upload, ping, jitter, packet loss, server info, and more. Open in Excel,
            Google Sheets, or any spreadsheet application for custom analysis.
          </DocParagraph>
          <DocHeading>Professional PDF Report</DocHeading>
          <DocParagraph>
            The PDF report is designed for documentation and ISP complaints. It includes:
          </DocParagraph>
          <DocList
            items={[
              "Executive summary with key metrics",
              "ISP score and grade with explanation",
              "SLA compliance statistics",
              "Time-of-day performance analysis",
              "Charts showing trends and patterns",
              "Individual test results table",
              "Your ISP name (if configured in settings)",
            ]}
          />
          <DocHeading>Using Reports for ISP Complaints</DocHeading>
          <DocParagraph>
            When complaining to your ISP about slow speeds:
          </DocParagraph>
          <DocList
            items={[
              "Collect at least 1-2 weeks of data",
              "Export the PDF report",
              "Highlight SLA compliance percentage",
              "Reference specific dates/times with issues",
              "Keep a copy for your records",
            ]}
          />
        </DocSection>

        <DocSection
          title="Troubleshooting"
          icon={<AlertTriangle className="w-4 h-4" style={{ color: "var(--g-amber)" }} />}
        >
          <DocHeading>Web Interface Not Loading</DocHeading>
          <DocList
            items={[
              "Restart the Gonzales addon (Settings → Add-ons → Gonzales → Restart)",
              "Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)",
              "Wait 30-60 seconds after restart",
              "Try a different browser or incognito mode",
              "Check addon logs for errors",
            ]}
          />
          <DocHeading>Speed Tests Failing</DocHeading>
          <DocTable
            headers={["Error", "Cause", "Solution"]}
            rows={[
              ["Connection timeout", "No internet or firewall", "Check connection, firewall rules"],
              ["Server not found", "DNS issues", "Try different preferred server ID"],
              ["License not accepted", "First-run issue", "Restart addon, EULA auto-accepts"],
              ["Test stuck at 0%", "Server overloaded", "Wait and retry, or change server"],
            ]}
          />
          <DocHeading>Speeds Lower Than Expected</DocHeading>
          <DocList
            items={[
              "WiFi vs Cable: Wired connections are significantly faster and more consistent",
              "Time of day: Evening (17-23h) is peak time - expect slower speeds",
              "Other devices: Check if other devices are downloading/streaming",
              "Router position: Distance and walls affect WiFi signal",
              "Router age: Old routers may not support full speeds",
              "ISP throttling: Some ISPs throttle certain traffic types",
            ]}
          />
          <DocHeading>Sensors Show 'Unavailable' in Home Assistant</DocHeading>
          <DocList
            items={[
              "At least one speed test must complete before sensors work",
              "Run a manual test from the dashboard",
              "Check that the Gonzales integration is configured",
              "Restart Home Assistant if sensors don't appear after first test",
            ]}
          />
          <DocHeading>Integration Cannot Connect</DocHeading>
          <DocParagraph>
            If auto-discovery doesn't find the addon, manually enter the hostname:
          </DocParagraph>
          <DocList
            items={[
              "Go to Settings → Add-ons → Gonzales",
              "Look at the browser URL: .../hassio/addon/XXXXX_gonzales/info",
              "The hostname is the addon slug with underscores → dashes",
              "Example: 546fc077_gonzales → 546fc077-gonzales",
              "Enter this hostname in the integration setup",
            ]}
          />
          <DocHeading>Addon Keeps Restarting</DocHeading>
          <DocList
            items={[
              "Check addon logs for error messages",
              "Database may be corrupted - delete gonzales.db and restart",
              "Disk may be full - free up space",
              "Memory issues - check if device has enough RAM",
            ]}
          />
        </DocSection>

        <DocSection
          title="Data & Privacy"
          icon={<Shield className="w-4 h-4" style={{ color: "var(--g-green)" }} />}
        >
          <DocHeading>Data Storage</DocHeading>
          <DocParagraph>
            All data is stored locally on your Home Assistant device in the addon's data folder:
          </DocParagraph>
          <DocTable
            headers={["File", "Purpose", "Can Delete?"]}
            rows={[
              ["gonzales.db", "All speed test results (SQLite database)", "Yes - loses all history"],
              ["config.json", "Your settings and preferences", "Yes - resets to defaults"],
              [".api_key", "Security key for API access", "Yes - auto-regenerates"],
            ]}
          />
          <DocHeading>Privacy</DocHeading>
          <DocList
            items={[
              "All measurement data stays on YOUR device",
              "Nothing is sent to external analytics or cloud services",
              "Gonzales only connects to Ookla servers to measure speed",
              "No tracking, no telemetry, no data collection",
              "Open source - you can verify the code yourself",
            ]}
          />
          <DocHeading>Backup</DocHeading>
          <DocParagraph>
            Your data is automatically included in Home Assistant backups. You can also
            manually copy the data folder via SSH or Samba if needed.
          </DocParagraph>
          <DocHeading>Data Retention</DocHeading>
          <DocParagraph>
            By default, all measurements are kept indefinitely. The database grows slowly
            (~50 KB per test, about 1.2 MB per month with hourly tests). You can manually
            delete old entries in the History page if needed.
          </DocParagraph>
        </DocSection>

        <DocSection
          title="Home Assistant Integration"
          icon={<Home className="w-4 h-4" style={{ color: "var(--g-blue)" }} />}
        >
          <DocHeading>Available Sensors</DocHeading>
          <DocTable
            headers={["Sensor", "Entity ID", "Unit", "Description"]}
            rows={[
              ["Download Speed", "sensor.gonzales_download_speed", "Mbps", "Latest download speed"],
              ["Upload Speed", "sensor.gonzales_upload_speed", "Mbps", "Latest upload speed"],
              ["Ping Latency", "sensor.gonzales_ping_latency", "ms", "Response time"],
              ["Ping Jitter", "sensor.gonzales_ping_jitter", "ms", "Latency variation"],
              ["Packet Loss", "sensor.gonzales_packet_loss", "%", "Lost data packets"],
              ["ISP Score", "sensor.gonzales_isp_score", "0-100", "Overall rating"],
              ["Last Test Time", "sensor.gonzales_last_test_time", "timestamp", "When last test ran"],
            ]}
          />
          <DocHeading>Smart Scheduler Sensors (v3.7.0+)</DocHeading>
          <DocTable
            headers={["Sensor", "Entity ID", "Description"]}
            rows={[
              ["Scheduler Phase", "sensor.gonzales_scheduler_phase", "Current phase: normal, burst, or recovery"],
              ["Stability Score", "sensor.gonzales_stability_score", "Network stability 0-100%"],
              ["Current Interval", "sensor.gonzales_scheduler_interval", "Current test interval in minutes"],
              ["Daily Data Used", "sensor.gonzales_daily_data_used", "Bandwidth used today in MB"],
            ]}
          />
          <DocHeading>Root-Cause Sensors (v3.7.0+)</DocHeading>
          <DocTable
            headers={["Sensor", "Entity ID", "Description"]}
            rows={[
              ["Network Health", "sensor.gonzales_network_health", "Overall network health score 0-100"],
              ["Primary Issue", "sensor.gonzales_primary_issue", "Current primary network issue (if any)"],
              ["DNS Health", "sensor.gonzales_dns_health", "DNS layer health score"],
              ["Local Network Health", "sensor.gonzales_local_network_health", "Local network health score"],
              ["ISP Backbone Health", "sensor.gonzales_isp_backbone_health", "ISP backbone health score"],
              ["ISP Last-Mile Health", "sensor.gonzales_isp_lastmile_health", "Last-mile connection health"],
            ]}
          />
          <DocHeading>Button Entity (v3.7.0+)</DocHeading>
          <DocTable
            headers={["Entity", "Entity ID", "Description"]}
            rows={[
              ["Run Speed Test", "button.gonzales_run_speedtest", "Trigger a manual speed test"],
            ]}
          />
          <DocHeading>Binary Sensors</DocHeading>
          <DocTable
            headers={["Sensor", "Entity ID", "ON When"]}
            rows={[
              ["Internet Outage", "binary_sensor.gonzales_internet_outage", "3 consecutive test failures"],
            ]}
          />
          <DocHeading>Dashboard Card Example</DocHeading>
          <CodeBlock>{`type: entities
title: Internet Speed
entities:
  - entity: sensor.gonzales_download_speed
    name: Download
    icon: mdi:download
  - entity: sensor.gonzales_upload_speed
    name: Upload
    icon: mdi:upload
  - entity: sensor.gonzales_ping_latency
    name: Ping
    icon: mdi:timer-outline
  - entity: sensor.gonzales_isp_score
    name: ISP Score
    icon: mdi:gauge`}</CodeBlock>
          <DocHeading>Gauge Card Example</DocHeading>
          <CodeBlock>{`type: gauge
entity: sensor.gonzales_download_speed
name: Download Speed
min: 0
max: 1000
severity:
  green: 850
  yellow: 500
  red: 0
unit: Mbps`}</CodeBlock>
          <DocHeading>History Graph</DocHeading>
          <CodeBlock>{`type: history-graph
title: Speed History (24h)
hours_to_show: 24
entities:
  - entity: sensor.gonzales_download_speed
    name: Download
  - entity: sensor.gonzales_upload_speed
    name: Upload`}</CodeBlock>
          <DocHeading>Slow Internet Notification</DocHeading>
          <CodeBlock>{`automation:
  - alias: "Slow Internet Alert"
    trigger:
      - platform: numeric_state
        entity_id: sensor.gonzales_download_speed
        below: 100
        for:
          minutes: 5
    action:
      - service: notify.mobile_app_your_phone
        data:
          title: "Slow Internet!"
          message: "Download: {{ states('sensor.gonzales_download_speed') }} Mbps"
          data:
            tag: "slow-internet"
            importance: high`}</CodeBlock>
          <DocHeading>Internet Outage Alert</DocHeading>
          <CodeBlock>{`automation:
  - alias: "Internet Outage Alert"
    trigger:
      - platform: state
        entity_id: binary_sensor.gonzales_internet_outage
        to: "on"
    action:
      - service: notify.mobile_app_your_phone
        data:
          title: "Internet Outage!"
          message: "Connection down for multiple consecutive tests"
      # Optional: Auto-restart router via smart plug
      - service: switch.turn_off
        entity_id: switch.router_plug
      - delay: "00:00:30"
      - service: switch.turn_on
        entity_id: switch.router_plug

  - alias: "Internet Restored"
    trigger:
      - platform: state
        entity_id: binary_sensor.gonzales_internet_outage
        to: "off"
    action:
      - service: notify.mobile_app_your_phone
        data:
          title: "Internet Restored"
          message: "Connection is back online"`}</CodeBlock>
          <DocHeading>Daily Speed Report</DocHeading>
          <CodeBlock>{`automation:
  - alias: "Daily Speed Report"
    trigger:
      - platform: time
        at: "08:00:00"
    action:
      - service: notify.mobile_app_your_phone
        data:
          title: "Daily Internet Report"
          message: >
            Download: {{ states('sensor.gonzales_download_speed') }} Mbps
            Upload: {{ states('sensor.gonzales_upload_speed') }} Mbps
            Ping: {{ states('sensor.gonzales_ping_latency') }} ms
            ISP Score: {{ states('sensor.gonzales_isp_score') }}`}</CodeBlock>
        </DocSection>

        <DocSection
          title="Standalone Installation"
          icon={<Server className="w-4 h-4" style={{ color: "var(--g-accent)" }} />}
        >
          <DocParagraph>
            You can run Gonzales on any device with Python (Raspberry Pi, NAS, server)
            and connect it to Home Assistant via the integration.
          </DocParagraph>
          <DocHeading>Requirements</DocHeading>
          <DocList
            items={[
              "Python 3.10 or newer",
              "Linux, macOS, or Windows",
              "Network access to Home Assistant",
            ]}
          />
          <DocHeading>Installation</DocHeading>
          <CodeBlock>{`# Install Gonzales
pip install gonzales

# Or with optional CLI tools
pip install gonzales[cli]

# Run the server
gonzales server

# Or with Python module
python -m gonzales`}</CodeBlock>
          <DocHeading>Configuration</DocHeading>
          <DocParagraph>
            On first run, Gonzales creates a config file. The web UI runs on port 8099
            by default. You can change settings via the web interface or config file.
          </DocParagraph>
          <DocHeading>Connecting to Home Assistant</DocHeading>
          <DocList
            items={[
              "Install HACS in Home Assistant (if not already)",
              "Add custom repository: https://github.com/akustikrausch/gonzales-ha",
              "Install the Gonzales integration",
              "Restart Home Assistant",
              "Add integration: Settings → Devices & Services → Add → Gonzales",
              "Enter your Gonzales server's IP address and port (8099)",
            ]}
          />
        </DocSection>

        <DocSection
          title="Understanding Speed Tests"
          icon={<Wifi className="w-4 h-4" style={{ color: "var(--g-accent)" }} />}
        >
          <DocHeading>How Speed Tests Work</DocHeading>
          <DocParagraph>
            Gonzales uses the Ookla Speedtest CLI (same as speedtest.net) to measure speeds.
            Each test has three phases:
          </DocParagraph>
          <DocList
            items={[
              "1. Latency test: Measures ping and jitter",
              "2. Download test: Downloads data from server to measure receive speed",
              "3. Upload test: Uploads data to server to measure send speed",
            ]}
          />
          <DocHeading>Factors Affecting Results</DocHeading>
          <DocTable
            headers={["Factor", "Impact", "Solution"]}
            rows={[
              ["WiFi interference", "High - can reduce speeds 30-50%", "Use ethernet cable"],
              ["Router distance", "Medium - signal degrades with distance", "Move closer or use mesh"],
              ["Time of day", "Medium - peak hours are slower", "Test at different times"],
              ["Other devices", "High - bandwidth is shared", "Pause other downloads"],
              ["Server selection", "Low-Medium - varies by location", "Try different server ID"],
              ["Router age", "Medium - old routers bottleneck", "Upgrade if older than 5 years"],
            ]}
          />
          <DocHeading>WiFi vs Ethernet</DocHeading>
          <DocParagraph>
            For accurate ISP speed measurement, use a wired ethernet connection. WiFi has
            inherent overhead and interference that makes it unreliable for testing.
            Typical WiFi speed loss:
          </DocParagraph>
          <DocList
            items={[
              "WiFi 5 (802.11ac): 30-50% of wired speed",
              "WiFi 6 (802.11ax): 50-70% of wired speed",
              "WiFi through walls: Additional 20-40% loss per wall",
            ]}
          />
          <DocHeading>Why Results Vary</DocHeading>
          <DocParagraph>
            Speed test results naturally fluctuate by 10-20%. This is normal and due to:
          </DocParagraph>
          <DocList
            items={[
              "Internet backbone congestion",
              "Test server load",
              "ISP network state",
              "Time of day",
              "Background processes on your network",
            ]}
          />
        </DocSection>

        <DocSection
          title="Technical Information"
          icon={<HardDrive className="w-4 h-4" style={{ color: "var(--g-text-secondary)" }} />}
        >
          <DocHeading>Architecture</DocHeading>
          <DocList
            items={[
              "Backend: FastAPI (Python) with async/await",
              "Database: SQLite with SQLAlchemy ORM",
              "Frontend: React with TypeScript and Vite",
              "Styling: TailwindCSS with custom design system",
              "Speed Tests: Ookla Speedtest CLI",
            ]}
          />
          <DocHeading>Resource Usage</DocHeading>
          <DocTable
            headers={["Resource", "Idle", "During Test", "Note"]}
            rows={[
              ["Memory", "~50 MB", "~150-200 MB", "Temporary spike during tests"],
              ["CPU", "~1%", "~10-20%", "Higher during analysis"],
              ["Disk", "-", "~50 KB/test", "Database grows slowly"],
              ["Network", "Minimal", "Full bandwidth", "2-3 minutes per test"],
            ]}
          />
          <DocHeading>API Endpoints</DocHeading>
          <DocParagraph>
            Gonzales provides a REST API for custom integrations. Main endpoints:
          </DocParagraph>
          <DocList
            items={[
              "GET /api/v1/status - Current status and scheduler state",
              "GET /api/v1/measurements - List all measurements",
              "POST /api/v1/speedtest/trigger - Start a speed test",
              "GET /api/v1/statistics - Get calculated statistics",
              "GET /api/v1/config - Get/update configuration",
            ]}
          />
          <DocHeading>Smart Scheduler API (v3.7.0+)</DocHeading>
          <DocList
            items={[
              "GET /api/v1/smart-scheduler/status - Phase, stability score, data budget",
              "GET /api/v1/smart-scheduler/config - Configuration settings",
              "PUT /api/v1/smart-scheduler/config - Update configuration",
              "POST /api/v1/smart-scheduler/enable - Enable smart scheduling",
              "POST /api/v1/smart-scheduler/disable - Disable smart scheduling",
              "GET /api/v1/smart-scheduler/decisions - Decision history",
            ]}
          />
          <DocHeading>Root-Cause API (v3.7.0+)</DocHeading>
          <DocList
            items={[
              "GET /api/v1/root-cause/analysis - Full root-cause analysis",
              "GET /api/v1/root-cause/fingerprints - Detected problem patterns",
              "GET /api/v1/root-cause/recommendations - Actionable recommendations",
              "GET /api/v1/root-cause/hop-correlations - Hop-speed correlations",
            ]}
          />
          <DocHeading>Security</DocHeading>
          <DocList
            items={[
              "API key authentication (auto-generated)",
              "Rate limiting: 120 requests/minute standard, 6/min for resource-intensive endpoints",
              "No external data transmission",
              "AppArmor profile for Home Assistant addon",
            ]}
          />
        </DocSection>

        <DocSection
          title="Updates & Changelog"
          icon={<RefreshCw className="w-4 h-4" style={{ color: "var(--g-accent)" }} />}
        >
          <DocHeading>How to Update</DocHeading>
          <DocList
            items={[
              "Home Assistant auto-updates addons (if enabled)",
              "Manual: Settings → Add-ons → Gonzales → Update",
              "After major updates, restart Home Assistant",
            ]}
          />
          <DocHeading>What's New in v3.7.0</DocHeading>
          <DocList
            items={[
              "Smart Test Scheduling: Adaptive intervals based on network stability",
              "Root-Cause Analysis: Network diagnostics with layer health scores",
              "Hop-Speed Correlation: Identify bottlenecks in your network path",
              "Problem Fingerprints: Automatic detection of recurring issues",
              "New HA Sensors: Scheduler phase, stability, network health, layer scores",
              "Button Entity: Trigger speed tests from Home Assistant",
              "CLI Commands: gonzales smart-scheduler and gonzales root-cause",
              "Settings UX Redesign: Consolidated from 9 cards to 4 sections",
              "SSE Fallback: Polling fallback for Home Assistant Ingress compatibility",
            ]}
          />
          <DocParagraph>
            See the GitHub repository for full changelog and release notes.
          </DocParagraph>
        </DocSection>

        <DocSection
          title="License & Credits"
          icon={<FileText className="w-4 h-4" style={{ color: "var(--g-text-secondary)" }} />}
        >
          <DocHeading>Gonzales</DocHeading>
          <DocParagraph>
            Gonzales is open source software licensed under MIT. You can view the source code,
            contribute, and report issues on GitHub.
          </DocParagraph>
          <DocHeading>Ookla Speedtest CLI</DocHeading>
          <DocParagraph>
            Speed tests use the Ookla Speedtest CLI, which is proprietary third-party software.
            By using Gonzales, you accept the Ookla EULA:
          </DocParagraph>
          <DocList
            items={[
              "Personal, non-commercial use: Permitted",
              "Commercial use: Requires separate Ookla license",
              "Speedtest® is a trademark of Ookla, LLC",
            ]}
          />
          <DocParagraph>
            Gonzales is not affiliated with or endorsed by Ookla.
          </DocParagraph>
        </DocSection>
      </div>

      <p
        className="text-xs text-center mt-6 g-animate-in"
        style={{ color: "var(--g-text-secondary)" }}
      >
        For more information, visit the{" "}
        <a
          href="https://github.com/akustikrausch/gonzales"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:no-underline"
          style={{ color: "var(--g-accent)" }}
        >
          Gonzales GitHub
        </a>
        {" | "}
        <a
          href="https://github.com/akustikrausch/gonzales-ha"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:no-underline"
          style={{ color: "var(--g-accent)" }}
        >
          Home Assistant Integration
        </a>
      </p>
    </div>
  );
}
