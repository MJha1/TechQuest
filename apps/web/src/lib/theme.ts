export type Theme = "light" | "dark";

const STORAGE_KEY = "techquest.theme";

/** The persisted choice, or null if the viewer hasn't picked one. */
export function getStoredTheme(): Theme | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

/** Dark-first: use the stored choice if any, otherwise default to dark. */
export function resolveInitialTheme(): Theme {
  return getStoredTheme() ?? "dark";
}

/** Reflect a theme on the document (adds/removes the `.dark` class). */
export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

/** Apply a theme and remember it for next time. */
export function setTheme(theme: Theme): void {
  applyTheme(theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* storage unavailable (private mode) — in-memory only for this session */
  }
}

/** Read the theme currently reflected on the document. */
export function currentTheme(): Theme {
  return typeof document !== "undefined" && document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";
}
