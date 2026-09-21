"use client";

import { useCallback, useMemo, useState } from "react";
import { ArrowRight, ArrowUpDown, Check, CheckCircle2, CircleX, LoaderCircle, Pencil, RotateCcw, Save, ShieldCheck, Sparkles, X } from "lucide-react";
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState } from "./tableLib";
import { useI18n } from "@/features/i18n";
import type { ConfirmationItem, ConfirmationStatus } from "../models/confirmation";
import type { OntologyDiscoveryResult } from "../models/ontology";
import { ontologyApi } from "../services/ontologyApi";

export type ReviewTableProps = {
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

function sourceField(item: ConfirmationItem) {
  if (item.itemType === "entity") return item.suggestion.table || item.suggestion.name;
  return item.suggestion.column || item.suggestion.table || "—";
}

function OriginTags({ table, column }: { table?: string; column?: string }) {
  const { t } = useI18n();
  if (!table && !column) return null;
  return (
    <div className="review-origin">
      {table ? <span className="origin-tag">{t("review.table", { name: table })}</span> : null}
      {column ? <span className="origin-tag">columna {column}</span> : null}
    </div>
  );
}

export function ReviewTable({ ontologyId, businessId, status, items, reviewed, onSelect, onUpdate, onStatusChange, onPublished }: ReviewTableProps) {
  const { t } = useI18n();
  const typeLabels = useMemo(
    () => ({ entity: t("review.concept"), attribute: t("review.field"), relation: t("review.link") }),
    [t],
  );
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [sorting, setSorting] = useState<SortingState>([{ id: "confidence", desc: false }]);
  const [editingId, setEditingId] = useState<string>();
  const [draft, setDraft] = useState({ name: "", type: "" });
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [justPublished, setJustPublished] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const pending = items.length - reviewed;
  const visible = useMemo(
    () => (filter === "pending" ? items.filter((item) => item.status === "pending") : items),
    [filter, items],
  );
  const progress = items.length ? (reviewed / items.length) * 100 : 100;
  const updateItem = useCallback((itemId: string, nextStatus: ConfirmationStatus, corrections?: Record<string, string>) => {
    setDirty(true);
    setSaved(false);
    setJustPublished(false);
    onUpdate(itemId, nextStatus, corrections);
  }, [onUpdate]);

  const columns = useMemo<ColumnDef<ConfirmationItem>[]>(() => [
    {
      accessorKey: "itemType",
      header: t("review.youReview"),
      cell: ({ getValue }) => <span className="review-type">{typeLabels[getValue() as ConfirmationItem["itemType"]]}</span>,
    },
    {
      id: "name",
      accessorFn: (row) => row.corrections?.name || row.suggestion.name,
      header: t("review.understood"),
      cell: ({ row }) => {
        const item = row.original;
        if (editingId === item.itemId) {
          return <input aria-label={t("review.name")} value={draft.name} onClick={(event) => event.stopPropagation()} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />;
        }
        const name = item.corrections?.name || item.suggestion.name;
        return (
          <button
            type="button"
            className="review-map-link"
            title={t("review.openInMap")}
            aria-label={t("review.openInMapNamed", { name })}
            onClick={() => onSelect(item.entityId)}
          >
            <span>{name}</span>
            <ArrowRight size={13} aria-hidden="true" />
          </button>
        );
      },
    },
    {
      id: "sourceField",
      accessorFn: (row) => sourceField(row),
      header: t("review.origin"),
      cell: ({ row }) => <span className="mono source-reference">{sourceField(row.original)}</span>,
    },
    {
      id: "context",
      accessorFn: (row) => row.suggestion.context || "",
      header: t("review.context"),
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="review-where">
            <span>{item.suggestion.context}</span>
            <OriginTags table={item.suggestion.table} column={item.suggestion.column} />
          </div>
        );
      },
    },
    {
      id: "confidence",
      accessorFn: (row) => row.suggestion.confidence,
      header: t("review.readingCol"),
      cell: ({ getValue }) => {
        const value = getValue<number>();
        return (
          <span className={`confidence-pill ${value < 0.7 ? "low" : ""}`}>
            {Math.round(value * 100)}%
          </span>
        );
      },
    },
    {
      id: "actions",
      header: t("review.action"),
      enableSorting: false,
      cell: ({ row }) => {
        const item = row.original;
        const editing = editingId === item.itemId;
        return (
          <div className="row-actions" onClick={(event) => event.stopPropagation()}>
            {editing ? (
              <>
                <button type="button" className="confirm-action" onClick={() => { updateItem(item.itemId, "confirmed", { name: draft.name, type: draft.type }); setEditingId(undefined); }}>
                  <Check size={14} /> {t("review.applyShort")}
                </button>
                <button type="button" className="cancel-action" onClick={() => setEditingId(undefined)}>
                  <X size={14} /> {t("common.cancel")}
                </button>
              </>
            ) : item.status === "pending" ? (
              <>
                <button type="button" className="confirm-action" onClick={() => updateItem(item.itemId, "confirmed")}><Check size={14} /> {t("review.confirm")}</button>
                <button type="button" aria-label={t("review.correct")} title={t("review.correct")} onClick={() => { setEditingId(item.itemId); setDraft({ name: item.corrections?.name || item.suggestion.name, type: item.corrections?.type || item.suggestion.type }); }}><Pencil size={14} /></button>
                <button type="button" aria-label={t("review.discard")} title={t("review.discardShort")} onClick={() => updateItem(item.itemId, "rejected")}><X size={14} /></button>
              </>
            ) : (
              <>
                <span className={`status-label ${item.status}`}>
                  {item.status === "confirmed" ? <><CheckCircle2 size={13} /> {t("review.confirmed")}</> : <><CircleX size={13} /> {t("review.discarded")}</>}
                </span>
                <button type="button" aria-label={t("review.correct")} title={t("review.correct")} onClick={() => { setEditingId(item.itemId); setDraft({ name: item.corrections?.name || item.suggestion.name, type: item.corrections?.type || item.suggestion.type }); }}><Pencil size={14} /></button>
                <button type="button" aria-label={t("review.undo")} onClick={() => updateItem(item.itemId, "pending")}><RotateCcw size={14} /></button>
              </>
            )}
          </div>
        );
      },
    },
  ], [draft, editingId, onSelect, t, typeLabels, updateItem]);

  const table = useReactTable({
    data: visible,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const result = await ontologyApi.confirmOntology(ontologyId, items);
      onStatusChange(result.status);
      setDirty(false);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2600);
    } catch {
      setSaveError(t("review.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    setPublishing(true);
    setSaveError(null);
    try {
      if (dirty || status !== "reviewed") {
        const result = await ontologyApi.confirmOntology(ontologyId, items);
        onStatusChange(result.status);
      }
      const document = await ontologyApi.publish(businessId, ontologyId);
      onPublished(document);
      setDirty(false);
      setJustPublished(true);
      window.setTimeout(() => setJustPublished(false), 2600);
    } catch {
      setSaveError(t("review.publishError"));
    } finally {
      setPublishing(false);
    }
  };

  return (
    <section className="table-panel confirmation-panel">
      <div className="panel-heading review-heading">
        <div className="panel-heading-copy">
          <span className="panel-eyebrow"><ShieldCheck size={12} /> {t("review.kicker")}</span>
          <h2>{t("review.title")}</h2>
          <p>{t("review.lead")}</p>
        </div>
        <div className="panel-heading-meta">
          <div className="review-progress-copy">
            <strong>{reviewed}<span>/{items.length}</span></strong>
            <small>{t("review.readyDecisions")}</small>
          </div>
          <div className="filter-tabs compact" role="group" aria-label={t("review.filter")}>
            <button type="button" aria-pressed={filter === "pending"} className={filter === "pending" ? "selected" : ""} onClick={() => setFilter("pending")}>{t("review.pendingFilter")} <span>{pending}</span></button>
            <button type="button" aria-pressed={filter === "all"} className={filter === "all" ? "selected" : ""} onClick={() => setFilter("all")}>{t("review.all")} <span>{items.length}</span></button>
          </div>
        </div>
      </div>
      <div className="review-progress-track" role="progressbar" aria-label={t("review.progress")} aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={reviewed}>
        <i style={{ width: `${progress}%` }} />
      </div>

      <div className="table-scroll">
        <table className="data-table review-table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        className={`sort-head ${header.column.getCanSort() ? "sortable" : ""}`}
                        onClick={header.column.getToggleSortingHandler()}
                        disabled={!header.column.getCanSort()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() ? <ArrowUpDown size={12} /> : null}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length ? table.getRowModel().rows.map((row) => {
              const item = row.original;
              const editing = editingId === item.itemId;
              return (
                <tr key={row.id} className={`${editing ? "editing" : ""} ${item.status !== "pending" ? "resolved" : ""}`}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={columns.length}>
                  <div className="empty-state compact">
                    <CheckCircle2 size={22} />
                    <strong>Nada pendiente</strong>
                    <span>Todo lo dudoso de este filtro está revisado.</span>
                    {filter === "pending" ? (
                      <button type="button" className="ghost-button" onClick={() => setFilter("all")}>Ver todos</button>
                    ) : null}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="save-bar">
        {saveError ? <p className="form-error save-error" role="alert">{saveError}</p> : null}
        <div className="save-bar-context">
          <span><Sparkles size={15} /></span>
          <p><strong>{t("review.draftContextTitle")}</strong><small>{t("review.draftContextCopy")}</small></p>
        </div>
        <div className="save-bar-actions">
          <button type="button" className="secondary-button" disabled={saving || publishing || (status === "published" && !dirty)} onClick={() => void save()}>
            {saving ? <LoaderCircle className="spin" size={16} /> : saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
            {saving ? t("common.saving") : saved ? t("review.saved") : t("review.saveDraft")}
          </button>
          <button
            type="button"
            className="primary-button"
            disabled={pending > 0 || saving || publishing || (status === "published" && !dirty)}
            title={pending > 0 ? t("review.publishBlocked") : undefined}
            onClick={() => void publish()}
          >
            {publishing ? <LoaderCircle className="spin" size={16} /> : (status === "published" && !dirty) || justPublished ? <CheckCircle2 size={16} /> : <ShieldCheck size={16} />}
            {publishing ? t("review.publishing") : (status === "published" && !dirty) || justPublished ? t("review.published") : t("review.publish")}
          </button>
          <a className="secondary-button continue-button" href="/setup/knowledge">Continuar a Negocio <ArrowRight size={16} /></a>
        </div>
      </div>
    </section>
  );
}
