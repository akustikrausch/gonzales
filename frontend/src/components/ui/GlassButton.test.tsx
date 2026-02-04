import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GlassButton } from "./GlassButton";

describe("GlassButton", () => {
  it("renders children correctly", () => {
    render(<GlassButton>Click me</GlassButton>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("applies default variant and size classes", () => {
    render(<GlassButton>Default</GlassButton>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("glass-btn");
    expect(button).toHaveClass("px-4", "py-2", "text-sm");
  });

  it("applies primary variant classes", () => {
    render(<GlassButton variant="primary">Primary</GlassButton>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("glass-btn-primary");
  });

  it("applies danger variant classes", () => {
    render(<GlassButton variant="danger">Danger</GlassButton>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("glass-btn-danger");
  });

  it("applies small size classes", () => {
    render(<GlassButton size="sm">Small</GlassButton>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("px-3", "py-1", "text-xs");
  });

  it("applies large size classes", () => {
    render(<GlassButton size="lg">Large</GlassButton>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("px-6", "py-2.5", "text-base");
  });

  it("calls onClick handler when clicked", () => {
    const handleClick = vi.fn();
    render(<GlassButton onClick={handleClick}>Click</GlassButton>);
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("can be disabled", () => {
    const handleClick = vi.fn();
    render(
      <GlassButton onClick={handleClick} disabled>
        Disabled
      </GlassButton>
    );
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("passes through additional props", () => {
    render(
      <GlassButton aria-label="Custom label" data-testid="custom-button">
        Custom
      </GlassButton>
    );
    const button = screen.getByTestId("custom-button");
    expect(button).toHaveAttribute("aria-label", "Custom label");
  });

  it("applies custom className", () => {
    render(<GlassButton className="custom-class">Custom</GlassButton>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("custom-class");
  });
});
