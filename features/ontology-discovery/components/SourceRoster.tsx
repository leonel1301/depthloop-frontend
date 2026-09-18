"use client";

import { Trash2 } from "lucide-react";
import type { QuerySource } from "../services/workspaceStore";

type Props = {
  sources: QuerySource[];
  liveIds?: string[];
  onRemove: (id: string) => void;
  compact?: boolean;
};

function engineMark(engine?: string) {
  const value = (engine || "").toLowerCase();
  if (value.includes("mysql")) return "My";
  if (value.includes("sql server") || value.includes("mssql")) return "MS";
  return "Pg";
}

export function SourceRoster({ sources, liveIds = [], onRemove, compact = false }: Props) {
  if (!sources.length) return null;

  return (
    <div className={`source-roster${compact ? " compact" : ""}`}>
      {compact ? null : (
        <>
          <h2>Fuentes en este navegador</h2>
          <p className="muted-copy">Se guardan aquí, no en tu base. Eliminar solo las quita de este equipo.</p>
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
                    {live ? "Lista para Inferir" : "Sin sesión"}
                  </span>
                </div>
                <dl>
                  <div>
                    <dt>Host</dt>
                    <dd title={host || undefined}>{host || "—"}</dd>
                  </div>
                  <div>
                    <dt>Usuario</dt>
                    <dd title={source.config.user || undefined}>{source.config.user || "—"}</dd>
                  </div>
                  <div>
                    <dt>Puerto</dt>
                    <dd>{source.config.port ?? "—"}{source.config.ssl ? " · SSL" : ""}</dd>
                  </div>
                </dl>
              </div>
              <button
                type="button"
                className="ghost-button source-remove"
                onClick={() => onRemove(source.id)}
                aria-label={`Eliminar ${database}`}
              >
                <Trash2 size={14} />
                Eliminar
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
