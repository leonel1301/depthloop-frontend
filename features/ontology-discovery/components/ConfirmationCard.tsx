"use client";

import { useState } from "react";
import { Check, CheckCircle2, Pencil, RotateCcw, X } from "lucide-react";
import { useI18n } from "@/features/i18n";
import type { ConfirmationItem, ConfirmationStatus } from "../models/confirmation";

type Props = { item: ConfirmationItem; active: boolean; onSelect: () => void; onUpdate: (status: ConfirmationStatus, corrections?: Record<string, string>) => void };

export function ConfirmationCard({ item, active, onSelect, onUpdate }: Props) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.corrections?.name || item.suggestion.name);
  const [type, setType] = useState(item.corrections?.type || item.suggestion.type);
  const percent = Math.round(item.suggestion.confidence * 100);
  const tone = percent >= 70 ? "medium" : "low";
  const labels = { entity: t("review.entity"), attribute: t("review.attribute"), relation: t("review.relation") };

  return (
    <article className={`confirmation-card ${active ? "active" : ""} ${item.status !== "pending" ? "resolved" : ""}`} onClick={onSelect}>
      <div className="card-topline"><span className="item-kind">{labels[item.itemType]}</span><span className={`confidence-pill ${tone}`}>{percent}%</span></div>
      {editing ? (
        <div className="edit-grid" onClick={(event) => event.stopPropagation()}>
          <label>{t("review.name")}<input value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label>{t("review.semanticType")}<input value={type} onChange={(e) => setType(e.target.value)} /></label>
          <button className="save-edit" onClick={() => { onUpdate("confirmed", { name, type }); setEditing(false); }}><Check size={14} /> {t("review.apply")}</button>
        </div>
      ) : (
        <><h3>{item.corrections?.name || item.suggestion.name}</h3><p><span>{item.corrections?.type || item.suggestion.type}</span> · {item.suggestion.context}</p></>
      )}

      <div className="card-actions" onClick={(event) => event.stopPropagation()}>
        {item.status === "pending" ? <>
          <button className="confirm-action" onClick={() => onUpdate("confirmed")}><Check size={15} /> {t("review.confirm")}</button>
          <button aria-label={t("review.edit")} onClick={() => setEditing((value) => !value)}><Pencil size={15} /></button>
          <button aria-label={t("review.reject")} onClick={() => onUpdate("rejected")}><X size={16} /></button>
        </> : <>
          <span className={`status-label ${item.status}`}><CheckCircle2 size={14} /> {item.status === "confirmed" ? t("review.confirmed") : t("review.rejected")}</span>
          <button onClick={() => onUpdate("pending")}><RotateCcw size={14} /> {t("review.undo")}</button>
        </>}
      </div>
    </article>
  );
}
