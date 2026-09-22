"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUp, Check, Copy, Database, LoaderCircle, Plus, Search, Sparkles, Table2 } from "lucide-react";
import { useI18n, type MessageKey } from "@/features/i18n";
import type { OntologyDiscoveryResult } from "@/features/ontology-discovery/models/ontology";
import type { QuerySource } from "@/features/ontology-discovery/services/workspaceStore";
import { QueryResultTable } from "./QueryResultTable";
import type { InferMessage } from "../models";
import type { ToolId } from "@/features/tools/models";
import { ToolIcon } from "@/features/tools/components/ToolIcon";
import { useToolRecommendations } from "@/features/tools/hooks/useToolRecommendations";

export type { InferMessage };

type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string;

type Props = {
  messages: InferMessage[];
  loading: boolean;
  error: string | null;
  title: string;
  ontology: OntologyDiscoveryResult | null;
  businessName?: string;
  sources?: QuerySource[];
  liveIds?: string[];
  tools?: ToolId[];
  disabled: boolean;
  disabledReason?: string;
  onSend: (question: string, preferredTools: ToolId[]) => void;
};

function suggestions(ontology: OntologyDiscoveryResult | null, t: Translate) {
  const names = (ontology?.entities ?? []).slice(0, 4).map((entity) => entity.name);
  if (names.length >= 2) {
    return [
      t("infer.howMany", { name: names[0] }),
      t("infer.relation", { a: names[0], b: names[1] }),
      t("infer.showMe", { name: names[0] }),
    ];
  }
  if (names.length === 1) {
    return [t("infer.howMany", { name: names[0] }), t("infer.showMe", { name: names[0] })];
  }
  return [t("infer.howManyRecords"), t("infer.summary")];
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
  tools = [],
  disabled,
  disabledReason,
  onSend,
}: Props) {
  const { t } = useI18n();
  const [draft, setDraft] = useState("");
  const [attachedTools, setAttachedTools] = useState<ToolId[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const empty = messages.length === 0;
  const displayTitle = title === "Nueva conversación" || title === "New conversation" ? t("infer.newChat") : title;
  const toolRecommendations = useToolRecommendations(draft, tools, disabled || loading);
  const visibleRecommendations = [
    ...attachedTools.map((id) => toolRecommendations.recommendations.find((item) => item.id === id) ?? { id, reason: "", confidence: 1 }),
    ...toolRecommendations.recommendations.filter((item) => !attachedTools.includes(item.id)),
  ].slice(0, 3);

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
    const preferredTools = attachedTools;
    setAttachedTools([]);
    onSend(next, preferredTools);
  };

  const toggleTool = (id: ToolId) => {
    setAttachedTools((current) => current.includes(id) ? current.filter((tool) => tool !== id) : [...current, id].slice(0, 3));
  };

  return (
    <section className="infer-desk">
      <header className="infer-chat-header">
        <div>
          <span className="infer-chat-eyebrow">{t("infer.conversation")}</span>
          <h1>{displayTitle}</h1>
        </div>
        <span className={`infer-source-state ${liveIds.length ? "is-live" : ""}`}>
          <i />
          {sources.length
            ? t("infer.of", {
              live: liveIds.length,
              total: sources.length,
              label: sources.length === 1 ? t("infer.activeSource") : t("infer.activeSources"),
            })
            : t("infer.noSources")}
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
              tools={tools}
              disabled={disabled}
              disabledReason={disabledReason}
              loading={loading}
              onAsk={submit}
            />
          ) : (
            <>
              <h2 className="visually-hidden">{t("infer.messages")}</h2>
              <ol className="infer-thread">
                {messages.map((message) => (
                  <li key={message.id} className={`infer-turn ${message.role}`}>
                    {message.role === "user" ? (
                      <div className="infer-user-turn">
                        <p className="infer-user">{message.text}</p>
                        {message.preferredTools?.length ? (
                          <div className="infer-user-tools">
                            {message.preferredTools.map((tool) => <span key={tool}><ToolIcon id={tool} size={11} />{t(`tools.items.${tool}.name` as MessageKey)}</span>)}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <AssistantTurn message={message} tools={tools} />
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
          <div className="infer-composer-input-row">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                if (!event.target.value.trim()) setAttachedTools([]);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submit(draft);
                }
              }}
              placeholder={disabled ? (disabledReason || t("infer.disabledPlaceholder")) : loading ? t("infer.preparingPlaceholder") : t("infer.askPlaceholder")}
              rows={1}
              disabled={disabled}
              aria-label={t("infer.question")}
            />
            {visibleRecommendations.length || toolRecommendations.loading ? (
              <aside className="infer-tool-recommendations" aria-live="polite" aria-label={t("infer.toolSuggestions")}>
                <div><Sparkles size={12} /><span>{toolRecommendations.loading ? t("infer.inferringTools") : t("infer.suggestedViews")}</span></div>
                {visibleRecommendations.map((recommendation) => {
                  const attached = attachedTools.includes(recommendation.id);
                  return (
                    <button
                      type="button"
                      key={recommendation.id}
                      className={attached ? "is-attached" : ""}
                      aria-pressed={attached}
                      title={recommendation.reason || t(`tools.items.${recommendation.id}.summary` as MessageKey)}
                      onClick={() => toggleTool(recommendation.id)}
                    >
                      <ToolIcon id={recommendation.id} size={13} />
                      <span>{t(`tools.items.${recommendation.id}.name` as MessageKey)}</span>
                      {attached ? <Check size={12} /> : <Plus size={12} />}
                    </button>
                  );
                })}
              </aside>
            ) : null}
          </div>
          <div className="infer-composer-footer">
            <span>{loading ? t("infer.preparing") : t("infer.composerHint")}</span>
            <button
              type="submit"
              className="infer-send"
              disabled={disabled || loading || !draft.trim()}
              aria-label={loading ? t("infer.preparing") : t("infer.send")}
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
  tools,
  disabled,
  disabledReason,
  loading,
  onAsk,
}: {
  ontology: OntologyDiscoveryResult | null;
  businessName?: string;
  sources: QuerySource[];
  liveIds: string[];
  tools: ToolId[];
  disabled: boolean;
  disabledReason?: string;
  loading: boolean;
  onAsk: (text: string) => void;
}) {
  const { t } = useI18n();
  const concepts = ontology?.entities.length ?? 0;
  return (
    <div className="infer-welcome">
      <span className="infer-welcome-mark"><Database size={18} /></span>
      <h2>{t("infer.startTitle")}</h2>
      <p>
        {ontology
          ? t("infer.mapReady")
          : t("infer.mapPending")}
      </p>
      <dl className="infer-preview">
        {businessName ? (
          <div>
            <dt>{t("infer.business")}</dt>
            <dd>{businessName}</dd>
          </div>
        ) : null}
        <div>
          <dt>{t("infer.map")}</dt>
          <dd>{ontology ? `${concepts} ${concepts === 1 ? t("settings.concept") : t("settings.concepts")}` : t("infer.noMapYet")}</dd>
        </div>
        {sources.length ? sources.map((source) => {
          const live = liveIds.includes(source.id);
          const name = source.config.database || source.label;
          return (
            <div key={source.id}>
              <dt>{t("infer.source")}</dt>
              <dd>
                {name}
                {source.config.host ? ` · ${source.config.host}` : ""}
                {live ? ` · ${t("infer.ready")}` : ` · ${t("infer.noSession")}`}
              </dd>
            </div>
          );
        }) : (
          <div>
            <dt>{t("infer.source")}</dt>
            <dd>Ninguna conectada en este navegador</dd>
          </div>
        )}
        <div>
          <dt>{t("infer.tools")}</dt>
          <dd>{tools.length ? t("infer.toolsActive", { count: tools.length }) : t("infer.toolsNone")}</dd>
        </div>
      </dl>
      {disabled ? (
        <p className="muted-copy">{disabledReason}</p>
      ) : (
        <div className="infer-suggestions">
          {suggestions(ontology, t).map((item) => (
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
      <Link className="infer-configure-tools" href="/setup/tools">
        {tools.length ? t("infer.manageTools") : t("infer.addTools")}
      </Link>
    </div>
  );
}

function AssistantTurn({ message, tools }: { message: InferMessage; tools: ToolId[] }) {
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
              {step.error ? <p className="form-error">{step.error}</p> : <QueryResultTable table={step.table} tools={tools} presentation={step.presentation} />}
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
  { label: "infer.reviewing", detail: "infer.reviewingDetail", icon: Search },
  { label: "infer.querying", detail: "infer.queryingDetail", icon: Database },
  { label: "infer.preparingResults", detail: "infer.preparingResultsDetail", icon: Table2 },
] as const;

function ResponseLoader() {
  const { t } = useI18n();
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
          <strong>{t(current.label)}</strong>
          <p>{t(current.detail)}</p>
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
  const { t } = useI18n();
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
    <button type="button" className="infer-copy-answer" onClick={() => void copy()} aria-label={t("infer.copyAnswer")}>
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? t("infer.copied") : "Copiar"}
    </button>
  );
}
