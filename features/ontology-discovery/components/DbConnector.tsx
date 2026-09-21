"use client";

import { useState } from "react";
import { Check, ChevronDown, Database, Eye, EyeOff, FileJson, LoaderCircle, LockKeyhole } from "lucide-react";
import { useI18n, type MessageKey } from "@/features/i18n";
import type { DbConnectionConfig, SchemaSnapshot, SourceKind } from "../models/ontology";
import { EXAMPLE_SCHEMA_TEXT } from "../services/schemaExample";

export type IntakeMode = "database" | "service" | "schema";
export type ConnectionIntent = "connect" | "discover";

type InitialConnection = {
  host?: string;
  port?: number;
  user?: string;
  database?: string;
  serviceUrl?: string;
  ssl?: boolean;
  engine?: string;
  kind?: SourceKind;
};

type Props = {
  onSubmitConnection: (config: DbConnectionConfig, engine: string | undefined, intent: ConnectionIntent) => Promise<void>;
  onSubmitSchema: (snapshot: SchemaSnapshot) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  initialMode?: IntakeMode;
  reconnect?: boolean;
  initialConnection?: InitialConnection;
};

function parseSnapshot(raw: string, fail: (key: MessageKey) => string): SchemaSnapshot {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(fail("connector.invalidJson"));
  }
  if (!parsed || typeof parsed !== "object") throw new Error(fail("connector.schemaObject"));
  const snapshot = parsed as SchemaSnapshot;
  if (!snapshot.source?.name || !snapshot.source?.engine) {
    throw new Error(fail("connector.missingSource"));
  }
  if (!Array.isArray(snapshot.schemas) || snapshot.schemas.length === 0) {
    throw new Error(fail("connector.missingSchemas"));
  }
  return snapshot;
}

function engineValue(label?: string) {
  const value = (label || "").toLowerCase();
  if (value.includes("mysql")) return "mysql";
  if (value.includes("sql server") || value.includes("mssql")) return "sqlserver";
  return "postgres";
}

