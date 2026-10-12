"use client";

import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setTheme, selectTheme } from "../store/themeSlice";
import { ThemeProvider as StyledThemeProvider } from "styled-components";
import { lightTheme, darkTheme } from "../styles/theme";

export default function ThemeWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useDispatch();
  const theme = useSelector(selectTheme);
  const selectedTheme = theme === "dark" ? darkTheme : lightTheme;
  // Prevents the sync effect from overwriting localStorage with the Redux
  // initial value ("light") before the hydration dispatch is processed.
  const skipSyncRef = useRef(false);

  // Hydrate theme from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    if (saved === "light" || saved === "dark") {
      skipSyncRef.current = true;
      dispatch(setTheme(saved));
      document.body.className = saved;
    }
  }, [dispatch]);

  // Sync Redux theme to localStorage and body class on every change.
  // Skips the first run when a saved value was just dispatched — localStorage
  // already holds the correct value and the re-render will carry the right theme.
  useEffect(() => {
    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }
    localStorage.setItem("theme", theme);
    document.body.className = theme;
  }, [theme]);

  return (
    <StyledThemeProvider theme={selectedTheme}>{children}</StyledThemeProvider>
  );
}
