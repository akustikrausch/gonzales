import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SpeedGauge } from "./SpeedGauge";

describe("SpeedGauge", () => {
  it("renders label and value", () => {
    render(<SpeedGauge label="Download" value={500} color="var(--g-blue)" />);

    expect(screen.getByText("Download")).toBeInTheDocument();
    expect(screen.getByText("Mbps")).toBeInTheDocument();
  });

  it("renders sublabel when provided", () => {
    render(
      <SpeedGauge
        label="Download"
        sublabel="Latest"
        value={500}
        color="var(--g-blue)"
      />
    );

    expect(screen.getByText("Latest")).toBeInTheDocument();
  });

  it("uses custom unit when provided", () => {
    render(
      <SpeedGauge label="Ping" value={15} unit="ms" color="var(--g-purple)" />
    );

    expect(screen.getByText("ms")).toBeInTheDocument();
  });

  it("shows threshold status when value is above threshold", () => {
    render(
      <SpeedGauge
        label="Download"
        value={600}
        color="var(--g-blue)"
        threshold={500}
      />
    );

    expect(screen.getByText(/Above threshold/)).toBeInTheDocument();
  });

  it("shows threshold status when value is below threshold", () => {
    render(
      <SpeedGauge
        label="Download"
        value={400}
        color="var(--g-blue)"
        threshold={500}
      />
    );

    expect(screen.getByText(/Below threshold/)).toBeInTheDocument();
  });

  it("shows custom threshold label", () => {
    render(
      <SpeedGauge
        label="Download"
        value={600}
        color="var(--g-blue)"
        threshold={500}
        thresholdLabel="Min: 500 Mbps"
      />
    );

    expect(screen.getByText(/Min: 500 Mbps/)).toBeInTheDocument();
  });

  it("does not show threshold status when no threshold provided", () => {
    render(<SpeedGauge label="Download" value={500} color="var(--g-blue)" />);

    expect(screen.queryByText(/threshold/i)).not.toBeInTheDocument();
  });

  it("applies correct color based on threshold compliance", () => {
    const { container, rerender } = render(
      <SpeedGauge
        label="Download"
        value={600}
        color="var(--g-blue)"
        threshold={500}
      />
    );

    // Above threshold should show green text
    const aboveText = container.querySelector('[style*="var(--g-green)"]');
    expect(aboveText).toBeInTheDocument();

    // Re-render with violation
    rerender(
      <SpeedGauge
        label="Download"
        value={400}
        color="var(--g-blue)"
        threshold={500}
      />
    );

    // Below threshold should show red text
    const belowText = container.querySelector('[style*="var(--g-red)"]');
    expect(belowText).toBeInTheDocument();
  });
});
