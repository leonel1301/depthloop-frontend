"use client";

import { useState } from "react";
import { Check, ChevronDown, Database, Eye, EyeOff, FileJson, LoaderCircle, LockKeyhole } from "lucide-react";
import type { DbConnectionConfig, SchemaSnapshot, SourceKind } from "../models/ontology";
import { EXAMPLE_SCHEMA_TEXT } from "../services/schemaExample";

export type IntakeMode = "database" | "service" | "schema";

type Props = {
  onSubmitConnection: (config: DbConnectionConfig, engine?: string) => Promise<void>;
  onSubmitSchema: (snapshot: SchemaSnapshot) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  initialMode?: IntakeMode;
};

const engines = [
  { value: "postgres", label: "PostgreSQL", mark: "Pg", hint: "Más habitual en analítica" },
  { value: "mysql", label: "MySQL", mark: "My", hint: "Apps y CMS" },
  { value: "sqlserver", label: "SQL Server", mark: "MS", hint: "Entornos corporativos" },
];

function parseSnapshot(raw: string): SchemaSnapshot {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("El JSON no es válido. Revisa comas y comillas.");
  }
  if (!parsed || typeof parsed !== "object") throw new Error("El schema debe ser un objeto JSON.");
  const snapshot = parsed as SchemaSnapshot;
  if (!snapshot.source?.name || !snapshot.source?.engine) {
    throw new Error("Falta source.name o source.engine.");
  }
  if (!Array.isArray(snapshot.schemas) || snapshot.schemas.length === 0) {
    throw new Error("El schema debe incluir al menos un namespace en schemas.");
  }
  return snapshot;
}

