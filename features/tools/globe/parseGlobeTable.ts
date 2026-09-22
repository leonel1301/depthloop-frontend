import type { QueryTable } from "@/features/ontology-discovery/services/queryApi";
import type { PresentationSpec } from "@/features/ontology-discovery/services/queryApi";
import { resolvePlace } from "./places";

export type GlobeMarker = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  value: number;
};

export type GlobeArc = {
  id: string;
  from: GlobeMarker;
  to: GlobeMarker;
  value: number;
};

export type GlobeTableModel = {
  markers: GlobeMarker[];
  arcs: GlobeArc[];
  metricLabel: string;
  title: string;
  unit: string;
  total: number;
  unlocated: number;
  canVolume: boolean;
  canFlow: boolean;
};

const GEO_COLUMN = /country|pa[ií]s|nation|iso|region|territor|city|ciudad|origin|origen|destination|destino|location|ubicaci[oó]n|market|mercado|geo/i;

export function globeGeoIndex(table: QueryTable, presentation?: PresentationSpec) {
  if (presentation?.tool === "globe") {
    const location = presentation.dimensions[0] ?? presentation.origin ?? presentation.latitude;
    const index = findColumn(table, location);
    const longitude = findColumn(table, presentation.longitude);
    if (presentation.latitude && presentation.longitude && (index < 0 || longitude < 0)) return -1;
    return index;
  }
  return table.columns.findIndex((column) => GEO_COLUMN.test(column));
}

export function parseGlobeTable(table: QueryTable, presentation?: PresentationSpec): GlobeTableModel {
  const explicit = presentation?.tool === "globe" ? presentation : undefined;
  const inferredGeoIndices = table.columns
    .map((column, index) => (GEO_COLUMN.test(column) ? index : -1))
    .filter((index) => index >= 0);
  const boundGeoIndices = [explicit?.origin, explicit?.destination, ...(explicit?.dimensions ?? [])]
    .map((column) => findColumn(table, column))
    .filter((index) => index >= 0);
  const geoIndices = boundGeoIndices.length ? [...new Set(boundGeoIndices)] : inferredGeoIndices;
  const geoIndex = geoIndices[0] ?? -1;
  const inferredNumericIndices = table.columns
    .map((_, index) => index)
    .filter((index) => !isIdentifierColumn(table.columns[index]) && table.rows.some((row) => isNumericValue(row[index])));
  const boundMeasures = explicit?.measures
    .map((column) => findColumn(table, column))
    .filter((index) => index >= 0 && table.rows.some((row) => isNumericValue(row[index]))) ?? [];
  const numericIndices = boundMeasures.length ? boundMeasures : inferredNumericIndices;
  const numericIndex = numericIndices.find((index) => !geoIndices.includes(index)) ?? -1;
  const metricLabel = numericIndex >= 0 ? humanize(table.columns[numericIndex]) : "";
  const latitudeIndex = findColumn(table, explicit?.latitude);
  const longitudeIndex = findColumn(table, explicit?.longitude);
  const labelIndex = findColumn(table, explicit?.label);

  const grouped = new Map<string, GlobeMarker>();
  let unlocated = 0;
  if (latitudeIndex >= 0 && longitudeIndex >= 0) {
    for (const [index, row] of table.rows.entries()) {
      if (!isNumericValue(row[latitudeIndex]) || !isNumericValue(row[longitudeIndex])) {
        unlocated += 1;
        continue;
      }
      const lat = asNumber(row[latitudeIndex]);
      const lng = asNumber(row[longitudeIndex]);
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        unlocated += 1;
        continue;
      }
      const label = labelIndex >= 0 ? String(row[labelIndex] ?? "").trim() : `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
      const id = label || `${lat}:${lng}:${index}`;
      const value = numericIndex >= 0 ? asNumber(row[numericIndex]) : 1;
      const current = grouped.get(id);
      if (current) current.value += value;
      else grouped.set(id, { id, label: label || id, lat, lng, value });
    }
  } else if (geoIndex >= 0) {
    for (const row of table.rows) {
      const place = resolvePlace(row[geoIndex]);
      if (!place) {
        unlocated += 1;
        continue;
      }
      const value = numericIndex >= 0 ? asNumber(row[numericIndex]) : 1;
      const current = grouped.get(place.id);
      if (current) current.value += value;
      else grouped.set(place.id, { id: place.id, label: place.label, lat: place.lat, lng: place.lng, value });
    }
  }

  const markers = [...grouped.values()].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  const total = markers.reduce((sum, marker) => sum + Math.max(0, marker.value), 0);
  const arcs: GlobeArc[] = [];
  const originIndex = findColumn(table, explicit?.origin) >= 0 ? findColumn(table, explicit?.origin) : geoIndices[0] ?? -1;
  const destinationIndex = findColumn(table, explicit?.destination) >= 0 ? findColumn(table, explicit?.destination) : geoIndices[1] ?? -1;
  if (originIndex >= 0 && destinationIndex >= 0 && originIndex !== destinationIndex) {
    const routes = new Map<string, GlobeArc>();
    for (const [index, row] of table.rows.entries()) {
      const from = resolvePlace(row[originIndex]);
      const to = resolvePlace(row[destinationIndex]);
      if (!from || !to || from.id === to.id) continue;
      const id = `${from.id}->${to.id}`;
      const value = numericIndex >= 0 ? asNumber(row[numericIndex]) : 1;
      const current = routes.get(id);
      if (current) current.value += value;
      else {
        routes.set(id, {
          id: `${id}-${index}`,
          from: { id: from.id, label: from.label, lat: from.lat, lng: from.lng, value },
          to: { id: to.id, label: to.label, lat: to.lat, lng: to.lng, value },
          value,
        });
      }
    }
    arcs.push(...routes.values());
  }

  return {
    markers,
    arcs: arcs.slice(0, 24),
    metricLabel,
    title: explicit?.title ?? metricLabel,
    unit: explicit?.unit ?? "",
    total,
    unlocated,
    canVolume: markers.length > 0,
    canFlow: arcs.length > 0,
  };
}

function findColumn(table: QueryTable, column: string | null | undefined) {
  if (!column) return -1;
  const normalized = column.toLocaleLowerCase("en");
  return table.columns.findIndex((candidate) => candidate.toLocaleLowerCase("en") === normalized);
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
  return /(^id$|_id$|uuid|email|correo|phone|tel[eé]fono|code|c[oó]digo|postal|zip)/i.test(column);
}

function humanize(value: string) {
  const clean = value.replace(/[_-]+/g, " ").trim();
  return clean ? `${clean[0].toLocaleUpperCase("es")}${clean.slice(1)}` : value;
}
