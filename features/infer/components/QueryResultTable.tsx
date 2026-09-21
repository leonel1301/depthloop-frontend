"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Check, ChevronDown, ChevronUp, Copy, Rows3 } from "lucide-react";
import { useI18n, type MessageKey } from "@/features/i18n";
import type { QueryTable } from "../../ontology-discovery/services/queryApi";
import { ResultVisualization, isToolCompatible } from "@/features/tools/components/ResultVisualization";
import { ToolIcon } from "@/features/tools/components/ToolIcon";
import type { ToolId } from "@/features/tools/models";

type Props = {
  table: QueryTable;
  tools?: ToolId[];
  preferredTools?: ToolId[];
};

function cell(value: string | number | boolean | null) {
  if (value == null) return "—";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  return String(value);
}

export function QueryResultTable({ table, tools = [], preferredTools = [] }: Props) {
  const { t } = useI18n();
  const [sort, setSort] = useState<{ index: number; direction: "asc" | "desc" } | null>(null);
  const [visibleRows, setVisibleRows] = useState(8);
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<"auto" | "table" | ToolId>("auto");

  const numericColumns = useMemo(
    () => table.columns.map((column, index) => !isIdentifierColumn(column) && table.rows.some((row) => isNumericValue(row[index]))),
    [table.columns, table.rows],
  );
  const rows = useMemo(() => {
    if (!sort) return table.rows;
    return [...table.rows].sort((a, b) => compareValues(a[sort.index], b[sort.index]) * (sort.direction === "asc" ? 1 : -1));
  }, [sort, table.rows]);

  const automaticView = preferredTools.find((tool) => tools.includes(tool) && isToolCompatible(tool, table)) ?? "table";
  const resolvedView = view === "auto"
    ? automaticView
    : view !== "table" && tools.includes(view) && isToolCompatible(view, table)
      ? view
      : "table";

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
          <span>{copied ? t("infer.copied") : t("infer.copyCsv")}</span>
        </button>
      </div>

      {tools.length ? (
        <div className="infer-view-switcher" aria-label="Vistas del resultado">
          <button type="button" className={resolvedView === "table" ? "is-active" : ""} onClick={() => setView("table")}>
            <Rows3 size={13} /> {t("tools.tableView")}
          </button>
          {tools.map((tool) => {
            const compatible = isToolCompatible(tool, table);
            return (
              <button
                key={tool}
                type="button"
                className={resolvedView === tool ? "is-active" : ""}
                disabled={!compatible}
                title={compatible ? t(`tools.items.${tool}.summary` as MessageKey) : t("tools.noCompatibleData")}
                onClick={() => setView(tool)}
              >
                <ToolIcon id={tool} size={13} /> {t(`tools.items.${tool}.name` as MessageKey)}
              </button>
            );
          })}
        </div>
      ) : null}

      {resolvedView !== "table" ? <ResultVisualization id={resolvedView} table={table} /> : <div className="infer-table-scroll" tabIndex={0} aria-label={t("infer.result")}>
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
      </div>}

      {resolvedView === "table" && rows.length > 0 ? (
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
  if (isNumericValue(a) && isNumericValue(b)) return Number(String(a).replace(",", ".")) - Number(String(b).replace(",", "."));
  return String(a).localeCompare(String(b), "es", { numeric: true, sensitivity: "base" });
}

function isNumericValue(value: string | number | boolean | null) {
  if (typeof value === "number") return Number.isFinite(value);
  return typeof value === "string" && /^-?\d+(?:[.,]\d+)?$/.test(value.trim());
}

function isIdentifierColumn(column: string) {
  return /(^id$|_id$|uuid|email|correo|phone|tel[eé]fono|code|c[oó]digo|postal|zip|last.*digit|digit.*last|[uú]ltimos.*d[ií]gitos)/i.test(column);
}

function csvCell(value: string) {
  if (!/[",\n]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
}
