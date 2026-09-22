"use client";

import type { CSSProperties } from "react";
import type { PresentationSpec, QueryTable } from "@/features/ontology-discovery/services/queryApi";
import type { ToolId } from "../models";
import { GlobeViz } from "../globe/GlobeViz";
import { globeGeoIndex } from "../globe/parseGlobeTable";

type Point = { label: string; value: number; row: QueryTable["rows"][number] };

export function isToolCompatible(id: ToolId, table: QueryTable, presentation?: PresentationSpec | null) {
  const explicit = presentation?.tool === id ? presentation : undefined;
  const shape = dataShape(table, explicit);
  if (id === "kpi") return shape.numericIndices.length > 0;
  if (id === "gauge") return shape.numericIndices.length > 0;
  if (id === "heatmap") return shape.numericIndices.length > 0 && table.rows.length > 1;
  if (id === "world-map") return shape.geoIndex >= 0 && shape.numericIndex >= 0;
  if (id === "globe") {
    const index = globeGeoIndex(table, explicit);
    return index >= 0 && table.rows.some((row) => String(row[index] ?? "").trim());
  }
  if (id === "route-map") return shape.geoIndices.length >= 2 || (shape.geoIndex >= 0 && table.rows.length > 1);
  if (id === "timeline") return shape.dateIndex >= 0;
  if (id === "scatter") return shape.numericIndices.length >= 2 && table.rows.filter((row) => shape.numericIndices.slice(0, 2).every((index) => isNumericValue(row[index]))).length > 1;
  if (id === "histogram") return shape.numericIndex >= 0 && table.rows.length > 2;
  if (id === "line" || id === "area") return shape.numericIndex >= 0 && shape.points.length > 1;
  return shape.numericIndex >= 0 && shape.points.length > 0;
}

export function ResultVisualization({ id, table, presentation }: { id: ToolId; table: QueryTable; presentation?: PresentationSpec | null }) {
  const explicit = presentation?.tool === id ? presentation : undefined;
  const shape = dataShape(table, explicit);
  if (id === "bar") return <BarChart points={shape.points} />;
  if (id === "line") return <LineChart points={shape.points} />;
  if (id === "area") return <LineChart points={shape.points} areaOnly />;
  if (id === "donut") return <DonutChart points={shape.points} />;
  if (id === "world-map") return <WorldMap table={table} geoIndex={shape.geoIndex} numericIndex={shape.numericIndex} />;
  if (id === "globe") return <GlobeViz table={table} presentation={explicit} />;
  if (id === "route-map") return <RouteMap table={table} geoIndices={shape.geoIndices} />;
  if (id === "kpi") return <KpiCards table={table} numericIndices={shape.numericIndices} />;
  if (id === "gauge") return <GaugeChart table={table} numericIndex={shape.numericIndex} />;
  if (id === "funnel") return <FunnelChart points={shape.points} />;
  if (id === "heatmap") return <Heatmap points={shape.points} />;
  if (id === "histogram") return <Histogram table={table} numericIndex={shape.numericIndex} />;
  if (id === "scatter") return <ScatterPlot table={table} numericIndices={shape.numericIndices} />;
  if (id === "treemap") return <Treemap points={shape.points} />;
  return <Timeline table={table} dateIndex={shape.dateIndex} numericIndex={shape.numericIndex} />;
}

