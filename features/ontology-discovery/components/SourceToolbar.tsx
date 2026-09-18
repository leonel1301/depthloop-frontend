"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Check, ChevronDown, Database, Plus, X } from "lucide-react";
import { DbConnector } from "./DbConnector";
import { SourceRoster } from "./SourceRoster";
import { useOntologyDiscovery } from "../hooks/useOntologyDiscovery";

export function SourceToolbar({ showChrome = true }: { showChrome?: boolean }) {
  const {
    sources,
    querySources,
    businessId,
    isLoading,
    error,
    sourceDialog,
    intakeMode,
    openSourceDialog,
    closeSourceDialog,
    discoverFromConnection,
    discoverFromSchema,
    removeSource,
    hasSession,
    activeSourceId,
    setActiveSourceId,
  } = useOntologyDiscovery();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [connectedLabel, setConnectedLabel] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const switcherRef = useRef<HTMLDivElement>(null);
  const pills = querySources.length
    ? querySources.map((source) => ({
      id: source.id,
      label: source.config.database || source.label,
      live: hasSession(source.id),
    }))
    : sources.map((source) => ({ id: source.id, label: source.label, live: false }));
  const dialog = sourceDialog;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (dialog) {
      setConnectedLabel(null);
      return;
    }
    setConnectedLabel(null);
  }, [dialog]);

  useEffect(() => {
    if (!dialog) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeSourceDialog();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [dialog, closeSourceDialog]);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (event: MouseEvent) => {
      if (!switcherRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <>
      {showChrome ? (
      <div className="source-toolbar">
        {pills.length ? (
          <div className="source-switcher" ref={switcherRef}>
            <button
              type="button"
              className="source-switcher-toggle"
              aria-expanded={menuOpen}
              aria-haspopup="listbox"
              aria-label="Seleccionar fuente"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="source-pills" aria-hidden="true">
                {pills.map((source) => (
                  <span
                    key={source.id}
                    className={`source-pill ${source.id === activeSourceId ? "is-active" : ""}`}
                    title={source.label}
                  >
                    <Database size={12} aria-hidden="true" />
                    <span>{source.label}</span>
                  </span>
                ))}
              </span>
              <ChevronDown size={14} aria-hidden="true" />
            </button>
            {menuOpen ? (
              <ul className="source-switcher-menu" role="listbox" aria-label="Fuentes">
                {pills.map((source) => (
                  <li key={source.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={source.id === activeSourceId}
                      className={source.id === activeSourceId ? "is-active" : ""}
                      onClick={() => {
                        setActiveSourceId(source.id);
                        setMenuOpen(false);
                      }}
                    >
                      <Database size={14} aria-hidden="true" />
                      <span>
                        <strong>{source.label}</strong>
                        <small>{source.live ? "Sesión activa" : "Sin sesión"}</small>
                      </span>
                      {source.id === activeSourceId ? <Check size={14} aria-hidden="true" /> : null}
                    </button>
                  </li>
                ))}
                <li>
                  <button type="button" onClick={() => { setMenuOpen(false); openSourceDialog("manage"); }}>
                    Administrar fuentes
                  </button>
                </li>
              </ul>
            ) : null}
          </div>
        ) : null}
        <button
          type="button"
          className="icon-tool"
          onClick={() => openSourceDialog("add", "database")}
          aria-label="Agregar fuente"
          title="Agregar fuente"
        >
          <Plus size={16} />
        </button>
      </div>
      ) : null}

      {mounted && dialog ? createPortal(
        <div className="drawer-backdrop" onClick={closeSourceDialog} role="presentation">
          <aside className="source-drawer" role="dialog" aria-modal="true" aria-labelledby="source-dialog-title" onClick={(event) => event.stopPropagation()}>
            <div className="dialog-head">
              <div>
                <h2 id="source-dialog-title">{connectedLabel ? "Fuente lista" : dialog === "add" ? "Agregar conexión" : "Administrar fuentes"}</h2>
                <p className="section-copy">
                  {connectedLabel
                    ? "La fuente ya está en este espacio. Puedes ir a setup para revisar el mapa, o seguir en esta pantalla."
                    : "El schema arma el mapa. La conexión de base queda para que Inferir ejecute consultas de solo lectura. Las credenciales no se guardan en el API."}
                </p>
              </div>
              <button ref={closeRef} type="button" className="icon-tool" onClick={closeSourceDialog} aria-label="Cerrar"><X size={16} /></button>
            </div>
            <div className="drawer-body">
              {connectedLabel ? (
                <div className="source-connected">
                  <p>{connectedLabel}</p>
                  <div className="source-connected-actions">
                    <Link className="primary-button" href="/setup/map" onClick={closeSourceDialog}>Ir a setup</Link>
                    <button type="button" className="secondary-button" onClick={closeSourceDialog}>Seguir aquí</button>
                  </div>
                </div>
              ) : (
                <>
                  {dialog === "manage" ? (
                    <>
                      {businessId ? <p className="muted-copy">Negocio {businessId}</p> : null}
                      {querySources.length ? (
                        <SourceRoster
                          sources={querySources}
                          liveIds={querySources.filter((source) => hasSession(source.id)).map((source) => source.id)}
                          onRemove={removeSource}
                          compact
                        />
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
                              <button
                                type="button"
                                className="ghost-button source-remove"
                                onClick={() => removeSource(source.id)}
                                aria-label={`Eliminar ${source.label}`}
                              >
                                Eliminar
                              </button>
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
                      const label = await discoverFromConnection(config, engine);
                      setConnectedLabel(label);
                    }}
                    onSubmitSchema={async (snapshot) => {
                      const label = await discoverFromSchema(snapshot);
                      setConnectedLabel(label);
                    }}
                    isLoading={isLoading}
                    error={error}
                  />
                </>
              )}
            </div>
          </aside>
        </div>,
        document.body,
      ) : null}
    </>
  );
}
