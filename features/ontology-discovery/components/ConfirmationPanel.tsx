"use client";

import { useEffect, useState, type ComponentType } from "react";
import { useI18n } from "@/features/i18n";
import type { ConfirmationItem, ConfirmationStatus } from "../models/confirmation";
import type { OntologyDiscoveryResult } from "../models/ontology";

type ReviewTableProps = {
  ontologyId: string;
  businessId: string;
  status: OntologyDiscoveryResult["status"];
  items: ConfirmationItem[];
  reviewed: number;
  onSelect: (id: string) => void;
  onUpdate: (itemId: string, status: ConfirmationStatus, corrections?: Record<string, string>) => void;
  onStatusChange: (status: OntologyDiscoveryResult["status"]) => void;
  onPublished: (ontology: OntologyDiscoveryResult) => void;
};

type Props = ReviewTableProps;

export function ConfirmationPanel(props: Props) {
  const { t } = useI18n();
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
      <section className="table-panel confirmation-panel" aria-busy="true" aria-label={t("review.loading")}>
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
      {...props}
    />
  );
}
