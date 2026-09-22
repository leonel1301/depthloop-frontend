"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, CheckCircle2, Eye, SlidersHorizontal, Sparkles } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useI18n, type MessageKey } from "@/features/i18n";
import { AppHeader } from "@/features/setup/components/AppHeader";
import { TOOL_CATALOG } from "../catalog";
import { useWorkspaceTools } from "../hooks/useWorkspaceTools";
import type { ToolCategory, ToolId } from "../models";
import { ToolIcon } from "./ToolIcon";
import { ToolPreview } from "./ToolPreview";
import { ToolPreviewDialog } from "./ToolPreviewDialog";

type Filter = "all" | ToolCategory;

const FILTERS: Filter[] = ["all", "visual", "geography", "analysis"];

export function ToolsDesk() {
  const { t } = useI18n();
  const { session } = useAuth();
  const router = useRouter();
  const workspace = useWorkspaceTools();
  const [draft, setDraft] = useState<ToolId[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState<ToolId | null>(null);
  const closePreview = useCallback(() => setPreview(null), []);
  const isOwner = session.user.role !== "member";

  const recommended = useMemo(() => recommendations(session.business.industry), [session.business.industry]);
  const visible = filter === "all" ? TOOL_CATALOG : TOOL_CATALOG.filter((tool) => tool.category === filter);
  const selection = draft ?? workspace.selectedTools;
  const changed = selection.join("|") !== workspace.selectedTools.join("|");

  const toggle = (id: ToolId) => {
    if (!isOwner || workspace.saving) return;
    setSaved(false);
    setDraft((current) => {
      const resolved = current ?? workspace.selectedTools;
      return resolved.includes(id) ? resolved.filter((item) => item !== id) : [...resolved, id];
    });
  };

  const persist = async () => {
    if (!isOwner) return workspace.selectedTools;
    const savedSelection = await workspace.save(selection);
    setDraft(null);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
    return savedSelection;
  };

  const continueToInference = async () => {
    try {
      if (changed) await persist();
      router.push("/setup/chat");
    } catch {
      // The hook exposes the actionable API error in the page.
    }
  };

  return (
    <main className="app-shell tools-shell">
      <AppHeader currentStep={3} />
      <section className="tools-page">
        <header className="tools-hero">
          <div>
            <span className="business-optional">{t("tools.optional")}</span>
            <h1>{t("tools.title")}</h1>
            <p>{t("tools.lead")}</p>
          </div>
          <div className="tools-selection-summary" aria-live="polite">
            <span><strong>{selection.length}</strong> {t("tools.selectedCount")}</span>
            <small>{t("tools.selectionHint")}</small>
          </div>
        </header>

        <div className="tools-info-banner">
          <Sparkles size={16} />
          <div><strong>{t("tools.chatTitle")}</strong><p>{t("tools.chatCopy")}</p></div>
        </div>

        {!isOwner ? <p className="tools-role-note">{t("tools.ownerOnly")}</p> : null}
        {workspace.error ? <p className="form-error" role="alert">{workspace.error}</p> : null}

        <div className="tools-toolbar">
          <div><SlidersHorizontal size={14} /><span>{t("tools.filter")}</span></div>
          <nav aria-label={t("tools.filter")}>
            {FILTERS.map((item) => (
              <button key={item} type="button" className={filter === item ? "is-active" : ""} onClick={() => setFilter(item)}>
                {t(`tools.filters.${item}` as MessageKey)}
              </button>
            ))}
          </nav>
        </div>

        <div className="tools-grid" aria-busy={!workspace.ready}>
          {visible.map((tool) => {
            const selected = selection.includes(tool.id);
            const isRecommended = recommended.includes(tool.id);
            return (
              <article key={tool.id} className={`tool-card tool-accent-${tool.accent} ${selected ? "is-selected" : ""}`}>
                <div className="tool-card-preview"><ToolPreview id={tool.id} /></div>
                <div className="tool-card-body">
                  <div className="tool-card-heading">
                    <span><ToolIcon id={tool.id} /></span>
                    <div>
                      <h2>{t(`tools.items.${tool.id}.name` as MessageKey)}</h2>
                      <small>{t(`tools.categories.${tool.category}` as MessageKey)}</small>
                    </div>
                    {isRecommended ? <em>{t("tools.recommended")}</em> : null}
                  </div>
                  <p>{t(`tools.items.${tool.id}.summary` as MessageKey)}</p>
                  <div className="tool-tags">
                    {tool.tags.map((tag) => <span key={tag}>{t(`tools.tags.${tag}` as MessageKey)}</span>)}
                  </div>
                  <div className="tool-card-actions">
                    <button type="button" className="tool-preview-action" aria-haspopup="dialog" onClick={() => setPreview(tool.id)}>
                      <Eye size={13} /> {t("tools.preview")}
                    </button>
                    <button
                      type="button"
                      className="tool-select"
                      aria-pressed={selected}
                      disabled={!workspace.ready || workspace.saving || !isOwner}
                      onClick={() => toggle(tool.id)}
                    >
                      <span>{selected ? <Check size={13} /> : null}</span>
                      {selected ? t("tools.selected") : t("tools.select")}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <footer className="tools-footer">
          <div>
            <CheckCircle2 size={17} />
            <span><strong>{selection.length ? t("tools.footerReady") : t("tools.footerSkip")}</strong><small>{t("tools.footerCopy")}</small></span>
          </div>
          <div className="tools-footer-actions">
            {isOwner ? (
              <button type="button" className="inference-secondary-action" disabled={!workspace.ready || workspace.saving || !changed} onClick={() => void persist()}>
                {saved ? t("tools.saved") : workspace.saving ? t("common.saving") : t("tools.save")}
              </button>
            ) : null}
            <button type="button" className="inference-primary-action" disabled={!workspace.ready || workspace.saving} onClick={() => void continueToInference()}>
              {selection.length ? t("tools.continue") : t("tools.continueWithout")} <ArrowRight size={14} />
            </button>
          </div>
        </footer>
      </section>
      {preview ? <ToolPreviewDialog key={preview} tool={preview} onClose={closePreview} /> : null}
    </main>
  );
}

function recommendations(industry: string): ToolId[] {
  const normalized = industry.toLocaleLowerCase("es");
  if (normalized.includes("logística") || normalized.includes("transporte")) return ["route-map", "world-map", "timeline", "kpi"];
  if (normalized.includes("comercio") || normalized.includes("retail")) return ["bar", "treemap", "donut", "funnel"];
  if (normalized.includes("tecnología") || normalized.includes("software")) return ["line", "area", "kpi", "funnel"];
  return ["bar", "histogram", "line", "kpi"];
}
