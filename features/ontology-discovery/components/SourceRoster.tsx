"use client";

import { Trash2 } from "lucide-react";
import { useI18n } from "@/features/i18n";
import type { QuerySource } from "../services/workspaceStore";

type Props = {
  sources: QuerySource[];
  liveIds?: string[];
  onRemove: (id: string) => void;
  onReconnect?: (source: QuerySource) => void;
  compact?: boolean;
};

function engineMark(engine?: string) {
  const value = (engine || "").toLowerCase();
  if (value.includes("mysql")) return "My";
  if (value.includes("sql server") || value.includes("mssql")) return "MS";
  return "Pg";
}

export function SourceRoster({ sources, liveIds = [], onRemove, onReconnect, compact = false }: Props) {
  const { t } = useI18n();
  if (!sources.length) return null;

  return (
    <div className={`source-roster${compact ? " compact" : ""}`}>
      {compact ? null : (
        <>
          <h2>{t("sources.browserTitle")}</h2>
          <p className="muted-copy">{t("sources.browserCopy")}</p>
        </>
      )}
      <ul>
        {sources.map((source) => {
          const live = liveIds.includes(source.id);
          const host = source.config.host;
          const database = source.config.database || source.label;
          return (
            <li key={source.id} className="source-row">
              <span className="source-engine" aria-hidden="true">{engineMark(source.engine)}</span>
              <div className="source-row-body">
                <div className="source-row-head">
                  <h3>{database}</h3>
                  <span className={`source-status${live ? " live" : ""}`}>
                    {live ? t("sources.readyInfer") : t("sources.idle")}
                  </span>
                </div>
                <dl>
                  <div>
                    <dt>{t("sources.host")}</dt>
                    <dd title={host || undefined}>{host || "—"}</dd>
                  </div>
                  <div>
                    <dt>{t("sources.user")}</dt>
                    <dd title={source.config.user || undefined}>{source.config.user || "—"}</dd>
                  </div>
                  <div>
                    <dt>{t("sources.port")}</dt>
                    <dd>{source.config.port ?? "—"}{source.config.ssl ? " · SSL" : ""}</dd>
                  </div>
                </dl>
              </div>
              <div className="source-row-actions">
                {!live && onReconnect ? (
                  <button
                    type="button"
                    className="secondary-button source-reconnect"
                    onClick={() => onReconnect(source)}
                  >
                    {t("sources.reconnect")}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="ghost-button source-remove"
                  onClick={() => onRemove(source.id)}
                  aria-label={`${t("common.delete")} ${database}`}
                >
                  <Trash2 size={14} />
                  {t("common.delete")}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
