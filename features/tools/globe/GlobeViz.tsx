"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Pause, Play, RotateCcw } from "lucide-react";
import { useI18n } from "@/features/i18n";
import type { PresentationSpec, QueryTable } from "@/features/ontology-discovery/services/queryApi";
import { parseGlobeTable, type GlobeTableModel } from "./parseGlobeTable";
import { mountGlobe, type GlobeMode, type GlobeTheme } from "./mountGlobe";

type Props = {
  table: QueryTable;
  presentation?: PresentationSpec | null;
};

export function GlobeViz({ table, presentation }: Props) {
  const { t, locale } = useI18n();
  const hostRef = useRef<HTMLDivElement>(null);
  const payloadKey = useMemo(
    () => `${table.columns.join("\0")}\n${table.rows.map((row) => row.join("\0")).join("\n")}\n${JSON.stringify(presentation ?? null)}`,
    [presentation, table.columns, table.rows],
  );
  const model = useMemo(() => parseGlobeTable(table, presentation ?? undefined), [presentation, table]);
  const [mode, setMode] = useState<GlobeMode>(model.canVolume ? "volume" : "flow");
  const [selectedId, setSelectedId] = useState<string | null>(model.markers[0]?.id ?? model.arcs[0]?.from.id ?? null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const apiRef = useRef<Awaited<ReturnType<typeof mountGlobe>> | null>(null);
  const modeRef = useRef(mode);
  const selectedRef = useRef(selectedId);
  const autoRotateRef = useRef(autoRotate);

  const visibleMarkers = mode === "flow" ? uniqueArcMarkers(model) : model.markers;
  const selected = visibleMarkers.find((marker) => marker.id === selectedId) ?? visibleMarkers[0] ?? null;
  const highlighted = visibleMarkers.find((marker) => marker.id === hoveredId) ?? selected;
  const total = visibleMarkers.reduce((sum, marker) => sum + Math.max(0, marker.value), 0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || (!model.canVolume && !model.canFlow)) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cancelled = false;
    void mountGlobe({
      host,
      markers: model.markers,
      arcs: model.arcs,
      mode: modeRef.current,
      selectedId: selectedRef.current,
      autoRotate: autoRotateRef.current,
      reducedMotion,
      theme: readTheme(host),
      onSelect: setSelectedId,
      onHover: setHoveredId,
    }).then((api) => {
      if (cancelled) {
        api.dispose();
        return;
      }
      apiRef.current = api;
      api.setMode(modeRef.current);
      api.setSelected(selectedRef.current);
      api.setAutoRotate(autoRotateRef.current);
    });
    return () => {
      cancelled = true;
      apiRef.current?.dispose();
      apiRef.current = null;
    };
    // Mount once per result payload; interaction state syncs through the imperative API below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payloadKey]);

  useEffect(() => {
    modeRef.current = mode;
    apiRef.current?.setMode(mode);
  }, [mode]);

  useEffect(() => {
    selectedRef.current = selectedId;
    apiRef.current?.setSelected(selectedId);
  }, [selectedId]);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
    apiRef.current?.setAutoRotate(autoRotate);
  }, [autoRotate]);

  if (!model.canVolume && !model.canFlow) {
    return (
      <div className="result-viz result-globe result-globe-empty">
        <p>{t("tools.globe.empty")}</p>
      </div>
    );
  }

  const selectMode = (next: GlobeMode) => {
    setMode(next);
    setHoveredId(null);
    const nextMarkers = next === "flow" ? uniqueArcMarkers(model) : model.markers;
    if (!nextMarkers.some((marker) => marker.id === selectedId)) setSelectedId(nextMarkers[0]?.id ?? null);
  };

  return (
    <div className="result-viz result-globe">
      <section className="result-globe-stage" aria-label={model.title || t("tools.items.globe.name")}>
        <header className="result-globe-head">
          <div>
            <span><MapPin size={12} /> {visibleMarkers.length} {t("tools.globe.locations")}</span>
            <strong>{model.title || model.metricLabel || t("tools.items.globe.name")}</strong>
          </div>
          {model.canVolume && model.canFlow ? (
            <div className="result-globe-modes" role="tablist" aria-label={t("tools.items.globe.name")}>
              <button type="button" role="tab" aria-selected={mode === "volume"} className={mode === "volume" ? "is-active" : ""} onClick={() => selectMode("volume")}>
                {t("tools.globe.volume")}
              </button>
              <button type="button" role="tab" aria-selected={mode === "flow"} className={mode === "flow" ? "is-active" : ""} onClick={() => selectMode("flow")}>
                {t("tools.globe.flow")}
              </button>
            </div>
          ) : null}
        </header>

        <div ref={hostRef} className="result-globe-canvas" />

        {hoveredId && highlighted ? (
          <div className="result-globe-hover" aria-hidden="true">
            <span>{highlighted.label}</span>
            <strong>{formatNumber(highlighted.value, locale)}{model.unit ? ` ${model.unit}` : ""}</strong>
          </div>
        ) : null}

        {highlighted ? (
          <aside className="result-globe-card">
            <span className="result-globe-card-kicker">{t("tools.globe.insight")}</span>
            <div className="result-globe-card-title">
              <strong>{highlighted.label}</strong>
              <span>{shareLabel(highlighted.value, total, locale)} {t("tools.globe.share")}</span>
            </div>
            <p>
              <b>{formatNumber(highlighted.value, locale)}</b>
              {model.unit ? <small>{model.unit}</small> : null}
            </p>
            <i className="result-globe-share"><span style={{ width: `${Math.max(3, total > 0 ? highlighted.value / total * 100 : 0)}%` }} /></i>
            <ol>
              {visibleMarkers.slice(0, 4).map((marker) => (
                <li key={marker.id}>
                  <button type="button" className={marker.id === selected?.id ? "is-active" : ""} onClick={() => setSelectedId(marker.id)}>
                    <span>{marker.label}</span>
                    <b>{formatNumber(marker.value, locale)}</b>
                  </button>
                </li>
              ))}
            </ol>
            {model.unlocated > 0 ? <small className="result-globe-unlocated">{model.unlocated} {t("tools.globe.unlocated")}</small> : null}
          </aside>
        ) : null}

        <div className="result-globe-controls">
          <span>{t("tools.globe.drag")}</span>
          <button type="button" onClick={() => setAutoRotate((current) => !current)} title={autoRotate ? t("tools.globe.pause") : t("tools.globe.resume")} aria-label={autoRotate ? t("tools.globe.pause") : t("tools.globe.resume")}>
            {autoRotate ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button type="button" onClick={() => apiRef.current?.focus(selected?.id ?? null)} title={t("tools.globe.recenter")} aria-label={t("tools.globe.recenter")}>
            <RotateCcw size={14} />
          </button>
        </div>
      </section>
    </div>
  );
}