function dataShape(table: QueryTable, presentation?: PresentationSpec) {
  const inferredNumericIndices = table.columns
    .map((_, index) => index)
    .filter((index) => !isIdentifierColumn(table.columns[index]) && table.rows.some((row) => isNumericValue(row[index])));
  const specifiedMeasures = presentation?.measures
    .map((column) => columnIndex(table, column))
    .filter((index) => index >= 0 && table.rows.some((row) => isNumericValue(row[index]))) ?? [];
  const numericIndices = specifiedMeasures.length ? specifiedMeasures : inferredNumericIndices;
  const numericIndex = numericIndices[0] ?? -1;
  const specifiedDimensions = presentation?.dimensions.map((column) => columnIndex(table, column)).filter((index) => index >= 0) ?? [];
  const specifiedLabel = columnIndex(table, presentation?.label);
  const labelIndex = specifiedLabel >= 0
    ? specifiedLabel
    : specifiedDimensions[0] ?? table.columns.findIndex((_, index) => !numericIndices.includes(index));
  const inferredDateIndex = table.columns.findIndex((column, index) => {
    if (/date|time|fecha|día|dia|mes|month|week|semana|year|año/i.test(column)) return true;
    return table.rows.some((row) => typeof row[index] === "string" && !Number.isNaN(Date.parse(String(row[index]))));
  });
  const dateIndex = specifiedDimensions.find((index) => index === inferredDateIndex || /date|time|fecha|día|dia|mes|month|week|semana|year|año/i.test(table.columns[index])) ?? inferredDateIndex;
  const inferredGeoIndices = table.columns
    .map((column, index) => (/country|pa[ií]s|nation|iso|region|territor|city|ciudad|origin|origen|destination|destino/i.test(column) ? index : -1))
    .filter((index) => index >= 0);
  const specifiedGeoIndices = [presentation?.origin, presentation?.destination, ...(presentation?.dimensions ?? [])]
    .map((column) => columnIndex(table, column))
    .filter((index) => index >= 0);
  const geoIndices = specifiedGeoIndices.length ? [...new Set(specifiedGeoIndices)] : inferredGeoIndices;
  const geoIndex = geoIndices[0] ?? -1;
  let points: Point[] = [];
  if (table.rows.length === 1 && numericIndices.length > 1) {
    points = numericIndices.map((index) => ({
      label: humanize(table.columns[index]),
      value: asNumber(table.rows[0][index]),
      row: table.rows[0],
    }));
  } else if (numericIndex >= 0) {
    points = table.rows.slice(0, 16).map((row, index) => ({
      label: cellLabel(row[labelIndex >= 0 ? labelIndex : 0], index),
      value: asNumber(row[numericIndex]),
      row,
    }));
  }
  return { numericIndices, numericIndex, labelIndex, dateIndex, geoIndices, geoIndex, points };
}

function columnIndex(table: QueryTable, column: string | null | undefined) {
  if (!column) return -1;
  const normalized = column.toLocaleLowerCase("en");
  return table.columns.findIndex((candidate) => candidate.toLocaleLowerCase("en") === normalized);
}

function BarChart({ points }: { points: Point[] }) {
  const max = Math.max(...points.map((point) => Math.abs(point.value)), 1);
  return (
    <div className="result-viz result-bar-chart">
      {points.slice(0, 10).map((point, index) => (
        <div key={`${point.label}-${index}`}>
          <span title={point.label}>{point.label}</span>
          <i><b style={{ "--value": `${Math.max(3, Math.abs(point.value) / max * 100)}%`, "--delay": `${index * 55}ms` } as CSSProperties} /></i>
          <strong>{formatNumber(point.value)}</strong>
        </div>
      ))}
    </div>
  );
}

function LineChart({ points, areaOnly = false }: { points: Point[]; areaOnly?: boolean }) {
  const values = points.slice(0, 16);
  const min = Math.min(...values.map((point) => point.value));
  const max = Math.max(...values.map((point) => point.value));
  const range = max - min || 1;
  const coords = values.map((point, index) => ({
    x: values.length === 1 ? 50 : index / (values.length - 1) * 100,
    y: 88 - ((point.value - min) / range * 72),
    ...point,
  }));
  const line = coords.map((point, index) => `${index ? "L" : "M"}${point.x} ${point.y}`).join(" ");
  const area = `${line} L100 94 L0 94 Z`;
  return (
    <div className={`result-viz result-line-chart ${areaOnly ? "is-area" : ""}`}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path className="result-line-area" d={area} />
        <path className="result-line-path" d={line} />
        {coords.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r="1.35" />)}
      </svg>
      <div>{coords.map((point, index) => <span key={index} title={`${point.label}: ${formatNumber(point.value)}`}>{point.label}</span>)}</div>
    </div>
  );
}

function Histogram({ table, numericIndex }: { table: QueryTable; numericIndex: number }) {
  const values = table.rows.filter((row) => isNumericValue(row[numericIndex])).map((row) => asNumber(row[numericIndex]));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const binCount = Math.min(8, Math.max(4, Math.ceil(Math.sqrt(values.length))));
  const width = (max - min || 1) / binCount;
  const bins = Array.from({ length: binCount }, (_, index) => ({
    from: min + index * width,
    to: index === binCount - 1 ? max : min + (index + 1) * width,
    count: 0,
  }));
  values.forEach((value) => {
    const index = Math.min(binCount - 1, Math.floor((value - min) / width));
    bins[index].count += 1;
  });
  const maxCount = Math.max(...bins.map((bin) => bin.count), 1);
  return (
    <div className="result-viz result-histogram">
      <div className="result-histogram-bars">
        {bins.map((bin, index) => (
          <span key={index} title={`${formatNumber(bin.from)}–${formatNumber(bin.to)}: ${bin.count}`}>
            <strong>{bin.count}</strong>
            <i style={{ "--value": `${Math.max(4, bin.count / maxCount * 100)}%`, "--delay": `${index * 55}ms` } as CSSProperties} />
            <small>{formatNumber(bin.from)}–{formatNumber(bin.to)}</small>
          </span>
        ))}
      </div>
    </div>
  );
}

