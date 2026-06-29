import { createContext, useCallback, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
type ThemeMode = "auto" | "manual";

interface Daylight {
  sunriseMin: number; // minutes after midnight, in `timezone`
  sunsetMin: number;
  timezone: string;
}

interface ThemeContextType {
  theme: Theme;
  mode: ThemeMode;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  /** Re-enable automatic day/night switching based on the local clock. */
  useAutoTheme: () => void;
  /** Feed the day's real sunrise/sunset so auto mode flips at the actual horizon. */
  setDaylight: (sunrise: string, sunset: string, timezone: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/** Parse "HH:MM" (24h) or "h:mm AM/PM" into minutes after midnight. */
function parseTimeToMinutes(value: string): number | null {
  if (!value) return null;
  const m = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) return null;
  let hours = parseInt(m[1], 10);
  const minutes = parseInt(m[2], 10);
  const period = m[3]?.toUpperCase();
  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** Current minutes-after-midnight in a given IANA timezone (caller's clock if it fails). */
function nowMinutesInTimezone(timezone?: string): number {
  const now = new Date();
  if (timezone) {
    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).formatToParts(now);
      const h = parts.find((p) => p.type === "hour")?.value;
      const min = parts.find((p) => p.type === "minute")?.value;
      if (h != null && min != null) {
        let hh = parseInt(h, 10);
        if (hh === 24) hh = 0; // some engines emit "24" for midnight
        return hh * 60 + parseInt(min, 10);
      }
    } catch {
      /* fall through to local clock */
    }
  }
  return now.getHours() * 60 + now.getMinutes();
}

/**
 * Resolve the auto theme: daytime is between the real sunrise and sunset when
 * we have them, otherwise a simple 6:00am–6:00pm local fallback.
 */
function autoTheme(daylight: Daylight | null): Theme {
  if (daylight && daylight.sunsetMin > daylight.sunriseMin) {
    const now = nowMinutesInTimezone(daylight.timezone);
    return now >= daylight.sunriseMin && now < daylight.sunsetMin ? "light" : "dark";
  }
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? "light" : "dark";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "auto";
    return (localStorage.getItem("theme-mode") as ThemeMode) || "auto";
  });

  const [daylight, setDaylightState] = useState<Daylight | null>(null);

  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    const storedMode = (localStorage.getItem("theme-mode") as ThemeMode) || "auto";
    if (storedMode === "manual") {
      const stored = localStorage.getItem("theme") as Theme | null;
      if (stored === "light" || stored === "dark") return stored;
    }
    return autoTheme(null);
  });

  // Apply the resolved theme to <html> and persist it (avoids a flash on reload).
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("theme-mode", mode);
  }, [mode]);

  // While in auto mode, recompute now and periodically so the theme flips at
  // sunrise/sunset even if the app stays open across the boundary. Re-runs
  // whenever fresh daylight data arrives.
  useEffect(() => {
    if (mode !== "auto") return;
    setThemeState(autoTheme(daylight));
    const id = window.setInterval(() => setThemeState(autoTheme(daylight)), 5 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [mode, daylight]);

  const setDaylight = useCallback((sunrise: string, sunset: string, timezone: string) => {
    const sunriseMin = parseTimeToMinutes(sunrise);
    const sunsetMin = parseTimeToMinutes(sunset);
    if (sunriseMin == null || sunsetMin == null) return;
    setDaylightState((prev) =>
      prev && prev.sunriseMin === sunriseMin && prev.sunsetMin === sunsetMin && prev.timezone === timezone
        ? prev
        : { sunriseMin, sunsetMin, timezone },
    );
  }, []);

  const setTheme = (next: Theme) => {
    setMode("manual");
    setThemeState(next);
  };

  const toggleTheme = () => {
    setMode("manual");
    setThemeState((prev) => (prev === "light" ? "dark" : "light"));
  };

  const useAutoTheme = () => {
    setMode("auto");
    setThemeState(autoTheme(daylight));
  };

  return (
    <ThemeContext.Provider value={{ theme, mode, setTheme, toggleTheme, useAutoTheme, setDaylight }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
