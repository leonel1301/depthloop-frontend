"use client";

import { useEffect, useState, type ComponentType } from "react";
import type { ConfirmationItem, ConfirmationStatus } from "../models/confirmation";

type ReviewTableProps = {
  ontologyId: string;
  items: ConfirmationItem[];
  reviewed: number;
  selectedId?: string;
  onSelect: (id: string) => void;
  onUpdate: (itemId: string, status: ConfirmationStatus, corrections?: Record<string, string>) => void;
};

type Props = ReviewTableProps;

export function ConfirmationPanel({ ontologyId, items, reviewed, selectedId, onSelect, onUpdate }: Props) {
  const [Table, setTable] = useState<ComponentType<ReviewTableProps> | null>(null);

  useEffect(() => {
    let active = true;
    void import("./ReviewTable").then((mod) => {
      if (active) setTable(() => mod.ReviewTable);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!Table) {
    return (
      <section className="table-panel confirmation-panel" aria-busy="true" aria-label="Cargando revisión">
        <div className="panel-heading">
          <div className="panel-heading-copy">
            <span className="panel-eyebrow">Validación del negocio</span>
            <h2>Preparando las decisiones del mapa</h2>
            <p>Ordenamos primero las interpretaciones que necesitan tu criterio.</p>
          </div>
        </div>
        <div className="table-skeleton">
          <i /><i /><i /><i /><i />
        </div>
      </section>
    );
  }

  return (
    <Table
      ontologyId={ontologyId}
      items={items}
      reviewed={reviewed}
      selectedId={selectedId}
      onSelect={onSelect}
      onUpdate={onUpdate}
    />
  );
}
