"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Database, MessageSquare, PanelLeftClose, PanelLeftOpen, Plus, Search, Settings2, Trash2 } from "lucide-react";
import { ThemeToggle } from "@/features/setup/components/ThemeToggle";
import { CompanyBrand } from "@/features/auth/components/CompanyBrand";
import { UserProfile } from "@/features/auth/components/UserProfile";
import type { InferThread } from "../models";

type Props = {
  collapsed: boolean;
  businessId?: string;
  threads: InferThread[];
  activeId: string;
  onToggle: () => void;
  onAdd: () => void;
  onCreateChat: () => void;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
};

export function InferNav({
  collapsed,
  threads,
  activeId,
  onToggle,
  onAdd,
  onCreateChat,
  onSelect,
  onRemove,
}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const filteredThreads = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es");
    if (!query) return threads;
    return threads.filter((thread) => thread.title.toLocaleLowerCase("es").includes(query));
  }, [search, threads]);

  return (
    <aside className={`app-nav infer-nav ${collapsed ? "collapsed" : ""}`} aria-label="Conversaciones">
      <div className="infer-nav-brand">
        <span className="infer-brand-main">{collapsed ? <CompanyBrand compact href="/" /> : <CompanyBrand href="/" />}</span>
        <span className="infer-brand-mobile"><CompanyBrand compact href="/" /></span>
      </div>

      <button
        type="button"
        className="infer-nav-collapse"
        onClick={onToggle}
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Expandir historial" : "Contraer historial"}
        title={collapsed ? "Expandir historial" : "Contraer historial"}
      >
        {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
      </button>

      <button type="button" className="infer-new-chat" onClick={onCreateChat} title="Nueva conversación">
        <Plus size={16} aria-hidden="true" />
        {collapsed ? null : <span>Nueva conversación</span>}
      </button>

      {collapsed ? null : (
        <>
          <div className="infer-nav-chats-head">
            <h2>Historial</h2>
            <span>{threads.length}</span>
          </div>
          <label className="infer-history-search">
            <Search size={14} aria-hidden="true" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar conversaciones"
              aria-label="Buscar conversaciones"
            />
          </label>
        </>
      )}

      <nav className="app-nav-list infer-chat-list">
        {filteredThreads.map((thread) => (
          <div key={thread.id} className={`infer-chat-row ${thread.id === activeId ? "active" : ""}`}>
            <button
              type="button"
              className={`app-nav-item ${thread.id === activeId ? "active" : ""}`}
              onClick={() => onSelect(thread.id)}
              aria-current={thread.id === activeId ? "page" : undefined}
              title={thread.title}
            >
              <span className="infer-thread-icon"><MessageSquare size={14} aria-hidden="true" /></span>
              {collapsed ? null : (
                <span className="infer-thread-copy">
                  <strong>{thread.title}</strong>
                  <small>{relativeDate(thread.updatedAt)}</small>
                </span>
              )}
            </button>
            {collapsed ? null : (
              <button
                type="button"
                className="icon-tool infer-chat-delete"
                onClick={() => onRemove(thread.id)}
                aria-label={`Eliminar ${thread.title}`}
                title="Eliminar"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
        {!collapsed && filteredThreads.length === 0 ? (
          <p className="infer-history-empty">No encontramos conversaciones.</p>
        ) : null}
      </nav>

      <div className="infer-nav-foot">
        <div className="infer-nav-tools">
          <button type="button" className="app-nav-item" onClick={onAdd} title="Añadir fuente" aria-label="Añadir fuente">
            <Database size={16} aria-hidden="true" />
            {collapsed ? null : <span className="app-nav-label">Fuentes de datos</span>}
          </button>
          <button
            type="button"
            className="app-nav-item infer-nav-config"
            title="Configuración"
            onClick={() => router.push("/settings")}
          >
            <Settings2 size={16} aria-hidden="true" />
            {collapsed ? null : <span className="app-nav-label">Configuración</span>}
          </button>
          <ThemeToggle showLabel={!collapsed} />
        </div>
        <UserProfile compact={collapsed} />
      </div>
    </aside>
  );
}

function relativeDate(timestamp: number) {
  const date = new Date(timestamp);
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const days = Math.round((startToday - startDate) / 86_400_000);
  if (days <= 0) return date.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
  if (days === 1) return "Ayer";
  if (days < 7) return date.toLocaleDateString("es", { weekday: "long" });
  return date.toLocaleDateString("es", { day: "numeric", month: "short" });
}
