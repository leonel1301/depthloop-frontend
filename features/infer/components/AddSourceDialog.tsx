"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X } from "lucide-react";

export type SourceKindChoice = "database" | "excel" | "service" | "schema";

const options: Array<{ id: SourceKindChoice; label: string; detail: string; intake: "database" | "service" | "schema" }> = [
  { id: "database", label: "Base de datos", detail: "PostgreSQL, MySQL o SQL Server, en solo lectura.", intake: "database" },
  { id: "excel", label: "Excel", detail: "Incorpora la estructura de una hoja de cálculo.", intake: "schema" },
  { id: "service", label: "API", detail: "Conecta un servicio web durante esta sesión.", intake: "service" },
  { id: "schema", label: "Archivo JSON", detail: "Carga una estructura sin conectar la base de datos.", intake: "schema" },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export function AddSourceDialog({ open, onClose }: Props) {
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
            <h2 id="add-source-title">Añadir fuente</h2>
            <p className="section-copy">Elige qué tipo de información quieres conectar.</p>
          </div>
          <button ref={closeRef} type="button" className="icon-tool" onClick={onClose} aria-label="Cerrar">
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
            Continuar
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  );
}