function uniqueArcMarkers(model: GlobeTableModel) {
  const map = new Map<string, GlobeTableModel["markers"][number]>();
  for (const arc of model.arcs) {
    map.set(arc.from.id, { ...arc.from, value: (map.get(arc.from.id)?.value ?? 0) + arc.value });
    map.set(arc.to.id, { ...arc.to, value: (map.get(arc.to.id)?.value ?? 0) + arc.value });
  }
  return [...map.values()].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
}

function readTheme(host: HTMLElement): GlobeTheme {
  const styles = getComputedStyle(host);
  const light = !document.documentElement.dataset.theme || document.documentElement.dataset.theme === "light";
  return {
    globe: cssToHex(styles.getPropertyValue(light ? "--bg-elevated" : "--bg-hover"), light ? 0xf4f4f1 : 0x1a1a1a),
    land: cssToHex(styles.getPropertyValue("--muted"), 0x6b6b66),
    marker: cssToHex(styles.getPropertyValue("--chart-1"), 0x171717),
    markerHot: cssToHex(styles.getPropertyValue("--chart-2"), 0x6f5b32),
    arc: cssToHex(styles.getPropertyValue("--chart-2"), 0x6f5b32),
  };
}

function cssToHex(value: string, fallback: number) {
  const hex = value.trim();
  if (hex.startsWith("#")) {
    const raw = hex.slice(1);
    if (raw.length === 3) return Number.parseInt(raw.split("").map((part) => `${part}${part}`).join(""), 16);
    if (raw.length >= 6) return Number.parseInt(raw.slice(0, 6), 16);
  }
  const rgb = hex.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  if (rgb) return (Number(rgb[1]) << 16) + (Number(rgb[2]) << 8) + Number(rgb[3]);
  return fallback;
}

function formatNumber(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "es-PE", {
    maximumFractionDigits: 2,
    notation: Math.abs(value) >= 100_000 ? "compact" : "standard",
  }).format(value);
}

function shareLabel(value: number, total: number, locale: string) {
  const share = total > 0 ? value / total : 0;
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "es-PE", { style: "percent", maximumFractionDigits: 1 }).format(share);
}
