"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X } from "lucide-react";
import { useI18n } from "@/features/i18n";

export type SourceKindChoice = "database" | "excel" | "service" | "schema";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function AddSourceDialog({ open, onClose }: Props) {
  const { t } = useI18n();
  const [kind, setKind] = useState<SourceKindChoice>("database");
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const options: Array<{ id: SourceKindChoice; label: string; detail: string; intake: "database" | "service" | "schema" }> = [
    { id: "database", label: t("sources.database"), detail: t("sources.databaseDetail"), intake: "database" },
    { id: "excel", label: t("sources.excel"), detail: t("sources.excelDetail"), intake: "schema" },
    { id: "service", label: t("sources.api"), detail: t("sources.apiDetail"), intake: "service" },
    { id: "schema", label: t("sources.json"), detail: t("sources.jsonDetail"), intake: "schema" },
  ];

  const selected = options.find((item) => item.id === kind) ?? options[0];

  return createPortal(
    <div className="dialog-backdrop" onClick={onClose} role="presentation">
      <div
        className="dialog-card add-source-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-source-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dialog-head">
          <div>
            <h2 id="add-source-title">{t("infer.addSource")}</h2>
            <p className="section-copy">Elige qué tipo de información quieres conectar.</p>
          </div>
          <button ref={closeRef} type="button" className="icon-tool" onClick={onClose} aria-label={t("common.close")}>
            <X size={16} />
          </button>
        </div>
        <ul className="add-source-list">
          {options.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`add-source-option ${kind === item.id ? "selected" : ""}`}
                onClick={() => setKind(item.id)}
                aria-pressed={kind === item.id}
              >
                <strong>{item.label}</strong>
                <span>{item.detail}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="add-source-actions">
          <Link className="primary-button" href={`/setup/map?intake=${selected.intake}`} onClick={onClose}>
            {t("auth.continue")}
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  );
}
