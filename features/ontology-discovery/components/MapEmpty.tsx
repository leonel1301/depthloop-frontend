"use client";

import { ArrowRight, CheckCircle2, Database, ScanSearch, ShieldCheck } from "lucide-react";
import { SourceRoster } from "./SourceRoster";
import type { QuerySource } from "../services/workspaceStore";

type Props = {
  onConnect: () => void;
  onSchema: () => void;
  connections?: QuerySource[];
  liveIds?: string[];
  onRemove: (id: string) => void;
};

export function MapEmpty({ onConnect, onSchema, connections = [], liveIds = [], onRemove }: Props) {
  return (
    <section className="map-empty">
      <span className="map-empty-kicker"><ShieldCheck size={13} /> Tu capa de significado</span>
      <h1>Convierte tus fuentes en un mapa que la empresa entiende.</h1>
      <p>DepthLoop interpreta tablas, campos y relaciones. Tu equipo confirma lo importante y ese conocimiento se reutiliza en cada respuesta.</p>
      <ol className="map-empty-journey">
        <li><span><Database size={16} /></span><div><strong>Conecta</strong><small>Leemos la estructura sin modificar tus sistemas.</small></div></li>
        <li><span><ScanSearch size={16} /></span><div><strong>Interpreta</strong><small>Traducimos la información a conceptos de negocio.</small></div></li>
        <li><span><CheckCircle2 size={16} /></span><div><strong>Confirma</strong><small>Tu equipo decide qué significado queda en el mapa.</small></div></li>
      </ol>
      <SourceRoster sources={connections} liveIds={liveIds} onRemove={onRemove} />
      <div className="map-empty-actions">
        <button type="button" className="primary-button" onClick={onConnect}>Conectar una fuente <ArrowRight size={15} /></button>
        <button type="button" className="secondary-button" onClick={onSchema}>Usar un schema</button>
      </div>
    </section>
  );
}
