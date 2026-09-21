"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Check,
  CheckCircle2,
  CircleAlert,
  Database,
  FileCheck2,
  MessageSquareText,
  SearchCheck,
  ShieldCheck,
  Shapes,
  Sparkles,
  Table2,
} from "lucide-react";
import { useI18n } from "@/features/i18n";
import { useOntologyDiscovery } from "@/features/ontology-discovery/hooks";
import { AppHeader } from "./AppHeader";
import { contextApi, type BusinessContext } from "../services/contextApi";
import { useWorkspaceTools } from "@/features/tools/hooks/useWorkspaceTools";

const EMPTY_CONTEXT: BusinessContext = { holidays: [], notes: [] };

export function InferenceOverview() {
  const { t } = useI18n();
  const {
    ready,
    publishedOntology,
    querySources,
    activeSource,
    hasSession,
    openSourceDialog,
  } = useOntologyDiscovery();
  const tools = useWorkspaceTools();
  const [context, setContext] = useState<BusinessContext>(EMPTY_CONTEXT);

  useEffect(() => {
    if (!ready) return;
    let active = true;
    void contextApi.load()
      .then((value) => {
        if (active) setContext(value);
      })
      .catch(() => {
        if (active) setContext(EMPTY_CONTEXT);
      });
    return () => {
      active = false;
    };
  }, [ready]);

  const source = useMemo(() => {
    const publishedSource = publishedOntology?.source;
    return querySources.find((item) =>
      item.id === publishedSource?.id
      || item.config.database === publishedSource?.id
      || item.config.database === publishedSource?.name
    ) ?? querySources.find((item) => item.id === activeSource?.id) ?? querySources[0];
  }, [activeSource?.id, publishedOntology?.source, querySources]);

  const sourceReady = Boolean(source && hasSession(source.id));
  const mapReady = Boolean(publishedOntology);
  const canChat = sourceReady && mapReady;
  const conceptCount = publishedOntology?.canonicalConcepts.length
    || publishedOntology?.entities.length
    || 0;
  const relationCount = publishedOntology?.relations.length ?? 0;
  const sourceName = source?.config.database || source?.label;
  const contextCount = context.notes.length + context.holidays.length;

  return (
    <main className="app-shell inference-overview-shell">
      <AppHeader currentStep={4} />

      <section className="inference-overview-page">
        <div className="inference-overview-hero">
          <div className="inference-overview-copy">
            <span className="inference-overview-eyebrow"><Sparkles size={13} /> {t("inferenceOverview.eyebrow")}</span>
            <h1>{t("inferenceOverview.title")}</h1>
            <p>{t("inferenceOverview.lead")}</p>

            <div className={`inference-readiness-pill ${canChat ? "is-ready" : "is-pending"}`}>
              {canChat ? <CheckCircle2 size={15} /> : <CircleAlert size={15} />}
              <span>
                <strong>{canChat ? t("inferenceOverview.ready") : t("inferenceOverview.pending")}</strong>
                <small>{canChat ? t("inferenceOverview.readyCopy") : t("inferenceOverview.pendingCopy")}</small>
              </span>
            </div>

            <div className="inference-overview-actions">
              {canChat ? (
                <Link href="/" className="inference-primary-action">
                  <MessageSquareText size={16} /> {t("inferenceOverview.openChat")} <ArrowRight size={15} />
                </Link>
              ) : (
                <button type="button" className="inference-primary-action" disabled>
                  <MessageSquareText size={16} /> {t("inferenceOverview.openChat")}
                </button>
              )}
              {!mapReady ? (
                <Link href="/setup/map" className="inference-secondary-action">{t("inferenceOverview.completeMap")}</Link>
              ) : !sourceReady ? (
                <button
                  type="button"
                  className="inference-secondary-action"
                  onClick={() => openSourceDialog(source ? "reconnect" : "add", "database", source)}
                >
                  {source ? t("sources.reconnect") : t("inferenceOverview.connectSource")}
                </button>
              ) : null}
            </div>
          </div>

          <div className="inference-demo" aria-label={t("inferenceOverview.demoLabel")}>
            <div className="inference-demo-topbar">
              <span><i /><i /><i /></span>
              <strong>{t("inferenceOverview.demoLabel")}</strong>
            </div>
            <div className="inference-demo-question">
              <small>{t("inferenceOverview.you")}</small>
              <p>{t("inferenceOverview.demoQuestion")}</p>
            </div>
            <ol className="inference-demo-flow">
              <DemoStep icon={BookOpenCheck} title={t("inferenceOverview.demoUnderstand")} detail={t("inferenceOverview.demoUnderstandCopy")} />
              <DemoStep icon={ShieldCheck} title={t("inferenceOverview.demoQuery")} detail={t("inferenceOverview.demoQueryCopy")} />
              <DemoStep icon={Table2} title={t("inferenceOverview.demoAnswer")} detail={t("inferenceOverview.demoAnswerCopy")} />
            </ol>
          </div>
        </div>

        <section className="inference-ready-section" aria-labelledby="inference-ready-title">
          <div className="inference-section-heading">
            <div>
              <span>{t("inferenceOverview.readyKicker")}</span>
              <h2 id="inference-ready-title">{t("inferenceOverview.readyTitle")}</h2>
            </div>
            <p>{t("inferenceOverview.readyLead")}</p>
          </div>
          <div className="inference-ready-grid">
            <ReadyCard
              icon={Database}
              title={t("inferenceOverview.sourceTitle")}
              ready={sourceReady}
              value={sourceReady && sourceName ? sourceName : t("inferenceOverview.sourceMissing")}
              detail={sourceReady ? t("inferenceOverview.sourceReady") : t("inferenceOverview.sourceMissingCopy")}
            />
            <ReadyCard
              icon={FileCheck2}
              title={t("inferenceOverview.mapTitle")}
              ready={mapReady}
              value={mapReady ? t("inferenceOverview.mapValue", { count: conceptCount }) : t("inferenceOverview.mapMissing")}
              detail={mapReady ? t("inferenceOverview.mapReady", { count: relationCount }) : t("inferenceOverview.mapMissingCopy")}
            />
            <ReadyCard
              icon={BookOpenCheck}
              title={t("inferenceOverview.contextTitle")}
              ready={contextCount > 0}
              optional
              value={contextCount
                ? t("inferenceOverview.contextValue", { notes: context.notes.length, dates: context.holidays.length })
                : t("inferenceOverview.contextEmpty")}
              detail={contextCount ? t("inferenceOverview.contextReady") : t("inferenceOverview.contextEmptyCopy")}
            />
            <ReadyCard
              icon={Shapes}
              title={t("inferenceOverview.toolsTitle")}
              ready={tools.selectedTools.length > 0}
              optional
              value={tools.selectedTools.length
                ? t("inferenceOverview.toolsValue", { count: tools.selectedTools.length })
                : t("inferenceOverview.toolsEmpty")}
              detail={tools.selectedTools.length ? t("inferenceOverview.toolsReady") : t("inferenceOverview.toolsEmptyCopy")}
            />
          </div>
        </section>

        <section className="inference-capabilities" aria-labelledby="inference-capabilities-title">
          <div className="inference-section-heading">
            <div>
              <span>{t("inferenceOverview.capabilitiesKicker")}</span>
              <h2 id="inference-capabilities-title">{t("inferenceOverview.capabilitiesTitle")}</h2>
            </div>
            <p>{t("inferenceOverview.capabilitiesLead")}</p>
          </div>
          <div className="inference-capability-grid">
            <Capability icon={MessageSquareText} title={t("inferenceOverview.naturalTitle")} copy={t("inferenceOverview.naturalCopy")} />
            <Capability icon={SearchCheck} title={t("inferenceOverview.planTitle")} copy={t("inferenceOverview.planCopy")} />
            <Capability icon={ShieldCheck} title={t("inferenceOverview.safeTitle")} copy={t("inferenceOverview.safeCopy")} />
            <Capability icon={Table2} title={t("inferenceOverview.evidenceTitle")} copy={t("inferenceOverview.evidenceCopy")} />
          </div>
        </section>

        <section className={`inference-final-cta ${canChat ? "is-ready" : ""}`}>
          <span><MessageSquareText size={18} /></span>
          <div>
            <h2>{canChat ? t("inferenceOverview.ctaTitle") : t("inferenceOverview.blockedTitle")}</h2>
            <p>{canChat ? t("inferenceOverview.ctaCopy") : t("inferenceOverview.blockedCopy")}</p>
          </div>
          {canChat ? (
            <Link href="/">{t("inferenceOverview.openChat")} <ArrowRight size={15} /></Link>
          ) : mapReady ? (
            <button type="button" onClick={() => openSourceDialog(source ? "reconnect" : "add", "database", source)}>
              {source ? t("sources.reconnect") : t("inferenceOverview.connectSource")} <ArrowRight size={15} />
            </button>
          ) : (
            <Link href="/setup/map">{t("inferenceOverview.reviewSetup")} <ArrowRight size={15} /></Link>
          )}
        </section>
      </section>
    </main>
  );
}

function DemoStep({ icon: Icon, title, detail }: { icon: typeof Check; title: string; detail: string }) {
  return (
    <li>
      <span><Icon size={14} /></span>
      <div><strong>{title}</strong><small>{detail}</small></div>
      <Check size={13} className="inference-demo-check" />
    </li>
  );
}

function ReadyCard({
  icon: Icon,
  title,
  ready,
  optional = false,
  value,
  detail,
}: {
  icon: typeof Check;
  title: string;
  ready: boolean;
  optional?: boolean;
  value: string;
  detail: string;
}) {
  const { t } = useI18n();
  return (
    <article className={`inference-ready-card ${ready ? "is-ready" : ""}`}>
      <div className="inference-ready-card-head">
        <span><Icon size={16} /></span>
        <small>{optional ? t("inferenceOverview.optional") : ready ? t("inferenceOverview.complete") : t("inferenceOverview.required")}</small>
      </div>
      <h3>{title}</h3>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function Capability({ icon: Icon, title, copy }: { icon: typeof Check; title: string; copy: string }) {
  return (
    <article>
      <span><Icon size={16} /></span>
      <h3>{title}</h3>
      <p>{copy}</p>
    </article>
  );
}
