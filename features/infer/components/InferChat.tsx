"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Check, Copy, Database, LoaderCircle, Search, Table2 } from "lucide-react";
import type { OntologyDiscoveryResult } from "@/features/ontology-discovery/models/ontology";
import type { QuerySource } from "@/features/ontology-discovery/services/workspaceStore";
import { QueryResultTable } from "./QueryResultTable";
import type { InferMessage } from "../models";

export type { InferMessage };

type Props = {
  messages: InferMessage[];
  loading: boolean;
  error: string | null;
  title: string;
  ontology: OntologyDiscoveryResult | null;
  businessName?: string;
  sources?: QuerySource[];
  liveIds?: string[];
  disabled: boolean;
  disabledReason?: string;
  onSend: (question: string) => void;
};

function suggestions(ontology: OntologyDiscoveryResult | null) {
  const names = (ontology?.entities ?? []).slice(0, 4).map((entity) => entity.name);
  if (names.length >= 2) {
    return [
      `¿Cuántos ${names[0]} hay?`,
      `Relación entre ${names[0]} y ${names[1]}`,
      `Muéstrame ${names[0]}`,
    ];
  }
  if (names.length === 1) {
    return [`¿Cuántos ${names[0]} hay?`, `Muéstrame ${names[0]}`];
  }
  return ["¿Cuántos registros hay en total?", "Dame un resumen de la información disponible"];
}