function ScatterPlot({ table, numericIndices }: { table: QueryTable; numericIndices: number[] }) {
  const [xIndex, yIndex] = numericIndices;
  const points = table.rows
    .filter((row) => isNumericValue(row[xIndex]) && isNumericValue(row[yIndex]))
    .slice(0, 40)
    .map((row) => ({ x: asNumber(row[xIndex]), y: asNumber(row[yIndex]) }));
  const xValues = points.map((point) => point.x);
  const yValues = points.map((point) => point.y);
  const xMin = Math.min(...xValues); const xRange = Math.max(...xValues) - xMin || 1;
  const yMin = Math.min(...yValues); const yRange = Math.max(...yValues) - yMin || 1;
  return (
    <div className="result-viz result-scatter">
      <svg viewBox="0 0 100 100" role="img" aria-label={`${table.columns[xIndex]} frente a ${table.columns[yIndex]}`}>
        <path d="M9 7V91H96" />
        {points.map((point, index) => (
          <circle
            key={index}
            cx={12 + (point.x - xMin) / xRange * 80}
            cy={88 - (point.y - yMin) / yRange * 76}
            r="2"
            style={{ "--delay": `${index * 32}ms` } as CSSProperties}
          ><title>{`${formatNumber(point.x)}, ${formatNumber(point.y)}`}</title></circle>
        ))}
      </svg>
      <div><span>{humanize(table.columns[xIndex])}</span><span>{humanize(table.columns[yIndex])}</span></div>
    </div>
  );
}

function GaugeChart({ table, numericIndex }: { table: QueryTable; numericIndex: number }) {
  const valueRow = table.rows.find((row) => isNumericValue(row[numericIndex]));
  const raw = asNumber(valueRow?.[numericIndex] ?? null);
  const value = Math.max(0, Math.min(100, raw));
  return (
    <div className="result-viz result-gauge">
      <div style={{ "--value": `${value * 1.8}deg` } as CSSProperties}><span><strong>{formatNumber(raw)}</strong><small>{humanize(table.columns[numericIndex])}</small></span></div>
      <p><span>0</span><b>{formatNumber(value)}% del rango</b><span>100</span></p>
    </div>
  );
}

function Treemap({ points }: { points: Point[] }) {
  const values = points.slice(0, 10).map((point) => ({ ...point, value: Math.max(0, point.value) }));
  const total = values.reduce((sum, point) => sum + point.value, 0) || 1;
  return (
    <div className="result-viz result-treemap">
      {values.map((point, index) => (
        <span key={`${point.label}-${index}`} style={{ flexGrow: Math.max(1, point.value / total * 100), "--delay": `${index * 55}ms` } as CSSProperties}>
          <small>{point.label}</small><strong>{formatNumber(point.value)}</strong>
        </span>
      ))}
    </div>
  );
}

function DonutChart({ points }: { points: Point[] }) {
  const positive = points.slice(0, 7).map((point) => ({ ...point, value: Math.max(0, point.value) }));
  const total = positive.reduce((sum, point) => sum + point.value, 0) || 1;
  const stops = positive.map((point, index) => {
    const from = positive.slice(0, index).reduce((sum, previous) => sum + previous.value / total * 100, 0);
    const to = from + point.value / total * 100;
    return `var(--chart-${(index % 6) + 1}) ${from}% ${to}%`;
  }).join(", ");
  return (
    <div className="result-viz result-donut-chart">
      <div className="result-donut" style={{ background: `conic-gradient(${stops})` }}><span><strong>{formatNumber(total)}</strong><small>Total</small></span></div>
      <ul>{positive.map((point, index) => <li key={`${point.label}-${index}`}><i data-color={(index % 6) + 1} /><span>{point.label}</span><strong>{formatNumber(point.value)}</strong></li>)}</ul>
    </div>
  );
}

