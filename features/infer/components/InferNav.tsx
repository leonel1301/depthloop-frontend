"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Database, MessageSquare, PanelLeftClose, PanelLeftOpen, Plus, Search, Settings2, Trash2 } from "lucide-react";
import { CompanyBrand } from "@/features/auth/components/CompanyBrand";
import { UserProfile } from "@/features/auth/components/UserProfile";
import { useI18n } from "@/features/i18n";
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
  const { t, locale } = useI18n();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const dateLocale = locale === "en" ? "en" : "es";
  const filteredThreads = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(dateLocale);
    if (!query) return threads;
    return threads.filter((thread) => thread.title.toLocaleLowerCase(dateLocale).includes(query));
  }, [search, threads, dateLocale]);

  const threadTitle = (title: string) => (
    title === "Nueva conversación" || title === "New conversation" ? t("infer.newChat") : title
  );

  return (
    <aside className={`app-nav infer-nav ${collapsed ? "collapsed" : ""}`} aria-label={t("infer.conversations")}>
      <div className="infer-nav-brand">
        <span className="infer-brand-main">{collapsed ? <CompanyBrand compact href="/" /> : <CompanyBrand href="/" />}</span>
        <span className="infer-brand-mobile"><CompanyBrand compact href="/" /></span>
      </div>

      <button
        type="button"
        className="infer-nav-collapse"
        onClick={onToggle}
        aria-expanded={!collapsed}
        aria-label={collapsed ? t("infer.expand") : t("infer.collapse")}
        title={collapsed ? t("infer.expand") : t("infer.collapse")}
      >
        {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
      </button>

      <button type="button" className="infer-new-chat" onClick={onCreateChat} title={t("infer.newChat")}>
        <Plus size={16} aria-hidden="true" />
        {collapsed ? null : <span>{t("infer.newChat")}</span>}
      </button>

      {collapsed ? null : (
        <>
          <div className="infer-nav-chats-head">
            <h2>{t("infer.history")}</h2>
            <span>{threads.length}</span>
          </div>
          <label className="infer-history-search">
            <Search size={14} aria-hidden="true" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("infer.search")}
              aria-label={t("infer.search")}
            />
          </label>
        </>
      )}

      <nav className="app-nav-list infer-chat-list">
        {filteredThreads.map((thread) => {
          const title = threadTitle(thread.title);
          return (
            <div key={thread.id} className={`infer-chat-row ${thread.id === activeId ? "active" : ""}`}>
              <button
                type="button"
                className={`app-nav-item ${thread.id === activeId ? "active" : ""}`}
                onClick={() => onSelect(thread.id)}
                aria-current={thread.id === activeId ? "page" : undefined}
                title={title}
              >
                <span className="infer-thread-icon"><MessageSquare size={14} aria-hidden="true" /></span>
                {collapsed ? null : (
                  <span className="infer-thread-copy">
                    <strong>{title}</strong>
                    <small>{relativeDate(thread.updatedAt, dateLocale, t("infer.yesterday"))}</small>
                  </span>
                )}
              </button>
              {collapsed ? null : (
                <button
                  type="button"
                  className="icon-tool infer-chat-delete"
                  onClick={() => onRemove(thread.id)}
                  aria-label={`${t("common.delete")} ${title}`}
                  title={t("common.delete")}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          );
        })}
        {!collapsed && filteredThreads.length === 0 ? (
          <p className="infer-history-empty">{t("infer.empty")}</p>
        ) : null}
      </nav>

      <div className="infer-nav-foot">
        <div className="infer-nav-tools">
          <button type="button" className="app-nav-item" onClick={onAdd} title={t("infer.addSource")} aria-label={t("infer.addSource")}>
            <Database size={16} aria-hidden="true" />
            {collapsed ? null : <span className="app-nav-label">{t("infer.dataSources")}</span>}
          </button>
          <button
            type="button"
            className="app-nav-item infer-nav-config"
            title={t("common.settings")}
            onClick={() => router.push("/settings")}
          >
            <Settings2 size={16} aria-hidden="true" />
            {collapsed ? null : <span className="app-nav-label">{t("common.settings")}</span>}
          </button>
        </div>
        <UserProfile compact={collapsed} />
      </div>
    </aside>
  );
}

function relativeDate(timestamp: number, locale: string, yesterday: string) {
  const date = new Date(timestamp);
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const days = Math.round((startToday - startDate) / 86_400_000);
  if (days <= 0) return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  if (days === 1) return yesterday;
  if (days < 7) return date.toLocaleDateString(locale, { weekday: "long" });
  return date.toLocaleDateString(locale, { day: "numeric", month: "short" });
}
