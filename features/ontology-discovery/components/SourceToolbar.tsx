"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Database, Plus, Settings2, X } from "lucide-react";
import type { ConnectedSource, DbConnectionConfig, SchemaSnapshot } from "../models/ontology";
import type { QuerySource } from "../services/workspaceStore";
import { DbConnector, type IntakeMode } from "./DbConnector";
import { SourceRoster } from "./SourceRoster";

type DialogMode = "add" | "manage" | null;

type Props = {
  sources: ConnectedSource[];
  querySources?: QuerySource[];
  liveIds?: string[];
  businessId?: string;
  isLoading: boolean;
  error: string | null;
  dialog: DialogMode;
  intakeMode: IntakeMode;
  onOpen: (mode: Exclude<DialogMode, null>, intake?: IntakeMode) => void;
  onClose: () => void;
  onSubmitConnection: (config: DbConnectionConfig, engine?: string) => Promise<void>;
  onSubmitSchema: (snapshot: SchemaSnapshot) => Promise<void>;
  onRemove?: (id: string) => void;
  showChrome?: boolean;
};

export function SourceToolbar({
  sources,
  querySources = [],
  liveIds = [],
  businessId,
  isLoading,
  error,
  dialog,
  intakeMode,
  onOpen,
  onClose,
  onSubmitConnection,
  onSubmitSchema,
  onRemove,
  showChrome = true,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const pills = querySources.length
    ? querySources.map((source) => ({ id: source.id, label: source.config.database || source.label }))
    : sources.map((source) => ({ id: source.id, label: source.label }));

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!dialog) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [dialog, onClose]);

  return (
    <>
      {showChrome ? (
        <div className="source-toolbar">
          <div className="source-pills" aria-label="Fuentes conectadas">
            {pills.map((source) => (
              <span key={source.id} className="source-pill" title={`Fuente activa: ${source.label}`}>
                <Database size={13} aria-hidden="true" />
                <span>{source.label}</span>
              </span>
            ))}
          </div>
          <button type="button" className="icon-tool" onClick={() => onOpen("add", "schema")} aria-label="Agregar fuente" title="Agregar fuente">
            <Plus size={16} />
          </button>
          <button type="button" className="icon-tool" onClick={() => onOpen("manage")} aria-label="Configurar fuentes" title="Configurar fuentes">
            <Settings2 size={16} />
          </button>
        </div>
      ) : null}

      {mounted && dialog ? createPortal(
        <div className="drawer-backdrop" onClick={onClose} role="presentation">
          <aside className="source-drawer" role="dialog" aria-modal="true" aria-labelledby="source-dialog-title" onClick={(event) => event.stopPropagation()}>
            <div className="dialog-head">
              <div>
                <h2 id="source-dialog-title">{dialog === "add" ? "Agregar conexión" : "Administrar fuentes"}</h2>
                <p className="section-copy">El schema arma el mapa. La conexión de base queda para que Inferir ejecute consultas de solo lectura. Las credenciales no se guardan en el API.</p>
              </div>
              <button ref={closeRef} type="button" className="icon-tool" onClick={onClose} aria-label="Cerrar"><X size={16} /></button>
            </div>
            <div className="drawer-body">
              {dialog === "manage" ? (
                <>
                  {businessId ? <p className="muted-copy">Negocio {businessId}</p> : null}
                  {onRemove && querySources.length ? (
                    <SourceRoster sources={querySources} liveIds={liveIds} onRemove={onRemove} compact />
                  ) : sources.length ? (
                    <ul className="source-roster">
                      {sources.map((source) => (
                        <li key={source.id} className="source-row">
                          <div className="source-row-body">
                            <div className="source-row-head">
                              <h3>{source.label}</h3>
                              <span className="source-status">{source.kind === "schema" ? "Schema" : source.engine || "Fuente"}</span>
                            </div>
                          </div>
                          {onRemove ? (
                            <button
                              type="button"
                              className="ghost-button source-remove"
                              onClick={() => onRemove(source.id)}
                              aria-label={`Eliminar ${source.label}`}
                            >
                              Eliminar
                            </button>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted-copy">Todavía no hay fuentes en este mapa.</p>
                  )}
                </>
              ) : null}
              <DbConnector
                key={intakeMode}
                initialMode={intakeMode}
                onSubmitConnection={async (config, engine) => {
                  try {
                    await onSubmitConnection(config, engine);
                    onClose();
                  } catch {
                    /* visible in form */
                  }
                }}
                onSubmitSchema={async (snapshot) => {
                  try {
                    await onSubmitSchema(snapshot);
                    onClose();
                  } catch {
                    /* visible in form */
                  }
                }}
                isLoading={isLoading}
                error={error}
              />
            </div>
          </aside>
        </div>,
        document.body,
      ) : null}
    </>
  );
}
