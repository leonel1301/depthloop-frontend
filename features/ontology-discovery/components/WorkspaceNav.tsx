"use client";

import { CircleCheckBig, ListChecks, PanelLeftClose, PanelLeftOpen, ScanSearch, Sparkles, Table2 } from "lucide-react";

export type WorkspaceView = "structure" | "review";

type Props = {
  current: WorkspaceView;
  collapsed: boolean;
  pending: number;
  total: number;
  reviewed: number;
  confidence: number;
  onSelect: (view: WorkspaceView) => void;
  onToggle: () => void;
};

const items: Array<{ id: WorkspaceView; label: string; detail: string; icon: typeof Table2 }> = [
  { id: "structure", label: "Estructura", detail: "Lo que entendimos", icon: ScanSearch },
  { id: "review", label: "Revisión", detail: "Lo que debes confirmar", icon: ListChecks },
];

export function WorkspaceNav({ current, collapsed, pending, total, reviewed, confidence, onSelect, onToggle }: Props) {
  const progress = total ? Math.round((reviewed / total) * 100) : 100;
  return (
    <aside className={`app-nav ${collapsed ? "collapsed" : ""}`} aria-label="Mapa">
      <div className="infer-nav-brand">
        <span className="map-nav-mark" aria-hidden="true"><Sparkles size={15} /></span>
        {collapsed ? null : (
          <span className="map-nav-title">
            <strong>Mapa semántico</strong>
            <small>Interpretación confirmada</small>
          </span>
        )}
        <button
          type="button"
          className="icon-tool"
          onClick={onToggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Mostrar panel" : "Ocultar panel"}
          title={collapsed ? "Mostrar panel" : "Ocultar panel"}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>
      <nav className="app-nav-list">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className={`app-nav-item ${current === item.id ? "active" : ""}`}
              onClick={() => onSelect(item.id)}
              aria-current={current === item.id ? "page" : undefined}
              aria-label={item.id === "review" && pending > 0 ? `${item.label}, ${pending} pendientes` : item.label}
              title={item.label}
            >
              <Icon size={16} aria-hidden="true" />
              {collapsed ? null : (
                <span className="app-nav-label">
                  <strong>{item.label}</strong>
                  <small>{item.detail}</small>
                </span>
              )}
              {item.id === "review" && pending > 0 ? (
                <span className="nav-count" aria-hidden="true">{pending}</span>
              ) : null}
            </button>
          );
        })}
      </nav>
      {collapsed ? null : (
        <div className="map-nav-proof">
          <div className="map-nav-proof-head">
            <CircleCheckBig size={15} />
            <span>{pending ? `${pending} por confirmar` : "Mapa confirmado"}</span>
            <strong>{progress}%</strong>
          </div>
          <div className="map-nav-progress" aria-label={`${progress}% revisado`}><i style={{ width: `${progress}%` }} /></div>
          <p>{Math.round(confidence * 100)}% de lectura global · el negocio conserva el control.</p>
        </div>
      )}
    </aside>
  );
}
