import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";

type Theme = "auto" | "light" | "dark";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "auto";
    return (document.documentElement.dataset.theme as Theme) || "auto";
  });

  useEffect(() => {
    api.getConfig().then((config) => {
      if (config.theme) {
        setThemeState(config.theme as Theme);
        if (config.theme === "auto") {
          document.documentElement.removeAttribute("data-theme");
        } else {
          document.documentElement.dataset.theme = config.theme;
        }
      }
    }).catch(() => {});
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    if (newTheme === "auto") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.dataset.theme = newTheme;
    }
    api.updateConfig({ theme: newTheme }).catch(() => {});
  }, []);

  return { theme, setTheme };
}