export function DbConnector({
  onSubmitConnection,
  onSubmitSchema,
  isLoading,
  error,
  initialMode = "schema",
  reconnect = false,
  initialConnection,
}: Props) {
  const { t } = useI18n();
  const engines = [
    { value: "postgres", label: "PostgreSQL", mark: "Pg", hint: t("connector.pgHint") },
    { value: "mysql", label: "MySQL", mark: "My", hint: t("connector.mysqlHint") },
    { value: "sqlserver", label: "SQL Server", mark: "MS", hint: t("connector.mssqlHint") },
  ];
  const [mode, setMode] = useState<IntakeMode>(initialConnection?.kind === "service" ? "service" : initialMode);
  const [engine, setEngine] = useState(engineValue(initialConnection?.engine));
  const [showPassword, setShowPassword] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [schemaText, setSchemaText] = useState(EXAMPLE_SCHEMA_TEXT);
  const [localError, setLocalError] = useState<string | null>(null);
  const [intent, setIntent] = useState<ConnectionIntent | "schema" | null>(null);
  const [form, setForm] = useState({
    host: initialConnection?.host ?? "",
    port: String(initialConnection?.port ?? "5432"),
    user: initialConnection?.user ?? "",
    password: "",
    database: initialConnection?.database || "postgres",
    serviceUrl: initialConnection?.serviceUrl ?? "",
    apiKey: "",
    ssl: initialConnection?.ssl ?? true,
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

  const submitConnection = async (nextIntent: ConnectionIntent) => {
    setLocalError(null);
    setIntent(nextIntent);
    try {
      await onSubmitConnection({
        ...form,
        port: Number(form.port),
        kind: mode as SourceKind,
        database: mode === "service" ? form.serviceUrl : form.database,
        ssl: form.ssl,
      }, selectedEngine.label, nextIntent);
    } finally {
      setIntent(null);
    }
  };

  return (
    <form
      className="connector-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setLocalError(null);
        if (mode === "schema") {
          setIntent("schema");
          try {
            await onSubmitSchema(parseSnapshot(schemaText, t));
          } catch (err) {
            setLocalError(err instanceof Error ? err.message : t("connector.schemaError"));
          } finally {
            setIntent(null);
          }
          return;
        }
        const submitter = (event.nativeEvent as SubmitEvent).submitter;
        const value = submitter instanceof HTMLButtonElement ? submitter.value : "";
        await submitConnection(value === "discover" ? "discover" : "connect");
      }}
    >
      {reconnect ? null : (
        <div className="segmented three" role="tablist" aria-label={t("connector.how")}>
          <button type="button" role="tab" aria-selected={mode === "database"} className={mode === "database" ? "selected" : ""} onClick={() => { setMode("database"); setLocalError(null); }}>
            <Database size={14} /> {t("connector.base")}
          </button>
          <button type="button" role="tab" aria-selected={mode === "service"} className={mode === "service" ? "selected" : ""} onClick={() => { setMode("service"); setLocalError(null); }}>
            API
          </button>
          <button type="button" role="tab" aria-selected={mode === "schema"} className={mode === "schema" ? "selected" : ""} onClick={() => { setMode("schema"); setLocalError(null); }}>
            <FileJson size={14} /> Schema
          </button>
        </div>
      )}

      {mode === "database" ? (
        <>
          <fieldset className="form-block">
            <legend>{t("connector.engine")}</legend>
            <div className="engine-grid" role="radiogroup" aria-label={t("connector.engineGroup")}>
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
            <legend>{t("connector.where")}</legend>
            <div className="field-row host-row">
              <div className="field-grow">
                <label htmlFor="host">Host</label>
                <input id="host" value={form.host} onChange={(e) => update("host", e.target.value)} autoComplete="off" required={mode === "database"} placeholder="aws-1-us-west-1.pooler.supabase.com" />
              </div>
              <div className="field-port">
                <label htmlFor="port">{t("sources.port")}</label>
                <input id="port" inputMode="numeric" value={form.port} onChange={(e) => update("port", e.target.value)} required={mode === "database"} />
              </div>
            </div>
            <label htmlFor="database">{t("connector.dbName")}</label>
            <input id="database" value={form.database} onChange={(e) => update("database", e.target.value)} required={mode === "database"} />
            <label className="check-line">
              <input type="checkbox" checked={form.ssl} onChange={(event) => setForm((current) => ({ ...current, ssl: event.target.checked }))} />
              {t("connector.ssl")}
            </label>
          </fieldset>

          <fieldset className="form-block">
            <legend>{t("connector.readAccess")}</legend>
            <div className="field-row">
              <div className="field-grow">
                <label htmlFor="user">{t("sources.user")}</label>
                <input id="user" value={form.user} onChange={(e) => update("user", e.target.value)} autoComplete="username" required={mode === "database"} placeholder="postgres.abcdxyz" />
              </div>
              <div className="field-grow">
                <label htmlFor="password">{t("connector.password")}</label>
                <div className="password-field">
                  <input id="password" type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => update("password", e.target.value)} autoComplete="current-password" required={mode === "database"} />
                  <button type="button" className="icon-button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                </div>
              </div>
            </div>
          </fieldset>
          <p className="security-note">{t("connector.poolerNote")}</p>
        </>
      ) : null}

      {mode === "service" ? (
        <fieldset className="form-block">
          <legend>{t("connector.endpoint")}</legend>
          <label htmlFor="serviceUrl">{t("connector.serviceUrl")}</label>
          <input id="serviceUrl" value={form.serviceUrl} onChange={(e) => update("serviceUrl", e.target.value)} placeholder="https://" required={mode === "service"} />
          <label htmlFor="apiKey">{t("connector.apiKey")}</label>
          <div className="password-field">
            <input id="apiKey" type={showPassword ? "text" : "password"} value={form.apiKey} onChange={(e) => update("apiKey", e.target.value)} />
            <button type="button" className="icon-button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? t("connector.hideSecret") : t("connector.showSecret")}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
          </div>
          <p className="security-note">{t("connector.apiNote")}</p>
        </fieldset>
      ) : null}

      {mode === "schema" ? (
        <fieldset className="form-block">
          <legend>{t("connector.snapshot")}</legend>
          <p className="section-copy">{t("connector.snapshotCopy")}</p>
          <label className="file-pick" htmlFor="schema-file">{t("connector.loadFile")}</label>
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
          <button type="button" className="advanced-toggle" onClick={() => setAdvanced((value) => !value)}><ChevronDown className={advanced ? "rotate" : ""} size={15} /> {t("connector.options")}</button>
          {advanced && <div className="advanced-box"><Check size={14} /> {t("connector.advanced")}</div>}
        </>
      ) : null}
      {visibleError ? <p className="form-error" role="alert">{visibleError}</p> : null}
      {mode === "schema" ? (
        <button className="primary-button" type="submit" disabled={isLoading}>
          {isLoading ? <><LoaderCircle className="spin" size={17} /> {t("connector.reading")}</> : t("connector.analyze")}
        </button>
      ) : (
        <div className="connector-actions">
          <button
            className={reconnect ? "primary-button" : "secondary-button"}
            type="submit"
            name="intent"
            value="connect"
            disabled={isLoading}
          >
            {isLoading && intent === "connect" ? <><LoaderCircle className="spin" size={17} /> {t("connector.connecting")}</> : reconnect ? t("sources.reconnect") : t("connector.connectOnly")}
          </button>
          <button
            className={reconnect ? "secondary-button" : "primary-button"}
            type="submit"
            name="intent"
            value="discover"
            disabled={isLoading}
          >
            {isLoading && intent === "discover" ? <><LoaderCircle className="spin" size={17} /> {t("connector.generating")}</> : t("connector.connectAndMap")}
          </button>
        </div>
      )}
      <p className="security-note"><LockKeyhole size={14} /><span>{t("connector.readonly")}</span></p>
    </form>
  );
}
