"use client";

import { FormEvent, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import Image from "next/image";
import { countryLabel, industryLabel, sizeLabel, useI18n } from "@/features/i18n";
import { COMPANY_SIZES, COUNTRIES, INDUSTRIES } from "../catalog";
import { authApi } from "../services/authApi";
import type { AuthSession } from "../services/sessionStore";
import { AuthMap } from "./AuthMap";

type Mode = "register" | "login";

type Props = {
  onAuthed: (session: AuthSession) => void;
};

export function AuthScreen({ onAuthed }: Props) {
  const { t, locale, setLocale } = useI18n();
  const [mode, setMode] = useState<Mode>("register");
  const [registerStep, setRegisterStep] = useState<1 | 2>(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [activity, setActivity] = useState("");
  const [industry, setIndustry] = useState<string>(INDUSTRIES[0]);
  const [country, setCountry] = useState("México");
  const [companySize, setCompanySize] = useState<string>(COMPANY_SIZES[1]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (mode === "register" && registerStep === 1) {
      const form = event.currentTarget as HTMLFormElement;
      if (!form.reportValidity()) return;
      setError(null);
      setRegisterStep(2);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      let session =
        mode === "login"
          ? await authApi.login({ email, password })
          : await authApi.register({
              email,
              password,
              fullName,
              businessName,
              activity,
              industry,
              country,
              companySize,
            });
      if (mode === "register" && locale !== "es") {
        session = await authApi.updateMe(session.token, { language: locale });
      }
      onAuthed(session);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("auth.fallbackError"));
    } finally {
      setLoading(false);
    }
  };

  const changeMode = (nextMode: Mode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    setRegisterStep(1);
    setError(null);
    setPassword("");
    setShowPassword(false);
  };

  return (
    <main className="auth-shell">
      <section className="auth-story">
        <AuthMap />
        <div className="auth-story-bar">
          <div className="auth-brand">
            <span className="brand-symbol" aria-hidden="true">
              <Image src="/nuudo-icon.png" alt="" width={30} height={30} unoptimized />
            </span>
            <span className="auth-wordmark">Nuudo</span>
          </div>
          <div className="auth-locale" role="group" aria-label={t("language.group")}>
            <button type="button" aria-pressed={locale === "es"} onClick={() => setLocale("es")}>ES</button>
            <button type="button" aria-pressed={locale === "en"} onClick={() => setLocale("en")}>EN</button>
          </div>
        </div>
        <div className="auth-story-copy">
          <span className="auth-story-kicker"><i /> {t("auth.kicker")}</span>
          <h1>{t("auth.title")}</h1>
          <p>
            {t("auth.lead")}
          </p>
          <ul>
            <li>
              <span><Check size={13} /></span>
              <div><strong>{t("auth.connect")}</strong> {t("auth.connectHint")}</div>
            </li>
            <li>
              <span><Check size={13} /></span>
              <div><strong>{t("auth.confirm")}</strong> {t("auth.confirmHint")}</div>
            </li>
            <li>
              <span><Check size={13} /></span>
              <div><strong>{t("auth.decide")}</strong> {t("auth.decideHint")}</div>
            </li>
          </ul>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-panel-inner">
          <div className={`auth-mode-switch auth-mode-${mode}`} role="tablist" aria-label={t("auth.access")}>
            <span className="auth-mode-indicator" aria-hidden="true" />
            <button type="button" role="tab" aria-selected={mode === "register"} onClick={() => changeMode("register")}>
              {t("auth.createAccount")}
            </button>
            <button type="button" role="tab" aria-selected={mode === "login"} onClick={() => changeMode("login")}>
              {t("auth.signIn")}
            </button>
          </div>

          <div key={`${mode}-${registerStep}`} className="auth-form-stage">
            <div className="auth-panel-heading">
              <span className="auth-panel-icon"><LockKeyhole size={18} /></span>
              <div>
                <h2>
                  {mode === "login"
                    ? t("auth.loginTitle")
                    : registerStep === 1
                      ? t("auth.registerTitle")
                      : t("auth.companyTitle")}
                </h2>
                <p className="auth-lead">
                  {mode === "login"
                    ? t("auth.loginLead")
                    : registerStep === 1
                      ? t("auth.registerLead")
                      : t("auth.companyLead")}
                </p>
              </div>
            </div>

            {mode === "register" ? (
              <div className="auth-progress" aria-label={t("auth.stepOf", { step: registerStep })}>
                <span className="auth-progress-label">{t("auth.stepOf", { step: registerStep })}</span>
                <span className="auth-progress-track"><i style={{ width: registerStep === 1 ? "50%" : "100%" }} /></span>
              </div>
            ) : null}

            <form className="auth-form connector-form" onSubmit={(event) => void submit(event)}>
              {mode === "register" && registerStep === 1 ? (
                <>
                  <label className="field-grow">
                    {t("auth.fullName")}
                    <input
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      autoComplete="name"
                      placeholder={t("auth.fullNamePlaceholder")}
                      autoFocus
                      required
                    />
                  </label>
                  <label className="field-grow">
                    {t("auth.workEmail")}
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                      placeholder={t("auth.emailPlaceholder")}
                      required
                    />
                  </label>
                  <PasswordField
                    value={password}
                    show={showPassword}
                    onChange={setPassword}
                    onToggle={() => setShowPassword((value) => !value)}
                    autoComplete="new-password"
                    minLength={8}
                    hint={t("auth.passwordHint")}
                  />
                </>
              ) : null}

              {mode === "register" && registerStep === 2 ? (
                <>
                  <label className="field-grow">
                    {t("auth.company")}
                    <input
                      value={businessName}
                      onChange={(event) => setBusinessName(event.target.value)}
                      autoComplete="organization"
                      placeholder={t("auth.companyPlaceholder")}
                      autoFocus
                      required
                    />
                  </label>
                  <label className="field-grow">
                    {t("auth.activity")}
                    <textarea
                      value={activity}
                      onChange={(event) => setActivity(event.target.value)}
                      rows={3}
                      minLength={8}
                      required
                      placeholder={t("auth.activityPlaceholder")}
                    />
                  </label>
                  <div className="field-row">
                    <label className="field-grow">
                      {t("auth.industry")}
                      <select value={industry} onChange={(event) => setIndustry(event.target.value)}>
                        {INDUSTRIES.map((item) => (
                          <option key={item} value={item}>{industryLabel(locale, item)}</option>
                        ))}
                      </select>
                    </label>
                    <label className="field-grow">
                      {t("auth.country")}
                      <select value={country} onChange={(event) => setCountry(event.target.value)}>
                        {COUNTRIES.map((item) => (
                          <option key={item} value={item}>{countryLabel(locale, item)}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className="field-grow">
                    {t("auth.teamSize")}
                    <select value={companySize} onChange={(event) => setCompanySize(event.target.value)}>
                      {COMPANY_SIZES.map((item) => (
                        <option key={item} value={item}>{t("auth.people", { size: sizeLabel(locale, item) })}</option>
                      ))}
                    </select>
                  </label>
                </>
              ) : null}

              {mode === "login" ? (
                <>
                  <label className="field-grow">
                    {t("auth.email")}
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                      placeholder={t("auth.emailPlaceholder")}
                      autoFocus
                      required
                    />
                  </label>
                  <PasswordField
                    value={password}
                    show={showPassword}
                    onChange={setPassword}
                    onToggle={() => setShowPassword((value) => !value)}
                    autoComplete="current-password"
                  />
                </>
              ) : null}

              {error ? <p className="auth-error" role="alert">{error}</p> : null}

              <div className="auth-actions">
                {mode === "register" && registerStep === 2 ? (
                  <button type="button" className="auth-back" onClick={() => { setRegisterStep(1); setError(null); }}>
                    <ArrowLeft size={15} /> {t("auth.back")}
                  </button>
                ) : null}
                <button type="submit" className="primary-button auth-submit" disabled={loading}>
                  {loading ? (
                    <><LoaderCircle size={15} className="auth-spinner" /> {t("auth.preparing")}</>
                  ) : mode === "login" ? (
                    <>{t("auth.signIn")} <ArrowRight size={15} /></>
                  ) : registerStep === 1 ? (
                    <>{t("auth.continue")} <ArrowRight size={15} /></>
                  ) : (
                    <>{t("auth.createWorkspace")} <ArrowRight size={15} /></>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        <footer className="auth-powered">
          Powered by{" "}
          <a href="https://lenaralabs.com/" target="_blank" rel="noopener noreferrer">
            Lenara Labs
          </a>
        </footer>
      </section>
    </main>
  );
}

function PasswordField({
  value,
  show,
  onChange,
  onToggle,
  autoComplete,
  minLength = 1,
  hint,
}: {
  value: string;
  show: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
  autoComplete: "new-password" | "current-password";
  minLength?: number;
  hint?: string;
}) {
  const { t } = useI18n();
  return (
    <label className="field-grow">
      {t("auth.password")}
      <span className="auth-password-field">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          placeholder="••••••••"
          minLength={minLength}
          required
        />
        <button type="button" onClick={onToggle} aria-label={show ? t("auth.hidePassword") : t("auth.showPassword")}>
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </span>
      {hint ? <small className={value.length >= minLength ? "is-valid" : ""}><Check size={11} /> {hint}</small> : null}
    </label>
  );
}
