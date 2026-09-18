"use client";

import { FormEvent, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import Image from "next/image";
import { COMPANY_SIZES, COUNTRIES, INDUSTRIES } from "../catalog";
import { authApi } from "../services/authApi";
import type { AuthSession } from "../services/sessionStore";
import { AuthMap } from "./AuthMap";

type Mode = "register" | "login";

type Props = {
  onAuthed: (session: AuthSession) => void;
};

export function AuthScreen({ onAuthed }: Props) {
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
      const session =
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
      onAuthed(session);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo continuar.");
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
              <Image src="/depthloop-icon-v2.png" alt="" width={30} height={30} unoptimized />
            </span>
            <span className="auth-wordmark">DepthLoop</span>
          </div>
        </div>
        <div className="auth-story-copy">
          <span className="auth-story-kicker"><i /> Una visión compartida</span>
          <h1>Tu empresa, conectada en un solo mapa.</h1>
          <p>
            Reúne la información de tus sistemas, confirma qué significa y trabaja con un contexto que todo el equipo entiende.
          </p>
          <ul>
            <li>
              <span><Check size={13} /></span>
              <div><strong>Conecta</strong> Integra tus fuentes sin modificar sus datos.</div>
            </li>
            <li>
              <span><Check size={13} /></span>
              <div><strong>Confirma</strong> Revisa conceptos y reglas junto a tu equipo.</div>
            </li>
            <li>
              <span><Check size={13} /></span>
              <div><strong>Decide</strong> Encuentra respuestas con una visión confiable.</div>
            </li>
          </ul>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-panel-inner">
          <div className={`auth-mode-switch auth-mode-${mode}`} role="tablist" aria-label="Acceso a DepthLoop">
            <span className="auth-mode-indicator" aria-hidden="true" />
            <button type="button" role="tab" aria-selected={mode === "register"} onClick={() => changeMode("register")}>
              Crear cuenta
            </button>
            <button type="button" role="tab" aria-selected={mode === "login"} onClick={() => changeMode("login")}>
              Iniciar sesión
            </button>
          </div>

          <div key={`${mode}-${registerStep}`} className="auth-form-stage">
            <div className="auth-panel-heading">
              <span className="auth-panel-icon"><LockKeyhole size={18} /></span>
              <div>
                <h2>
                  {mode === "login"
                    ? "Qué bueno verte de nuevo"
                    : registerStep === 1
                      ? "Crea tu espacio de trabajo"
                      : "Cuéntanos sobre tu empresa"}
                </h2>
                <p className="auth-lead">
                  {mode === "login"
                    ? "Ingresa para continuar donde lo dejaste."
                    : registerStep === 1
                      ? "Empieza con tus datos de acceso."
                      : "Usaremos esta información para preparar tu espacio."}
                </p>
              </div>
            </div>

            {mode === "register" ? (
              <div className="auth-progress" aria-label={`Paso ${registerStep} de 2`}>
                <span className="auth-progress-label">Paso {registerStep} de 2</span>
                <span className="auth-progress-track"><i style={{ width: registerStep === 1 ? "50%" : "100%" }} /></span>
              </div>
            ) : null}

            <form className="auth-form connector-form" onSubmit={(event) => void submit(event)}>
              {mode === "register" && registerStep === 1 ? (
                <>
                  <label className="field-grow">
                    Nombre completo
                    <input
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      autoComplete="name"
                      placeholder="Tu nombre"
                      autoFocus
                      required
                    />
                  </label>
                  <label className="field-grow">
                    Correo de trabajo
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                      placeholder="tu@empresa.com"
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
                    hint="Mínimo 8 caracteres"
                  />
                </>
              ) : null}

              {mode === "register" && registerStep === 2 ? (
                <>
                  <label className="field-grow">
                    Empresa
                    <input
                      value={businessName}
                      onChange={(event) => setBusinessName(event.target.value)}
                      autoComplete="organization"
                      placeholder="Nombre de tu empresa"
                      autoFocus
                      required
                    />
                  </label>
                  <label className="field-grow">
                    ¿A qué se dedica tu empresa?
                    <textarea
                      value={activity}
                      onChange={(event) => setActivity(event.target.value)}
                      rows={3}
                      minLength={8}
                      required
                      placeholder="Cuéntanos brevemente qué hace."
                    />
                  </label>
                  <div className="field-row">
                    <label className="field-grow">
                      Industria
                      <select value={industry} onChange={(event) => setIndustry(event.target.value)}>
                        {INDUSTRIES.map((item) => <option key={item} value={item}>{item}</option>)}
                      </select>
                    </label>
                    <label className="field-grow">
                      País o región
                      <select value={country} onChange={(event) => setCountry(event.target.value)}>
                        {COUNTRIES.map((item) => <option key={item} value={item}>{item}</option>)}
                      </select>
                    </label>
                  </div>
                  <label className="field-grow">
                    Tamaño del equipo
                    <select value={companySize} onChange={(event) => setCompanySize(event.target.value)}>
                      {COMPANY_SIZES.map((item) => <option key={item} value={item}>{item} personas</option>)}
                    </select>
                  </label>
                </>
              ) : null}

              {mode === "login" ? (
                <>
                  <label className="field-grow">
                    Correo
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                      placeholder="tu@empresa.com"
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
                    <ArrowLeft size={15} /> Atrás
                  </button>
                ) : null}
                <button type="submit" className="primary-button auth-submit" disabled={loading}>
                  {loading ? (
                    <><LoaderCircle size={15} className="auth-spinner" /> Preparando tu espacio…</>
                  ) : mode === "login" ? (
                    <>Iniciar sesión <ArrowRight size={15} /></>
                  ) : registerStep === 1 ? (
                    <>Continuar <ArrowRight size={15} /></>
                  ) : (
                    <>Crear espacio <ArrowRight size={15} /></>
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
  return (
    <label className="field-grow">
      Contraseña
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
        <button type="button" onClick={onToggle} aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}>
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </span>
      {hint ? <small className={value.length >= minLength ? "is-valid" : ""}><Check size={11} /> {hint}</small> : null}
    </label>
  );
}
