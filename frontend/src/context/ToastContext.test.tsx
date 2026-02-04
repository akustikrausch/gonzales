import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { ToastProvider, useToast, useToastActions } from "./ToastContext";
import type { ReactNode } from "react";

const wrapper = ({ children }: { children: ReactNode }) => (
  <ToastProvider>{children}</ToastProvider>
);

describe("ToastContext", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("useToast", () => {
    it("throws error when used outside provider", () => {
      expect(() => {
        renderHook(() => useToast());
      }).toThrow("useToast must be used within ToastProvider");
    });

    it("returns empty toasts array initially", () => {
      const { result } = renderHook(() => useToast(), { wrapper });
      expect(result.current.toasts).toEqual([]);
    });

    it("adds a toast with addToast", () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.addToast({ type: "success", message: "Test message" });
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]).toMatchObject({
        type: "success",
        message: "Test message",
      });
      expect(result.current.toasts[0].id).toBeDefined();
    });

    it("removes a toast with removeToast", () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      let toastId: string;
      act(() => {
        toastId = result.current.addToast({
          type: "info",
          message: "Test",
          duration: 0,
        });
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        result.current.removeToast(toastId);
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it("clears all toasts with clearAll", () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.addToast({ type: "success", message: "One", duration: 0 });
        result.current.addToast({ type: "error", message: "Two", duration: 0 });
        result.current.addToast({ type: "warning", message: "Three", duration: 0 });
      });

      expect(result.current.toasts).toHaveLength(3);

      act(() => {
        result.current.clearAll();
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it("auto-removes toast after default duration", async () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.addToast({ type: "success", message: "Auto remove" });
      });

      expect(result.current.toasts).toHaveLength(1);

      // Default duration is 5000ms
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it("respects custom duration", () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.addToast({
          type: "success",
          message: "Short duration",
          duration: 1000,
        });
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it("does not auto-remove when duration is 0", () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.addToast({
          type: "success",
          message: "Persistent",
          duration: 0,
        });
      });

      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(result.current.toasts).toHaveLength(1);
    });
  });

  describe("useToastActions", () => {
    it("provides success helper", () => {
      const { result } = renderHook(
        () => {
          const actions = useToastActions();
          const toast = useToast();
          return { actions, toast };
        },
        { wrapper }
      );

      act(() => {
        result.current.actions.success("Success!");
      });

      expect(result.current.toast.toasts[0]).toMatchObject({
        type: "success",
        message: "Success!",
      });
    });

    it("provides error helper", () => {
      const { result } = renderHook(
        () => {
          const actions = useToastActions();
          const toast = useToast();
          return { actions, toast };
        },
        { wrapper }
      );

      act(() => {
        result.current.actions.error("Error!");
      });

      expect(result.current.toast.toasts[0]).toMatchObject({
        type: "error",
        message: "Error!",
      });
    });

    it("provides warning helper", () => {
      const { result } = renderHook(
        () => {
          const actions = useToastActions();
          const toast = useToast();
          return { actions, toast };
        },
        { wrapper }
      );

      act(() => {
        result.current.actions.warning("Warning!");
      });

      expect(result.current.toast.toasts[0]).toMatchObject({
        type: "warning",
        message: "Warning!",
      });
    });

    it("provides info helper", () => {
      const { result } = renderHook(
        () => {
          const actions = useToastActions();
          const toast = useToast();
          return { actions, toast };
        },
        { wrapper }
      );

      act(() => {
        result.current.actions.info("Info!");
      });

      expect(result.current.toast.toasts[0]).toMatchObject({
        type: "info",
        message: "Info!",
      });
    });
  });
});
