"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "../hooks/useTheme";

export function ThemePreference() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="theme-choice" role="radiogroup" aria-label="Tema de la interfaz">
      <button
        type="button"
        role="radio"
        aria-checked={theme === "light"}
        className={theme === "light" ? "selected" : ""}
        onClick={() => setTheme("light")}
      >
        <Sun size={16} aria-hidden="true" />
        <span>
          <strong>Claro</strong>
          <small>Fondo claro</small>
        </span>
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={theme === "dark"}
        className={theme === "dark" ? "selected" : ""}
        onClick={() => setTheme("dark")}
      >
        <Moon size={16} aria-hidden="true" />
        <span>
          <strong>Oscuro</strong>
          <small>Fondo oscuro</small>
        </span>
      </button>
    </div>
  );
}