export function DbConnector({ onSubmitConnection, onSubmitSchema, isLoading, error, initialMode = "schema" }: Props) {
  const [mode, setMode] = useState<IntakeMode>(initialMode);
  const [engine, setEngine] = useState("postgres");
  const [showPassword, setShowPassword] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [schemaText, setSchemaText] = useState(EXAMPLE_SCHEMA_TEXT);
  const [localError, setLocalError] = useState<string | null>(null);
  const [form, setForm] = useState({
    host: "",
    port: "5432",
    user: "",
    password: "",
    database: "postgres",
    serviceUrl: "",
    apiKey: "",
    ssl: true,
  });
  const update = (key: "host" | "port" | "user" | "password" | "database" | "serviceUrl" | "apiKey", value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  const selectedEngine = engines.find((item) => item.value === engine) ?? engines[0];
  const visibleError = localError || error;

  const readFile = async (file: File) => {
    const text = await file.text();
    setSchemaText(text);
    setLocalError(null);
  };

  return (
    <form
      className="connector-form"
      onSubmit={(event) => {
        event.preventDefault();
        setLocalError(null);
        if (mode === "schema") {
          try {
            void onSubmitSchema(parseSnapshot(schemaText));
          } catch (err) {
            setLocalError(err instanceof Error ? err.message : "No pudimos leer el schema.");
          }
          return;
        }
        void onSubmitConnection({
          ...form,
          port: Number(form.port),
          kind: mode as SourceKind,
          database: mode === "service" ? form.serviceUrl : form.database,
          ssl: form.ssl,
        }, selectedEngine.label);
      }}
    >
      <div className="segmented three" role="tablist" aria-label="Cómo entra la fuente">
        <button type="button" role="tab" aria-selected={mode === "database"} className={mode === "database" ? "selected" : ""} onClick={() => { setMode("database"); setLocalError(null); }}>
          <Database size={14} /> Base
        </button>
        <button type="button" role="tab" aria-selected={mode === "service"} className={mode === "service" ? "selected" : ""} onClick={() => { setMode("service"); setLocalError(null); }}>
          API
        </button>
        <button type="button" role="tab" aria-selected={mode === "schema"} className={mode === "schema" ? "selected" : ""} onClick={() => { setMode("schema"); setLocalError(null); }}>
          <FileJson size={14} /> Schema
        </button>
      </div>

      {mode === "database" ? (
        <>
          <fieldset className="form-block">
            <legend>Motor</legend>
            <div className="engine-grid" role="radiogroup" aria-label="Motor de base de datos">
              {engines.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  role="radio"
                  aria-checked={engine === item.value}
                  className={`engine-card ${engine === item.value ? "selected" : ""}`}
                  onClick={() => setEngine(item.value)}
                >
                  <span className="engine-mark">{item.mark}</span>
                  <strong>{item.label}</strong>
                  <small>{item.hint}</small>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="form-block">
            <legend>Dónde está la base</legend>
            <div className="field-row host-row">
              <div className="field-grow">
                <label htmlFor="host">Host</label>
                <input id="host" value={form.host} onChange={(e) => update("host", e.target.value)} autoComplete="off" required={mode === "database"} placeholder="aws-1-us-west-1.pooler.supabase.com" />
              </div>
              <div className="field-port">
                <label htmlFor="port">Puerto</label>
                <input id="port" inputMode="numeric" value={form.port} onChange={(e) => update("port", e.target.value)} required={mode === "database"} />
              </div>
            </div>
            <label htmlFor="database">Nombre de la base</label>
            <input id="database" value={form.database} onChange={(e) => update("database", e.target.value)} required={mode === "database"} />
            <label className="check-line">
              <input type="checkbox" checked={form.ssl} onChange={(event) => setForm((current) => ({ ...current, ssl: event.target.checked }))} />
              SSL (requerido en Supabase)
            </label>
          </fieldset>

          <fieldset className="form-block">
            <legend>Acceso de solo lectura</legend>
            <div className="field-row">
              <div className="field-grow">
                <label htmlFor="user">Usuario</label>
                <input id="user" value={form.user} onChange={(e) => update("user", e.target.value)} autoComplete="username" required={mode === "database"} placeholder="postgres.abcdxyz" />
              </div>
              <div className="field-grow">
                <label htmlFor="password">Contraseña</label>
                <div className="password-field">
                  <input id="password" type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => update("password", e.target.value)} autoComplete="current-password" required={mode === "database"} />
                  <button type="button" className="icon-button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                </div>
              </div>
            </div>
          </fieldset>
          <p className="security-note">Si el host es el pooler, el usuario es postgres.tu-project-ref, no solo postgres. Puerto 6543 (transaction) o 5432 (session).</p>
        </>
      ) : null}

      {mode === "service" ? (
        <fieldset className="form-block">
          <legend>Endpoint</legend>
          <label htmlFor="serviceUrl">URL del servicio</label>
          <input id="serviceUrl" value={form.serviceUrl} onChange={(e) => update("serviceUrl", e.target.value)} placeholder="https://" required={mode === "service"} />
          <label htmlFor="apiKey">Token o API key</label>
          <div className="password-field">
            <input id="apiKey" type={showPassword ? "text" : "password"} value={form.apiKey} onChange={(e) => update("apiKey", e.target.value)} />
            <button type="button" className="icon-button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar secreto" : "Mostrar secreto"}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
          </div>
          <p className="security-note">El conector de API aún no ejecuta consultas. Para Inferir usa una base PostgreSQL.</p>
        </fieldset>
      ) : null}

      {mode === "schema" ? (
        <fieldset className="form-block">
          <legend>Snapshot del schema</legend>
          <p className="section-copy">Es el JSON que recibe <code>POST /api/ontology/discover</code>: source, schemas, tablas, columnas y foreign keys. Sin filas.</p>
          <label className="file-pick" htmlFor="schema-file">Cargar archivo .json</label>
          <input id="schema-file" className="file-input" type="file" accept="application/json,.json" onChange={(event) => { const file = event.target.files?.[0]; if (file) void readFile(file); }} />
          <label htmlFor="schema-json">JSON</label>
          <textarea
            id="schema-json"
            className="schema-editor"
            value={schemaText}
            onChange={(event) => setSchemaText(event.target.value)}
            spellCheck={false}
            required={mode === "schema"}
          />
        </fieldset>
      ) : null}

      {mode !== "schema" ? (
        <>
          <button type="button" className="advanced-toggle" onClick={() => setAdvanced((value) => !value)}><ChevronDown className={advanced ? "rotate" : ""} size={15} /> Opciones de conexión</button>
          {advanced && <div className="advanced-box"><Check size={14} /> SSL activo · timeout 30 s · schema público · solo lectura</div>}
        </>
      ) : null}
      {visibleError ? <p className="form-error" role="alert">{visibleError}</p> : null}
      <button className="primary-button" type="submit" disabled={isLoading}>
        {isLoading ? <><LoaderCircle className="spin" size={17} /> Leyendo tablas…</> : mode === "schema" ? "Analizar schema" : "Conectar y leer tablas"}
      </button>
      <p className="security-note"><LockKeyhole size={14} /><span>Solo lectura. El API no guarda la contraseña; en el navegador dura esta sesión, para Inferir.</span></p>
    </form>
  );
}
