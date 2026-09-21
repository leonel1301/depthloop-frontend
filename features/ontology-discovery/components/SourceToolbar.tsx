"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Check, ChevronDown, Database, Plus, X } from "lucide-react";
import { useI18n } from "@/features/i18n";
import { DbConnector } from "./DbConnector";
import { SourceRoster } from "./SourceRoster";
import { useOntologyDiscovery } from "../hooks/useOntologyDiscovery";

export function SourceToolbar({ showChrome = true }: { showChrome?: boolean }) {
  const { t } = useI18n();
  const {
    sources,
    querySources,
    businessId,
    isLoading,
    error,
    sourceDialog,
    reconnectSource,
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
  const [connectedIntent, setConnectedIntent] = useState<"connect" | "discover">("discover");
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
              aria-label={t("sources.select")}
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
              <ul className="source-switcher-menu" role="listbox" aria-label={t("sources.list")}>
                {pills.map((source) => (
                  <li key={source.id} className={source.live ? undefined : "has-reconnect"}>
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
                        <small>{source.live ? t("sources.live") : t("sources.idle")}</small>
                      </span>
                      {source.id === activeSourceId ? <Check size={14} aria-hidden="true" /> : null}
                    </button>
                    {source.live ? null : (
                      <button
                        type="button"
                        className="source-switcher-reconnect"
                        onClick={() => {
                          const target = querySources.find((item) => item.id === source.id);
                          setMenuOpen(false);
                          if (target) openSourceDialog("reconnect", "database", target);
                        }}
                      >
                        {t("sources.reconnect")}
                      </button>
                    )}
                  </li>
                ))}
                <li>
                  <button type="button" onClick={() => { setMenuOpen(false); openSourceDialog("manage"); }}>
                    {t("sources.manage")}
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
          aria-label={t("sources.add")}
          title={t("sources.add")}
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
                <h2 id="source-dialog-title">{connectedLabel ? t("sources.ready") : dialog === "reconnect" ? t("sources.reconnectTitle") : dialog === "add" ? t("sources.addConnection") : t("sources.manage")}</h2>
                <p className="section-copy">
                  {connectedLabel
                    ? connectedIntent === "connect" ? t("sources.readySessionCopy") : t("sources.readyCopy")
                    : dialog === "reconnect"
                      ? t("sources.reconnectCopy")
                      : dialog === "manage"
                        ? t("sources.browserCopy")
                        : t("sources.addCopy")}
                </p>
              </div>
              <button ref={closeRef} type="button" className="icon-tool" onClick={closeSourceDialog} aria-label={t("common.close")}><X size={16} /></button>
            </div>
            <div className="drawer-body">
              {connectedLabel ? (
                <div className="source-connected">
                  <p>{connectedLabel}</p>
                  <div className="source-connected-actions">
                    <Link className="primary-button" href="/setup/map" onClick={closeSourceDialog}>{t("sources.goSetup")}</Link>
                    <button type="button" className="secondary-button" onClick={closeSourceDialog}>{t("sources.stay")}</button>
                  </div>
                </div>
              ) : (
                <>
                  {dialog === "manage" ? (
                    <>
                      {businessId ? <p className="muted-copy">{t("sources.business", { id: businessId })}</p> : null}
                      {querySources.length ? (
                        <SourceRoster
                          sources={querySources}
                          liveIds={querySources.filter((source) => hasSession(source.id)).map((source) => source.id)}
                          onRemove={removeSource}
                          onReconnect={(source) => openSourceDialog("reconnect", "database", source)}
                          compact
                        />
                      ) : sources.length ? (
                        <ul className="source-roster">
                          {sources.map((source) => (
                            <li key={source.id} className="source-row">
                              <div className="source-row-body">
                                <div className="source-row-head">
                                  <h3>{source.label}</h3>
                                  <span className="source-status">{source.kind === "schema" ? t("sources.schema") : source.engine || t("sources.source")}</span>
                                </div>
                              </div>
                              <button
                                type="button"
                                className="ghost-button source-remove"
                                onClick={() => removeSource(source.id)}
                                aria-label={t("sources.deleteNamed", { name: source.label })}
                              >
                                {t("common.delete")}
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="muted-copy">{t("sources.empty")}</p>
                      )}
                    </>
                  ) : null}
                  {dialog === "manage" ? null : (
                  <DbConnector
                    key={reconnectSource?.id ?? intakeMode}
                    initialMode={intakeMode}
                    reconnect={dialog === "reconnect"}
                    initialConnection={reconnectSource ? {
                      ...reconnectSource.config,
                      engine: reconnectSource.engine,
                      kind: reconnectSource.kind,
                    } : undefined}
                    onSubmitConnection={async (config, engine, intent) => {
                      const label = await discoverFromConnection(config, engine, intent);
                      setConnectedIntent(intent);
                      setConnectedLabel(label);
                    }}
                    onSubmitSchema={async (snapshot) => {
                      const label = await discoverFromSchema(snapshot);
                      setConnectedIntent("discover");
                      setConnectedLabel(label);
                    }}
                    isLoading={isLoading}
                    error={error}
                  />
                  )}
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
