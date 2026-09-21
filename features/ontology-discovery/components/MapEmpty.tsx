"use client";

import { ArrowRight, CheckCircle2, Database, ScanSearch, ShieldCheck } from "lucide-react";
import { useI18n } from "@/features/i18n";
import { SourceRoster } from "./SourceRoster";
import type { QuerySource } from "../services/workspaceStore";

type Props = {
  onConnect: () => void;
  onSchema: () => void;
  connections?: QuerySource[];
  liveIds?: string[];
  onRemove: (id: string) => void;
  onReconnect?: (source: QuerySource) => void;
};

export function MapEmpty({ onConnect, onSchema, connections = [], liveIds = [], onRemove, onReconnect }: Props) {
  const { t } = useI18n();
  return (
    <section className="map-empty">
      <span className="map-empty-kicker"><ShieldCheck size={13} /> {t("mapEmpty.kicker")}</span>
      <h1>{t("mapEmpty.title")}</h1>
      <p>{t("mapEmpty.lead")}</p>
      <ol className="map-empty-journey">
        <li><span><Database size={16} /></span><div><strong>{t("mapEmpty.connect")}</strong><small>{t("mapEmpty.connectHint")}</small></div></li>
        <li><span><ScanSearch size={16} /></span><div><strong>{t("mapEmpty.interpret")}</strong><small>{t("mapEmpty.interpretHint")}</small></div></li>
        <li><span><CheckCircle2 size={16} /></span><div><strong>{t("mapEmpty.confirm")}</strong><small>{t("mapEmpty.confirmHint")}</small></div></li>
      </ol>
      <SourceRoster sources={connections} liveIds={liveIds} onRemove={onRemove} onReconnect={onReconnect} />
      <div className="map-empty-actions">
        <button type="button" className="primary-button" onClick={onConnect}>{t("mapEmpty.connectSource")} <ArrowRight size={15} /></button>
        <button type="button" className="secondary-button" onClick={onSchema}>{t("mapEmpty.useSchema")}</button>
      </div>
    </section>
  );
}
