"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ConfirmationItem, ConfirmationStatus } from "../models/confirmation";
import type { OntologyDiscoveryResult } from "../models/ontology";
import { fieldLabel } from "../services/labels";

function tableRef(entity: { schema?: string; technicalName?: string; name: string }) {
  const table = entity.technicalName || entity.name;
  return entity.schema ? `${entity.schema}.${table}` : table;
}

function deriveItems(ontology: OntologyDiscoveryResult | null): ConfirmationItem[] {
  if (!ontology) return [];
  const threshold = ontology.metadata.confidenceThreshold ?? 0.9;
  const names = Object.fromEntries(ontology.entities.map((entity) => [entity.id, entity.name]));
  const tables = Object.fromEntries(ontology.entities.map((entity) => [entity.id, tableRef(entity)]));
  const entities = ontology.entities.filter((e) => e.confidence < threshold).map((e) => ({
    itemId: e.id, entityId: e.id, itemType: "entity" as const,
    suggestion: {
      name: e.name,
      type: e.type,
      confidence: e.confidence,
      context: `Tabla ${e.technicalName || e.name} · ${e.attributes.length} campos`,
      table: tableRef(e),
    },
    status: "pending" as const,
  }));
  const attributes = ontology.entities.flatMap((e) => e.attributes.filter((a) => a.confidence < threshold).map((a) => ({
    itemId: a.id, entityId: e.id, itemType: "attribute" as const,
    suggestion: {
      name: a.name,
      type: a.semanticType || a.dataType,
      confidence: a.confidence,
      context: `${e.name} · ${a.technicalName || a.name}`,
      table: tableRef(e),
      column: a.technicalName || a.name,
    },
    status: "pending" as const,
  })));
  const relations = ontology.relations.filter((r) => r.confidence < threshold).map((r) => ({
    itemId: r.id, entityId: r.from, itemType: "relation" as const,
    suggestion: {
      name: `${names[r.from] || r.from} → ${names[r.to] || r.to}`,
      type: r.cardinality,
      confidence: r.confidence,
      context: r.foreignKey ? `Se unen por ${fieldLabel(r.foreignKey)}` : "Relación inferida",
      table: tables[r.from],
      column: r.foreignKey || undefined,
    },
    status: "pending" as const,
  }));
  return [...entities, ...attributes, ...relations];
}

export function useConfirmations(
  ontology: OntologyDiscoveryResult | null,
  stored: ConfirmationItem[] = [],
  onPersist?: (items: ConfirmationItem[]) => void,
) {
  const derived = useMemo(() => deriveItems(ontology), [ontology]);
  const [confirmations, setConfirmations] = useState<ConfirmationItem[]>([]);
  const lastId = useRef<string | undefined>(undefined);
  const storedRef = useRef(stored);
  storedRef.current = stored;

  useEffect(() => {
    if (ontology?.id === lastId.current) return;
    lastId.current = ontology?.id;
    if (!ontology) {
      setConfirmations([]);
      onPersist?.([]);
      return;
    }
    const byId = new Map(storedRef.current.map((item) => [item.itemId, item]));
    const merged = derived.map((item) => {
      const previous = byId.get(item.itemId);
      if (!previous) return item;
      return { ...item, status: previous.status, corrections: previous.corrections };
    });
    setConfirmations(merged);
    onPersist?.(merged);
  }, [derived, onPersist, ontology]);

  const updateItem = (itemId: string, status: ConfirmationStatus, corrections?: Record<string, string>) => {
    setConfirmations((items) => {
      const next = items.map((item) => item.itemId === itemId ? { ...item, status, corrections: { ...item.corrections, ...corrections } } : item);
      onPersist?.(next);
      return next;
    });
  };

  return {
    confirmations,
    pending: confirmations.filter((item) => item.status === "pending"),
    reviewed: confirmations.filter((item) => item.status !== "pending").length,
    updateItem,
  };
}
