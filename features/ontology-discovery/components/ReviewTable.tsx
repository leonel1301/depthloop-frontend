"use client";

import { useMemo, useState } from "react";
import { ArrowRight, ArrowUpDown, Check, CheckCircle2, CircleX, LoaderCircle, Pencil, RotateCcw, Save, ShieldCheck, Sparkles, X } from "lucide-react";
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState } from "./tableLib";
import type { ConfirmationItem, ConfirmationStatus } from "../models/confirmation";
import { ontologyApi } from "../services/ontologyApi";

export type ReviewTableProps = {
  ontologyId: string;
  items: ConfirmationItem[];
  reviewed: number;
  selectedId?: string;
  onSelect: (id: string) => void;
  onUpdate: (itemId: string, status: ConfirmationStatus, corrections?: Record<string, string>) => void;
};

const typeLabels = { entity: "Concepto", attribute: "Campo", relation: "Vínculo" };

function sourceField(item: ConfirmationItem) {
  if (item.itemType === "entity") return item.suggestion.table || item.suggestion.name;
  return item.suggestion.column || item.suggestion.table || "—";
}

function OriginTags({ table, column }: { table?: string; column?: string }) {
  if (!table && !column) return null;
  return (
    <div className="review-origin">
      {table ? <span className="origin-tag">tabla {table}</span> : null}
      {column ? <span className="origin-tag">columna {column}</span> : null}
    </div>
  );
}

export function ReviewTable({ ontologyId, items, reviewed, selectedId, onSelect, onUpdate }: ReviewTableProps) {
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [sorting, setSorting] = useState<SortingState>([{ id: "confidence", desc: false }]);
  const [editingId, setEditingId] = useState<string>();
  const [draft, setDraft] = useState({ name: "", type: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const pending = items.length - reviewed;
  const visible = useMemo(
    () => (filter === "pending" ? items.filter((item) => item.status === "pending") : items),
    [filter, items],
  );
  const progress = items.length ? (reviewed / items.length) * 100 : 100;

  const columns = useMemo<ColumnDef<ConfirmationItem>[]>(() => [
    {
      accessorKey: "itemType",
      header: "Revisas",
      cell: ({ getValue }) => <span className="review-type">{typeLabels[getValue() as ConfirmationItem["itemType"]]}</span>,
    },
    {
      id: "name",
      accessorFn: (row) => row.corrections?.name || row.suggestion.name,
      header: "DepthLoop entendió",
      cell: ({ row }) => {
        const item = row.original;
        if (editingId === item.itemId) {
          return <input aria-label="Nombre" value={draft.name} onClick={(event) => event.stopPropagation()} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />;
        }
        return item.corrections?.name || item.suggestion.name;
      },
    },
    {
      id: "sourceField",
      accessorFn: (row) => sourceField(row),
      header: "Origen técnico",
      cell: ({ row }) => <span className="mono source-reference">{sourceField(row.original)}</span>,
    },
    {
      id: "context",
      accessorFn: (row) => row.suggestion.context || "",
      header: "Contexto",
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
      header: "Lectura",
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
      header: "Acción",
      enableSorting: false,
      cell: ({ row }) => {
        const item = row.original;
        const editing = editingId === item.itemId;
        return (
          <div className="row-actions" onClick={(event) => event.stopPropagation()}>
            {item.status === "pending" ? (
              editing ? (
                <button type="button" className="confirm-action" onClick={() => { onUpdate(item.itemId, "confirmed", { name: draft.name, type: draft.type }); setEditingId(undefined); }}>
                  <Check size={14} /> Aplicar
                </button>
              ) : (
                <>
                  <button type="button" className="confirm-action" onClick={() => onUpdate(item.itemId, "confirmed")}><Check size={14} /> Confirmar</button>
                  <button type="button" aria-label="Corregir interpretación" title="Corregir interpretación" onClick={() => { setEditingId(item.itemId); setDraft({ name: item.corrections?.name || item.suggestion.name, type: item.corrections?.type || item.suggestion.type }); }}><Pencil size={14} /></button>
                  <button type="button" aria-label="Descartar interpretación" title="Descartar" onClick={() => onUpdate(item.itemId, "rejected")}><X size={14} /></button>
                </>
              )
            ) : (
              <>
                <span className={`status-label ${item.status}`}>
                  {item.status === "confirmed" ? <><CheckCircle2 size={13} /> Confirmado</> : <><CircleX size={13} /> Descartado</>}
                </span>
                <button type="button" aria-label="Deshacer" onClick={() => onUpdate(item.itemId, "pending")}><RotateCcw size={14} /></button>
              </>
            )}
          </div>
        );
      },
    },
  ], [draft, editingId, onUpdate]);

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
      await ontologyApi.confirmOntology(ontologyId, items);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2600);
    } catch {
      setSaveError("No pudimos guardar la revisión. Inténtalo otra vez.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="table-panel confirmation-panel">
      <div className="panel-heading review-heading">
        <div className="panel-heading-copy">
          <span className="panel-eyebrow"><ShieldCheck size={12} /> Validación del negocio</span>
          <h2>Confirma lo que DepthLoop no debe decidir solo</h2>
          <p>Mostramos únicamente interpretaciones que necesitan criterio humano.</p>
        </div>
        <div className="panel-heading-meta">
          <div className="review-progress-copy">
            <strong>{reviewed}<span>/{items.length}</span></strong>
            <small>decisiones listas</small>
          </div>
          <div className="filter-tabs compact" role="group" aria-label="Filtrar revisión">
            <button type="button" aria-pressed={filter === "pending"} className={filter === "pending" ? "selected" : ""} onClick={() => setFilter("pending")}>Pendientes <span>{pending}</span></button>
            <button type="button" aria-pressed={filter === "all"} className={filter === "all" ? "selected" : ""} onClick={() => setFilter("all")}>Todos</button>
          </div>
        </div>
      </div>
      <div className="review-progress-track" role="progressbar" aria-label="Progreso de revisión" aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={reviewed}>
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
              const active = selectedId === item.entityId || selectedId === item.itemId;
              return (
                <tr key={row.id} className={`${active ? "active" : ""} ${item.status !== "pending" ? "resolved" : ""}`} onClick={() => onSelect(item.entityId)}>
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
          <p><strong>Cada decisión mejora el mapa</strong><small>Inferir usará estas definiciones como contexto confirmado.</small></p>
        </div>
        <div className="save-bar-actions">
          <button type="button" className="secondary-button" disabled={saving} onClick={() => void save()}>
            {saving ? <LoaderCircle className="spin" size={16} /> : saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
            {saving ? "Guardando…" : saved ? "Revisión guardada" : "Guardar revisión"}
          </button>
          <a className="primary-button continue-button" href="/setup/knowledge">
            Continuar a Negocio <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