function KpiCards({ table, numericIndices }: { table: QueryTable; numericIndices: number[] }) {
  const cards = table.rows.length === 1
    ? numericIndices.slice(0, 6).map((index) => ({ label: humanize(table.columns[index]), value: asNumber(table.rows[0][index]) }))
    : numericIndices.slice(0, 4).map((index) => ({
      label: humanize(table.columns[index]),
      value: table.rows.reduce((sum, row) => sum + asNumber(row[index]), 0),
    }));
  return (
    <div className="result-viz result-kpi-grid">
      {cards.map((card, index) => <article key={card.label} style={{ "--delay": `${index * 70}ms` } as CSSProperties}><small>{card.label}</small><strong>{formatNumber(card.value)}</strong><span>dato consultado</span></article>)}
    </div>
  );
}

function FunnelChart({ points }: { points: Point[] }) {
  const values = [...points].sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, 7);
  const max = Math.max(...values.map((point) => Math.abs(point.value)), 1);
  return (
    <div className="result-viz result-funnel">
      {values.map((point, index) => <div key={`${point.label}-${index}`} style={{ width: `${Math.max(28, Math.abs(point.value) / max * 100)}%`, "--delay": `${index * 80}ms` } as CSSProperties}><span>{point.label}</span><strong>{formatNumber(point.value)}</strong></div>)}
    </div>
  );
}

function Heatmap({ points }: { points: Point[] }) {
  const values = points.slice(0, 30);
  const max = Math.max(...values.map((point) => Math.abs(point.value)), 1);
  return (
    <div className="result-viz result-heatmap">
      {values.map((point, index) => <span key={`${point.label}-${index}`} title={`${point.label}: ${formatNumber(point.value)}`} style={{ "--intensity": `${Math.max(12, Math.abs(point.value) / max * 100)}%`, "--delay": `${index * 24}ms` } as CSSProperties}><small>{point.label}</small><strong>{formatNumber(point.value)}</strong></span>)}
    </div>
  );
}

function Timeline({ table, dateIndex, numericIndex }: { table: QueryTable; dateIndex: number; numericIndex: number }) {
  return (
    <ol className="result-viz result-timeline">
      {table.rows.slice(0, 12).map((row, index) => {
        const label = cellLabel(row[dateIndex], index);
        const detailIndex = table.columns.findIndex((_, columnIndex) => columnIndex !== dateIndex && columnIndex !== numericIndex);
        return <li key={`${label}-${index}`} style={{ "--delay": `${index * 65}ms` } as CSSProperties}><i /><div><small>{label}</small><strong>{detailIndex >= 0 ? cellLabel(row[detailIndex], index) : table.columns[numericIndex] || "Evento"}</strong></div>{numericIndex >= 0 ? <b>{formatNumber(asNumber(row[numericIndex]))}</b> : null}</li>;
      })}
    </ol>
  );
}

const GEO_POINTS: Record<string, [number, number]> = {
  peru: [154, 154], pe: [154, 154], lima: [151, 151], mexico: [104, 105], mx: [104, 105],
  colombia: [139, 132], chile: [153, 191], argentina: [166, 188], brazil: [178, 153], brasil: [178, 153],
  canada: [102, 61], "united states": [104, 84], usa: [104, 84], "estados unidos": [104, 84],
  spain: [293, 88], españa: [293, 88], france: [303, 78], germany: [319, 75], alemania: [319, 75],
  china: [433, 96], japan: [486, 95], japón: [486, 95], india: [398, 119], australia: [468, 178],
};

function WorldMap({ table, geoIndex, numericIndex }: { table: QueryTable; geoIndex: number; numericIndex: number }) {
  const rows = table.rows.slice(0, 20);
  const max = Math.max(...rows.map((row) => Math.abs(asNumber(row[numericIndex]))), 1);
  return (
    <div className="result-viz result-world-map">
      <svg viewBox="0 0 560 240" role="img" aria-label="Distribución mundial de los resultados">
        <g className="result-map-land">
          <path d="M25 61l45-34 72 13 38 34-22 28-45 3-18 34-35-13-15-37zM143 137l31 14 22 46-18 34-22-50zM238 46l47-23 52 12 34 30 60-13 65 32-27 35-56-4-27 34-42-10-34-54-46-4zM313 99l50 21-13 69-33 27-31-60zM438 153l46-15 35 23-15 32-46 3z" />
        </g>
        {rows.map((row, index) => {
          const key = String(row[geoIndex] ?? "").trim().toLocaleLowerCase("es");
          const coords = GEO_POINTS[key];
          if (!coords) return null;
          const value = Math.abs(asNumber(row[numericIndex]));
          return <g key={`${key}-${index}`} className="result-map-point" style={{ "--delay": `${index * 90}ms` } as CSSProperties}><circle cx={coords[0]} cy={coords[1]} r={4 + value / max * 12} /><title>{`${row[geoIndex]}: ${formatNumber(asNumber(row[numericIndex]))}`}</title></g>;
        })}
      </svg>
      <div>{rows.slice(0, 6).map((row, index) => <span key={index}><i />{cellLabel(row[geoIndex], index)} <strong>{formatNumber(asNumber(row[numericIndex]))}</strong></span>)}</div>
    </div>
  );
}

