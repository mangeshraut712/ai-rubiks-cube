export const THEME_STORAGE_KEY = "cubey-theme";

export const THEME_META_COLORS = {
  light: "#f6f9fe",
  dark: "#07111f"
};

export function syncDocumentTheme(theme, highContrast) {
  if (typeof document === "undefined") {
    return;
  }

  const normalizedTheme = theme === "dark" ? "dark" : "light";
  const root = document.documentElement;
  const themeMeta = document.querySelector('meta[name="theme-color"]');

  root.classList.toggle("dark", normalizedTheme === "dark");
  root.classList.toggle("high-contrast", Boolean(highContrast));
  root.dataset.theme = normalizedTheme;
  root.style.colorScheme = normalizedTheme;

  if (themeMeta) {
    themeMeta.setAttribute("content", THEME_META_COLORS[normalizedTheme]);
  }

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, normalizedTheme);
  } catch (_error) {
    // Ignore storage failures in restricted environments.
  }
}
