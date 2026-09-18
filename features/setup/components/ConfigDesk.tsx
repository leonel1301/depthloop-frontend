"use client";

import Link from "next/link";
import { ArrowRight, Bot, Building2, Database, History, Map, MessageSquareText, Settings2 } from "lucide-react";
import { AppHeader } from "./AppHeader";
import { CompanyForm } from "./CompanyForm";
import { MapHistory } from "./MapHistory";
import { SourceRoster } from "@/features/ontology-discovery/components/SourceRoster";
import { useOntologyDiscovery } from "@/features/ontology-discovery/hooks";

export function ConfigDesk() {
  const { ready, businessId, ontology, setOntology, querySources, hasSession, removeSource } = useOntologyDiscovery();
  const concepts = ontology?.entities.length ?? 0;
  const liveIds = querySources.filter((source) => hasSession(source.id)).map((source) => source.id);

  return (
    <main className="app-shell settings-shell">
      <AppHeader
        extras={
          <Link className="settings-header-link" href="/">
            <MessageSquareText size={15} /> Volver al chat
          </Link>
        }
      />
      {!ready ? null : (
        <section className="settings-page">
          <header className="settings-hero">
            <span><Settings2 size={14} /> Espacio de trabajo</span>
            <h1>Configuración</h1>
            <p>Administra la empresa, sus fuentes y el mapa desde un solo lugar.</p>
          </header>

          <div className="settings-layout">
            <aside className="settings-index">
              <nav aria-label="Secciones de configuración">
                <a href="#empresa"><Building2 size={15} /> Empresa</a>
                <a href="#fuentes"><Database size={15} /> Fuentes</a>
                <a href="#mapa"><Map size={15} /> Mapa</a>
                <a href="#historial"><History size={15} /> Historial</a>
                <a href="#agentes"><Bot size={15} /> Agentes</a>
              </nav>

              <div className="settings-flow">
                <span>Flujo del producto</span>
                <Link href="/setup/map"><i>1</i><strong>Map</strong><ArrowRight size={13} /></Link>
                <Link href="/setup/knowledge"><i>2</i><strong>Negocio</strong><ArrowRight size={13} /></Link>
                <Link href="/"><i>3</i><strong>Inferir</strong><ArrowRight size={13} /></Link>
              </div>
            </aside>

            <div className="settings-content">
              <section className="settings-card" id="empresa">
                <header className="settings-card-head">
                  <span><Building2 size={17} /></span>
                  <div>
                    <h2>Empresa</h2>
                    <p>Identidad y datos generales del espacio.</p>
                  </div>
                </header>
                <CompanyForm />
              </section>

              <section className="settings-card" id="fuentes">
                <header className="settings-card-head">
                  <span><Database size={17} /></span>
                  <div>
                    <h2>Fuentes de datos</h2>
                    <p>Conexiones disponibles para Map e Inferir.</p>
                  </div>
                </header>
                {querySources.length ? (
                  <SourceRoster sources={querySources} liveIds={liveIds} onRemove={removeSource} compact />
                ) : (
                  <div className="settings-empty">No hay fuentes conectadas todavía.</div>
                )}
                <div className="config-actions">
                  <Link className="secondary-button" href="/setup/map?intake=database">Añadir base</Link>
                  <Link className="ghost-button" href="/setup/map?intake=service">Añadir API</Link>
                  <Link className="ghost-button" href="/setup/map?intake=schema">Cargar JSON</Link>
                </div>
              </section>

              <div className="settings-card-grid">
                <section className="settings-card compact" id="mapa">
                  <header className="settings-card-head">
                    <span><Map size={17} /></span>
                    <div><h2>Mapa</h2><p>Estructura y conceptos detectados.</p></div>
                  </header>
                  <strong className="settings-metric">{ontology ? concepts : "—"}</strong>
                  <span className="settings-metric-label">{ontology ? (concepts === 1 ? "concepto" : "conceptos") : "Sin mapa"}</span>
                  <Link className="settings-card-link" href="/setup/map">Abrir Map <ArrowRight size={14} /></Link>
                </section>

                <section className="settings-card compact" id="agentes">
                  <header className="settings-card-head">
                    <span><Bot size={17} /></span>
                    <div><h2>Agentes</h2><p>Asistentes para tareas específicas.</p></div>
                  </header>
                  <div className="settings-empty">Estarán disponibles próximamente.</div>
                </section>
              </div>

              <section className="settings-card" id="historial">
                <header className="settings-card-head">
                  <span><History size={17} /></span>
                  <div>
                    <h2>Historial de Map</h2>
                    <p>Versiones anteriores de la estructura de tu empresa.</p>
                  </div>
                </header>
                {businessId ? <MapHistory businessId={businessId} onRestored={setOntology} /> : null}
              </section>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