function RouteMap({ table, geoIndices }: { table: QueryTable; geoIndices: number[] }) {
  const routes = geoIndices.length >= 2
    ? table.rows.slice(0, 10).map((row, index) => ({
      from: mapPoint(row[geoIndices[0]], index * 2),
      to: mapPoint(row[geoIndices[1]], index * 2 + 1),
      fromLabel: cellLabel(row[geoIndices[0]], index),
      toLabel: cellLabel(row[geoIndices[1]], index),
    }))
    : table.rows.slice(0, 10).slice(1).map((row, index) => ({
      from: mapPoint(table.rows[index][geoIndices[0]], index),
      to: mapPoint(row[geoIndices[0]], index + 1),
      fromLabel: cellLabel(table.rows[index][geoIndices[0]], index),
      toLabel: cellLabel(row[geoIndices[0]], index + 1),
    }));
  return (
    <div className="result-viz result-route-map">
      <svg viewBox="0 0 560 240" role="img" aria-label="Rutas de los resultados">
        <g className="result-map-land">
          <path d="M25 61l45-34 72 13 38 34-22 28-45 3-18 34-35-13-15-37zM143 137l31 14 22 46-18 34-22-50zM238 46l47-23 52 12 34 30 60-13 65 32-27 35-56-4-27 34-42-10-34-54-46-4zM313 99l50 21-13 69-33 27-31-60zM438 153l46-15 35 23-15 32-46 3z" />
        </g>
        {routes.map((route, index) => {
          const middleY = Math.max(14, Math.min(route.from[1], route.to[1]) - 30 - index * 2);
          return (
            <g key={`${route.fromLabel}-${route.toLabel}-${index}`} className="result-route" style={{ "--delay": `${index * 90}ms` } as CSSProperties}>
              <path d={`M${route.from[0]} ${route.from[1]} Q${(route.from[0] + route.to[0]) / 2} ${middleY} ${route.to[0]} ${route.to[1]}`} />
              <circle cx={route.from[0]} cy={route.from[1]} r="4" />
              <circle cx={route.to[0]} cy={route.to[1]} r="4" />
              <title>{`${route.fromLabel} → ${route.toLabel}`}</title>
            </g>
          );
        })}
      </svg>
      <div>{routes.slice(0, 5).map((route, index) => <span key={index}>{route.fromLabel} <b>→</b> {route.toLabel}</span>)}</div>
    </div>
  );
}

function mapPoint(value: QueryTable["rows"][number][number], index: number): [number, number] {
  const key = String(value ?? "").trim().toLocaleLowerCase("es");
  return GEO_POINTS[key] ?? [65 + index % 6 * 82, 62 + index % 3 * 52];
}

function cellLabel(value: QueryTable["rows"][number][number], index: number) {
  if (value == null || value === "") return `Fila ${index + 1}`;
  return String(value);
}

function asNumber(value: QueryTable["rows"][number][number]) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && isNumericValue(value)) return Number(value.replace(",", "."));
  return 0;
}

function isNumericValue(value: QueryTable["rows"][number][number]) {
  if (typeof value === "number") return Number.isFinite(value);
  return typeof value === "string" && /^-?\d+(?:[.,]\d+)?$/.test(value.trim());
}

function isIdentifierColumn(column: string) {
  return /(^id$|_id$|uuid|email|correo|phone|tel[eé]fono|code|c[oó]digo|postal|zip|last.*digit|digit.*last|[uú]ltimos.*d[ií]gitos)/i.test(column);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2, notation: Math.abs(value) >= 100_000 ? "compact" : "standard" }).format(value);
}

function humanize(value: string) {
  const clean = value.replace(/[_-]+/g, " ").trim();
  return clean ? `${clean[0].toLocaleUpperCase("es")}${clean.slice(1)}` : value;
}
