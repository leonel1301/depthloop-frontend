"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Check, ChevronDown, ChevronUp, Copy, Rows3 } from "lucide-react";
import type { QueryTable } from "../../ontology-discovery/services/queryApi";

type Props = {
  table: QueryTable;
};

function cell(value: string | number | boolean | null) {
  if (value == null) return "—";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  return String(value);
}

export function QueryResultTable({ table }: Props) {
  const [sort, setSort] = useState<{ index: number; direction: "asc" | "desc" } | null>(null);
  const [visibleRows, setVisibleRows] = useState(8);
  const [copied, setCopied] = useState(false);

  const numericColumns = useMemo(
    () => table.columns.map((_, index) => table.rows.some((row) => typeof row[index] === "number")),
    [table.columns, table.rows],
  );
  const rows = useMemo(() => {
    if (!sort) return table.rows;
    return [...table.rows].sort((a, b) => compareValues(a[sort.index], b[sort.index]) * (sort.direction === "asc" ? 1 : -1));
  }, [sort, table.rows]);

  if (!table.columns.length) {
    return (
      <div className="infer-table-empty">
        <Rows3 size={17} />
        <span>Esta consulta no devolvió columnas.</span>
      </div>
    );
  }

  const shownRows = rows.slice(0, visibleRows);
  const remaining = Math.max(0, rows.length - visibleRows);

  const toggleSort = (index: number) => {
    setSort((current) => {
      if (!current || current.index !== index) return { index, direction: "asc" };
      if (current.direction === "asc") return { index, direction: "desc" };
      return null;
    });
  };

  const copyTable = async () => {
    const content = [table.columns, ...table.rows]
      .map((row) => row.map((value) => csvCell(cell(value))).join(","))
      .join("\n");
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="infer-table-card">
      <div className="infer-table-toolbar">
        <span className="infer-table-count"><Rows3 size={14} /> {table.rowCount} {table.rowCount === 1 ? "fila" : "filas"}</span>
        {table.truncated ? <span className="infer-table-badge">Resultado parcial</span> : null}
        <button type="button" className="infer-table-action" onClick={() => void copyTable()} aria-label="Copiar tabla">
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? "Copiada" : "Copiar CSV"}</span>
        </button>
      </div>

      <div className="infer-table-scroll" tabIndex={0} aria-label="Resultado de la consulta">
        <table className="query-preview infer-result-table">
          <thead>
            <tr>
              {table.columns.map((column, index) => {
                const direction = sort?.index === index ? sort.direction : null;
                return (
                  <th
                    key={`${column}-${index}`}
                    className={numericColumns[index] ? "is-numeric" : undefined}
                    aria-sort={direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none"}
                  >
                    <button type="button" onClick={() => toggleSort(index)} title={`Ordenar por ${column}`}>
                      <span>{column}</span>
                      {direction === "asc" ? <ArrowUp size={12} /> : direction === "desc" ? <ArrowDown size={12} /> : <ArrowUpDown size={12} />}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {shownRows.length ? shownRows.map((row, index) => (
              <tr key={`${sort?.index ?? "base"}-${index}`} style={{ animationDelay: `${Math.min(index, 10) * 38}ms` }}>
                {table.columns.map((column, cellIndex) => {
                  const value = row[cellIndex] ?? null;
                  return (
                    <td
                      key={`${column}-${cellIndex}`}
                      className={`${numericColumns[cellIndex] ? "is-numeric " : ""}${value == null ? "is-null" : ""}`.trim() || undefined}
                      title={value == null ? undefined : cell(value)}
                    >
                      {typeof value === "boolean" ? <span className="infer-boolean">{cell(value)}</span> : cell(value)}
                    </td>
                  );
                })}
              </tr>
            )) : (
              <tr className="infer-table-no-rows">
                <td colSpan={table.columns.length}>La consulta no devolvió filas.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {rows.length > 0 ? (
        <div className="infer-table-footer">
          <span>Mostrando {Math.min(visibleRows, rows.length)} de {rows.length}</span>
          {remaining > 0 ? (
            <button type="button" onClick={() => setVisibleRows((count) => count + 8)}>
              Mostrar {Math.min(8, remaining)} más <ChevronDown size={13} />
            </button>
          ) : rows.length > 8 ? (
            <button type="button" onClick={() => setVisibleRows(8)}>
              Mostrar menos <ChevronUp size={13} />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function compareValues(a: string | number | boolean | null, b: string | number | boolean | null) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "es", { numeric: true, sensitivity: "base" });
}

function csvCell(value: string) {
  if (!/[",\n]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
}
