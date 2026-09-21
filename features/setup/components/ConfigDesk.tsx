"use client";

import Link from "next/link";
import { ArrowRight, Bot, Building2, Database, History, Map, Settings2, Shapes, SunMoon } from "lucide-react";
import { AppHeader } from "./AppHeader";
import { CompanyForm } from "./CompanyForm";
import { LanguagePreference } from "./LanguagePreference";
import { MapHistory } from "./MapHistory";
import { ThemePreference } from "./ThemePreference";
import { SourceRoster } from "@/features/ontology-discovery/components/SourceRoster";
import { useOntologyDiscovery } from "@/features/ontology-discovery/hooks";
import { useI18n } from "@/features/i18n";

export function ConfigDesk() {
  const { t } = useI18n();
  const { ready, businessId, ontology, setOntology, querySources, hasSession, removeSource, openSourceDialog } = useOntologyDiscovery();
  const concepts = ontology?.entities.length ?? 0;
  const liveIds = querySources.filter((source) => hasSession(source.id)).map((source) => source.id);

  return (
    <main className="app-shell settings-shell">
      <AppHeader />
      {!ready ? null : (
        <section className="settings-page">
          <header className="settings-hero">
            <span><Settings2 size={14} /> {t("settings.kicker")}</span>
            <h1>{t("settings.title")}</h1>
            <p>{t("settings.lead")}</p>
          </header>

          <div className="settings-layout">
            <aside className="settings-index">
              <nav aria-label={t("settings.sections")}>
                <a href="#empresa"><Building2 size={15} /> {t("settings.company")}</a>
                <a href="#preferencias"><SunMoon size={15} /> {t("settings.preferences")}</a>
                <a href="#fuentes"><Database size={15} /> {t("settings.sources")}</a>
                <a href="#mapa"><Map size={15} /> {t("settings.map")}</a>
                <a href="#historial"><History size={15} /> {t("settings.history")}</a>
                <Link href="/setup/tools"><Shapes size={15} /> {t("settings.tools")}</Link>
                <a href="#agentes"><Bot size={15} /> {t("settings.agents")}</a>
              </nav>

              <div className="settings-flow">
                <span>{t("settings.flow")}</span>
                <Link href="/setup/map"><i>1</i><strong>Map</strong><ArrowRight size={13} /></Link>
                <Link href="/setup/knowledge"><i>2</i><strong>{t("common.business")}</strong><ArrowRight size={13} /></Link>
                <Link href="/setup/tools"><i>3</i><strong>{t("settings.tools")}</strong><ArrowRight size={13} /></Link>
                <Link href="/"><i>4</i><strong>{t("common.infer")}</strong><ArrowRight size={13} /></Link>
              </div>
            </aside>

            <div className="settings-content">
              <section className="settings-card" id="empresa">
                <header className="settings-card-head">
                  <span><Building2 size={17} /></span>
                  <div>
                    <h2>{t("settings.companyTitle")}</h2>
                    <p>{t("settings.companyCopy")}</p>
                  </div>
                </header>
                <CompanyForm />
              </section>

              <section className="settings-card" id="preferencias">
                <header className="settings-card-head">
                  <span><SunMoon size={17} /></span>
                  <div>
                    <h2>{t("settings.preferencesTitle")}</h2>
                    <p>{t("settings.preferencesCopy")}</p>
                  </div>
                </header>
                <div className="settings-pref-block">
                  <strong>{t("settings.appearance")}</strong>
                  <ThemePreference />
                </div>
                <div className="settings-pref-block">
                  <strong>{t("language.title")}</strong>
                  <LanguagePreference />
                </div>
              </section>

              <section className="settings-card" id="fuentes">
                <header className="settings-card-head">
                  <span><Database size={17} /></span>
                  <div>
                    <h2>{t("settings.sourcesTitle")}</h2>
                    <p>{t("settings.sourcesCopy")}</p>
                  </div>
                </header>
                {querySources.length ? (
                  <SourceRoster sources={querySources} liveIds={liveIds} onRemove={removeSource} onReconnect={(source) => openSourceDialog("reconnect", "database", source)} compact />
                ) : (
                  <div className="settings-empty">{t("settings.sourcesEmpty")}</div>
                )}
                <div className="config-actions">
                  <button type="button" className="secondary-button" onClick={() => openSourceDialog("add", "database")}>{t("settings.addDatabase")}</button>
                  <button type="button" className="ghost-button" onClick={() => openSourceDialog("add", "service")}>{t("settings.addApi")}</button>
                  <button type="button" className="ghost-button" onClick={() => openSourceDialog("add", "schema")}>{t("settings.addJson")}</button>
                </div>
              </section>

              <div className="settings-card-grid">
                <section className="settings-card compact" id="mapa">
                  <header className="settings-card-head">
                    <span><Map size={17} /></span>
                    <div><h2>{t("settings.mapTitle")}</h2><p>{t("settings.mapCopy")}</p></div>
                  </header>
                  <strong className="settings-metric">{ontology ? concepts : "—"}</strong>
                  <span className="settings-metric-label">{ontology ? (concepts === 1 ? t("settings.concept") : t("settings.concepts")) : t("settings.noMap")}</span>
                  <Link className="settings-card-link" href="/setup/map">{t("settings.openMap")} <ArrowRight size={14} /></Link>
                </section>

                <section className="settings-card compact" id="agentes">
                  <header className="settings-card-head">
                    <span><Bot size={17} /></span>
                    <div><h2>{t("settings.agentsTitle")}</h2><p>{t("settings.agentsCopy")}</p></div>
                  </header>
                  <div className="settings-empty">{t("settings.agentsEmpty")}</div>
                </section>
              </div>

              <section className="settings-card" id="historial">
                <header className="settings-card-head">
                  <span><History size={17} /></span>
                  <div>
                    <h2>{t("settings.historyTitle")}</h2>
                    <p>{t("settings.historyCopy")}</p>
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
