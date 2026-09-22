"use client";

import { useEffect, useMemo, useRef } from "react";
import { X } from "lucide-react";
import { useI18n, type MessageKey } from "@/features/i18n";
import type { PresentationSpec, QueryTable } from "@/features/ontology-discovery/services/queryApi";
import type { ToolId } from "../models";
import { ResultVisualization } from "./ResultVisualization";
import { ToolIcon } from "./ToolIcon";

type Props = {
  tool: ToolId;
  onClose: () => void;
};

type Demo = {
  table: QueryTable;
  presentation: PresentationSpec;
};

export function ToolPreviewDialog({ tool, onClose }: Props) {
  const { t } = useI18n();
  const closeRef = useRef<HTMLButtonElement>(null);
  const demo = useMemo(() => demoFor(tool), [tool]);
  const titleId = `tool-preview-${tool}`;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="dialog-backdrop tools-preview-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className={`dialog-card tools-preview-dialog ${tool === "globe" ? "is-globe" : ""}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="tools-preview-head">
          <span><ToolIcon id={tool} size={18} /></span>
          <div>
            <small>{t("tools.previewEyebrow")}</small>
            <h2 id={titleId}>{t(`tools.items.${tool}.name` as MessageKey)}</h2>
            <p>{t(`tools.items.${tool}.summary` as MessageKey)}</p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label={t("tools.closePreview")} title={t("tools.closePreview")}>
            <X size={17} />
          </button>
        </header>
        <div className="tools-preview-stage">
          <ResultVisualization id={tool} table={demo.table} presentation={demo.presentation} />
        </div>
        <footer className="tools-preview-foot">
          <span><i /> {t("tools.previewData")}</span>
          <button type="button" onClick={onClose}>{t("common.close")}</button>
        </footer>
      </section>
    </div>
  );
}

function demoFor(tool: ToolId): Demo {
  if (tool === "line" || tool === "area") {
    return demo(tool, ["mes", "ingresos"], [
      ["Ene", 42], ["Feb", 57], ["Mar", 49], ["Abr", 74], ["May", 68], ["Jun", 91],
    ], ["mes"], ["ingresos"], { unit: "k PEN" });
  }
  if (tool === "world-map") {
    return demo(tool, ["pais", "pedidos"], [
      ["Perú", 184], ["México", 126], ["Estados Unidos", 98], ["España", 72], ["Japón", 43],
    ], ["pais"], ["pedidos"], { unit: "pedidos" });
  }
  if (tool === "globe") {
    return demo(tool, ["origen", "destino", "envios"], [
      ["Perú", "Estados Unidos", 184], ["Perú", "Chile", 126], ["Brasil", "España", 98],
      ["México", "Alemania", 72], ["Japón", "Perú", 43], ["Colombia", "Estados Unidos", 65],
    ], ["origen"], ["envios"], { origin: "origen", destination: "destino", unit: "envíos" });
  }
  if (tool === "route-map") {
    return demo(tool, ["origen", "destino", "envios"], [
      ["Perú", "Estados Unidos", 184], ["México", "España", 126], ["Brasil", "Alemania", 98],
      ["Japón", "Perú", 43],
    ], [], ["envios"], { origin: "origen", destination: "destino", unit: "envíos" });
  }
  if (tool === "histogram") {
    return demo(tool, ["edad"], [[18], [21], [22], [24], [25], [25], [27], [29], [31], [32], [35], [38], [42], [47], [54], [61]], [], ["edad"], { unit: "años" });
  }
  if (tool === "scatter") {
    return demo(tool, ["edad", "gasto_mensual"], [
      [19, 45], [22, 68], [25, 61], [29, 92], [34, 110], [39, 104], [45, 148], [51, 132], [58, 176],
    ], [], ["edad", "gasto_mensual"], { unit: "PEN" });
  }
  if (tool === "gauge") {
    return demo(tool, ["avance"], [[74]], [], ["avance"], { unit: "%" });
  }
  if (tool === "kpi") {
    return demo(tool, ["usuarios_activos", "conversion", "ingresos"], [[1284, 68.4, 92300]], [], ["usuarios_activos", "conversion", "ingresos"]);
  }
  if (tool === "timeline") {
    return demo(tool, ["fecha", "evento", "total"], [
      ["2026-09-18", "Nueva campaña", 12], ["2026-09-19", "Pico de registros", 34],
      ["2026-09-20", "Meta alcanzada", 51], ["2026-09-21", "Nuevo mercado", 67],
    ], ["fecha"], ["total"], { label: "evento" });
  }
  const categoryRows: QueryTable["rows"] = tool === "funnel"
    ? [["Visitas", 1250], ["Registro", 810], ["Activación", 520], ["Compra", 286]]
    : tool === "donut"
      ? [["Orgánico", 48], ["Referidos", 29], ["Campañas", 15], ["Otros", 8]]
      : tool === "heatmap"
        ? [["Lun 09h", 18], ["Lun 14h", 41], ["Mar 09h", 27], ["Mar 14h", 64], ["Mié 09h", 49], ["Mié 14h", 82], ["Jue 09h", 36], ["Jue 14h", 71], ["Vie 09h", 55], ["Vie 14h", 92]]
        : tool === "treemap"
          ? [["Suscripciones", 46], ["Servicios", 27], ["Licencias", 16], ["Soporte", 8], ["Otros", 3]]
          : [["Producto A", 84], ["Producto B", 67], ["Producto C", 53], ["Producto D", 38], ["Producto E", 24]];
  return demo(tool, ["categoria", "valor"], categoryRows, ["categoria"], ["valor"]);
}

function demo(
  tool: ToolId,
  columns: string[],
  rows: QueryTable["rows"],
  dimensions: string[],
  measures: string[],
  extra: Partial<PresentationSpec> = {},
): Demo {
  return {
    table: { columns, rows, rowCount: rows.length, truncated: false },
    presentation: {
      tool,
      title: "Datos de demostración",
      dimensions,
      measures,
      ...extra,
    },
  };
}