export function InferChat({
  messages,
  loading,
  error,
  title,
  ontology,
  businessName,
  sources = [],
  liveIds = [],
  disabled,
  disabledReason,
  onSend,
}: Props) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const empty = messages.length === 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 144)}px`;
  }, [draft]);

  const submit = (text: string) => {
    const next = text.trim();
    if (!next || loading || disabled) return;
    setDraft("");
    onSend(next);
  };

  return (
    <section className="infer-desk">
      <header className="infer-chat-header">
        <div>
          <span className="infer-chat-eyebrow">Conversación</span>
          <h1>{title}</h1>
        </div>
        <span className={`infer-source-state ${liveIds.length ? "is-live" : ""}`}>
          <i />
          {sources.length
            ? `${liveIds.length} de ${sources.length} ${sources.length === 1 ? "fuente activa" : "fuentes activas"}`
            : "Sin fuentes"}
        </span>
      </header>
      <div className="infer-stream">
        <div className="infer-column">
          {empty ? (
            <Welcome
              ontology={ontology}
              businessName={businessName}
              sources={sources}
              liveIds={liveIds}
              disabled={disabled}
              disabledReason={disabledReason}
              loading={loading}
              onAsk={submit}
            />
          ) : (
            <>
              <h2 className="visually-hidden">Mensajes</h2>
              <ol className="infer-thread">
                {messages.map((message) => (
                  <li key={message.id} className={`infer-turn ${message.role}`}>
                    {message.role === "user" ? (
                      <p className="infer-user">{message.text}</p>
                    ) : (
                      <AssistantTurn message={message} />
                    )}
                  </li>
                ))}
              </ol>
            </>
          )}
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <div ref={bottomRef} />
        </div>
      </div>
      <form
        className="infer-composer"
        onSubmit={(event) => {
          event.preventDefault();
          submit(draft);
        }}
      >
        <div className="infer-composer-shell">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit(draft);
              }
            }}
            placeholder={disabled ? (disabledReason || "Aún no puedes consultar") : loading ? "Puedes preparar tu siguiente pregunta…" : "¿Qué quieres saber de tu empresa?"}
            rows={1}
            disabled={disabled}
            aria-label="Pregunta"
          />
          <div className="infer-composer-footer">
            <span>{loading ? "Preparando respuesta" : "Enter para enviar · Shift + Enter para nueva línea"}</span>
            <button
              type="submit"
              className="infer-send"
              disabled={disabled || loading || !draft.trim()}
              aria-label={loading ? "Preparando respuesta" : "Enviar"}
            >
              {loading ? <LoaderCircle size={16} className="spin" /> : <ArrowUp size={16} />}
            </button>
          </div>
        </div>
        {disabled && disabledReason && !empty ? <p className="muted-copy">{disabledReason}</p> : null}
      </form>
    </section>
  );
}

function Welcome({
  ontology,
  businessName,
  sources,
  liveIds,
  disabled,
  disabledReason,
  loading,
  onAsk,
}: {
  ontology: OntologyDiscoveryResult | null;
  businessName?: string;
  sources: QuerySource[];
  liveIds: string[];
  disabled: boolean;
  disabledReason?: string;
  loading: boolean;
  onAsk: (text: string) => void;
}) {
  const concepts = ontology?.entities.length ?? 0;
  return (
    <div className="infer-welcome">
      <span className="infer-welcome-mark"><Database size={18} /></span>
      <h2>Empieza con una pregunta</h2>
      <p>
        {ontology
          ? "Tu mapa está listo. Explora la información de tu empresa y encuentra lo que necesitas."
          : "Termina de configurar el mapa para empezar a explorar la información de tu empresa."}
      </p>
      <dl className="infer-preview">
        {businessName ? (
          <div>
            <dt>Negocio</dt>
            <dd>{businessName}</dd>
          </div>
        ) : null}
        <div>
          <dt>Mapa</dt>
          <dd>{ontology ? `${concepts} ${concepts === 1 ? "concepto" : "conceptos"}` : "Aún no hay mapa"}</dd>
        </div>
        {sources.length ? sources.map((source) => {
          const live = liveIds.includes(source.id);
          const name = source.config.database || source.label;
          return (
            <div key={source.id}>
              <dt>Fuente</dt>
              <dd>
                {name}
                {source.config.host ? ` · ${source.config.host}` : ""}
                {live ? " · lista" : " · sin sesión"}
              </dd>
            </div>
          );
        }) : (
          <div>
            <dt>Fuente</dt>
            <dd>Ninguna conectada en este navegador</dd>
          </div>
        )}
      </dl>
      {disabled ? (
        <p className="muted-copy">{disabledReason}</p>
      ) : (
        <div className="infer-suggestions">
          {suggestions(ontology).map((item) => (
            <button
              key={item}
              type="button"
              className="ghost-button"
              disabled={loading}
              onClick={() => onAsk(item)}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AssistantTurn({ message }: { message: InferMessage }) {
  if (message.pending) {
    return <ResponseLoader />;
  }
  const steps = message.steps ?? [];
  return (
    <div className="infer-reply">
      {steps.length ? (
        <ol className="infer-flow">
          {steps.map((step, stepIndex) => (
            <li key={step.index} className="infer-step" style={{ animationDelay: `${stepIndex * 90}ms` }}>
              <div className="infer-step-head">
                <span className="infer-step-check"><Check size={13} /></span>
                <div>
                  <span>Consulta {step.index}</span>
                  <h2>{step.title}</h2>
                </div>
              </div>
              <p className="infer-step-reason">{step.reason}</p>
              {step.error ? <p className="form-error">{step.error}</p> : <QueryResultTable table={step.table} />}
              {step.sql ? (
                <details className="infer-sql">
                  <summary>Detalles de la consulta</summary>
                  <pre>{step.sql}</pre>
                </details>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}
      {message.text ? (
        <div className="infer-answer-card">
          <div className="infer-answer-head">
            <span>Respuesta</span>
            <CopyTextButton text={message.text} />
          </div>
          <p className="infer-answer">{message.text}</p>
        </div>
      ) : null}
    </div>
  );
}

const loadingStages = [
  { label: "Revisando tu pregunta", detail: "Identificando la información necesaria.", icon: Search },
  { label: "Consultando las fuentes", detail: "Buscando los datos relacionados.", icon: Database },
  { label: "Preparando los resultados", detail: "Organizando la respuesta y sus tablas.", icon: Table2 },
] as const;

function ResponseLoader() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setStage((current) => Math.min(current + 1, loadingStages.length - 1)), 1700);
    return () => window.clearInterval(timer);
  }, []);

  const current = loadingStages[stage];
  const StageIcon = current.icon;

  return (
    <div className="infer-pending" role="status" aria-live="polite">
      <div className="infer-pending-head">
        <span className="infer-pending-icon"><StageIcon size={16} /></span>
        <div>
          <strong>{current.label}</strong>
          <p>{current.detail}</p>
        </div>
      </div>
      <div className="infer-pending-progress" aria-hidden="true">
        {loadingStages.map((item, index) => (
          <i key={item.label} className={index < stage ? "is-done" : index === stage ? "is-active" : ""} />
        ))}
      </div>
      <div className="infer-pending-table" aria-hidden="true">
        <span className="wide" />
        <span />
        <span />
        <span className="wide" />
        <span />
        <span />
      </div>
    </div>
  );
}

function CopyTextButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button type="button" className="infer-copy-answer" onClick={() => void copy()} aria-label="Copiar respuesta">
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? "Copiada" : "Copiar"}
    </button>
  );
}
