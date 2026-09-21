"use client";

import { useState } from "react";
import { Languages } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { authApi } from "@/features/auth/services/authApi";
import { useI18n, type Locale } from "@/features/i18n";

export function LanguagePreference() {
  const { locale, setLocale, t } = useI18n();
  const { session, updateSession } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const choose = async (next: Locale) => {
    if (next === locale || saving) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await authApi.updateMe(session.token, { language: next });
      updateSession(updated);
      setLocale(updated.user.language ?? next);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("language.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-language">
      <div className="theme-choice" role="radiogroup" aria-label={t("language.group")} aria-busy={saving}>
        <button
          type="button"
          role="radio"
          aria-checked={locale === "es"}
          className={locale === "es" ? "selected" : ""}
          disabled={saving}
          onClick={() => void choose("es")}
        >
          <Languages size={16} aria-hidden="true" />
          <span>
            <strong>{t("language.es")}</strong>
            <small>{t("language.esHint")}</small>
          </span>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={locale === "en"}
          className={locale === "en" ? "selected" : ""}
          disabled={saving}
          onClick={() => void choose("en")}
        >
          <Languages size={16} aria-hidden="true" />
          <span>
            <strong>{t("language.en")}</strong>
            <small>{t("language.enHint")}</small>
          </span>
        </button>
      </div>
      {saving ? <p className="muted-copy">{t("language.saving")}</p> : null}
      {error ? <p className="form-error" role="alert">{error}</p> : null}
    </div>
  );
}
