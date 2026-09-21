"use client";

import { Moon, Sun } from "lucide-react";
import { useI18n } from "@/features/i18n";
import { useTheme } from "../hooks/useTheme";

export function ThemePreference() {
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();

  return (
    <div className="theme-choice" role="radiogroup" aria-label={t("theme.group")}>
      <button
        type="button"
        role="radio"
        aria-checked={theme === "light"}
        className={theme === "light" ? "selected" : ""}
        onClick={() => setTheme("light")}
      >
        <Sun size={16} aria-hidden="true" />
        <span>
          <strong>{t("theme.light")}</strong>
          <small>{t("theme.lightHint")}</small>
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
          <strong>{t("theme.dark")}</strong>
          <small>{t("theme.darkHint")}</small>
        </span>
      </button>
    </div>
  );
}
