"use client";

import { ArrowRight, CheckCircle2, Database, GitCompareArrows, Layers3, ScanSearch, Table2, TriangleAlert } from "lucide-react";
import { useI18n } from "@/features/i18n";
import type { Attribute, OntologyDiscoveryResult } from "../models/ontology";
import { cardinalityCopy, conceptLabel, conceptStory, confidenceCopy, fieldGroup, fieldLabel, humanLabel, relationSentence } from "../services/labels";

type Props = {
  ontology: OntologyDiscoveryResult;
  selectedId?: string;
  onSelect: (id: string) => void;
  impactedObjects?: Array<{
    id: string;
    document: { kind: "metric" | "rule" | "definition"; key: string; name: string; conceptId?: string | null };
  }>;
};

function groupedFields(attributes: Attribute[]) {
  const groups = new Map<string, { title: string; hint: string; items: Attribute[] }>();
  for (const attribute of attributes) {
    const group = fieldGroup(attribute.semanticType);
    const current = groups.get(group.id) ?? { title: group.title, hint: group.hint, items: [] };
    current.items.push(attribute);
    groups.set(group.id, current);
  }
  return [...groups.values()];
}

export function UnderstandingCatalog({ ontology, selectedId, onSelect, impactedObjects = [] }: Props) {
  const { t } = useI18n();
  const selected = ontology.entities.find((entity) => entity.id === selectedId) ?? ontology.entities[0];
  if (!selected) return null;

  const names = Object.fromEntries(ontology.entities.map((entity) => [entity.id, entity.name]));
  const related = ontology.relations.filter((relation) => relation.from === selected.id || relation.to === selected.id);
  const canonical = ontology.canonicalConcepts.find((concept) =>
    concept.bindings.some((binding) => binding.entityId === selected.id && binding.sourceId === ontology.source?.id)
  );
  const displayName = canonical?.name ?? selected.name;
  const canonicalCount = ontology.canonicalConcepts.length || ontology.entities.length;
  const groups = groupedFields(selected.attributes);
  const tableName = selected.technicalName || selected.name;

  return (
    <section className="schema-explorer" aria-labelledby="catalog-title">
      <div className="panel-heading">
        <div className="panel-heading-copy">
          <span className="panel-eyebrow"><ScanSearch size={12} /> Interpretación automática</span>
          <h2 id="catalog-title">Así entiende Nuudo tu empresa</h2>
          <p>Explora los conceptos traducidos y comprueba de dónde salió cada interpretación.</p>
        </div>
        <div className="panel-heading-meta">
          <span className="stat-chip">{canonicalCount} conceptos</span>
          <span className="stat-chip">{ontology.relations.length} relaciones</span>
          <span className="stat-chip figure">{Math.round(ontology.metadata.totalConfidence * 100)}% lectura global</span>
        </div>
      </div>

      {ontology.drift?.previousFingerprint ? (
        ontology.drift.detected ? (
          <details className={`drift-panel impact-${ontology.drift.impact}`} open={ontology.drift.impact === "high"}>
            <summary>
              <span className="drift-icon"><TriangleAlert size={15} /></span>
              <span>
                <strong>Drift detectado en {ontology.source?.name ?? ontology.drift.sourceId}</strong>
                <small>
                  {ontology.drift.summary.breaking} cambios incompatibles · {ontology.drift.affectedConceptIds.length} conceptos afectados · {impactedObjects.length} objetos de negocio
                </small>
              </span>
              <em>Impacto {driftImpactLabel(ontology.drift.impact)}</em>
            </summary>
            <div className="drift-detail">
              <div className="drift-stats">
                <span><strong>+{ontology.drift.summary.added}</strong> añadidos</span>
                <span><strong>−{ontology.drift.summary.removed}</strong> eliminados</span>
                <span><strong>{ontology.drift.summary.changed}</strong> modificados</span>
                <span><strong>{ontology.drift.summary.breaking}</strong> incompatibles</span>
              </div>
              <ul className="drift-changes">
                {ontology.drift.changes.map((change) => (
                  <li key={change.id}>
                    <span className={`drift-operation ${change.operation}`}>{driftOperationLabel(change.operation)}</span>
                    <div>
                      <strong>{change.label}</strong>
                      <code>{driftDelta(change.before, change.after) || change.path}</code>
                    </div>
                    <small>{change.breaking ? "Incompatible" : "Compatible"}</small>
                  </li>
                ))}
              </ul>
              {impactedObjects.length ? (
                <div className="drift-objects">
                  <strong>Conocimiento de negocio afectado</strong>
                  <p>{impactedObjects.map((item) => item.document.name).join(" · ")}</p>
                </div>
              ) : null}
            </div>
          </details>
        ) : (
          <div className="drift-clean">
            <GitCompareArrows size={14} />
            <span><strong>Sin drift estructural</strong> No hay cambios físicos relevantes frente a la versión anterior de esta fuente.</span>
          </div>
        )
      ) : null}

      <div className="schema-body">
        <nav className="concept-list" aria-label="Conceptos detectados">
          <div className="concept-list-heading">
            <p className="concept-list-label">Conceptos encontrados</p>
            <span>{ontology.entities.length}</span>
          </div>
          {ontology.entities.map((entity) => {
            const active = entity.id === selected.id;
            const needsReview = entity.confidence < 0.9;
            const entityConcept = ontology.canonicalConcepts.find((concept) =>
              concept.bindings.some((binding) => binding.entityId === entity.id && binding.sourceId === ontology.source?.id)
            );
            const bindingCount = entityConcept?.bindings.length ?? 1;
            return (
              <button
                key={entity.id}
                type="button"
                className={`concept-item ${active ? "active" : ""}`}
                onClick={() => onSelect(entity.id)}
                aria-current={active ? "true" : undefined}
              >
                <span className="concept-icon">{entity.type === "table" ? <Table2 size={15} /> : <Database size={15} />}</span>
                <span className="concept-copy">
                  <strong>{entityConcept?.name ?? entity.name}</strong>
                  <small>{entity.attributes.length} {entity.attributes.length === 1 ? "dato" : "datos"} · {bindingCount} {bindingCount === 1 ? "fuente" : "fuentes"}</small>
                </span>
                <span className={`concept-state ${needsReview ? "needs-review" : "clear"}`}>
                  {needsReview ? "Revisar" : <><CheckCircle2 size={11} /> Claro</>}
                </span>
              </button>
            );
          })}
        </nav>

        <article className="concept-detail">
          <header className="concept-hero">
            <span className="concept-kicker">Significado propuesto</span>
            <h3>{displayName}</h3>
            <p className="concept-story">{selected.description || conceptStory(selected.id, selected.attributes.length)}</p>
            <div className="concept-translation" aria-label="Traducción de la fuente al negocio">
              <div>
                <span>En la fuente</span>
                <code>{selected.schema ? `${selected.schema}.` : ""}{tableName}</code>
              </div>
              <span className="concept-translation-arrow"><ArrowRight size={15} /></span>
              <div>
                <span>Para el negocio</span>
                <strong>{displayName}</strong>
              </div>
              <span className="confidence-pill">{confidenceCopy(selected.confidence)} · {Math.round(selected.confidence * 100)}%</span>
            </div>
            {canonical ? (
              <div className="canonical-binding-note">
                <Layers3 size={12} />
                <span>Concepto canónico <code>{canonical.id}</code></span>
                <strong>{canonical.bindings.length} {canonical.bindings.length === 1 ? "binding" : "bindings"} de fuente</strong>
              </div>
            ) : null}
          </header>

          {groups.map((group) => (
            <section key={group.title} className="field-group">
              <div className="field-group-head">
                <h4>{group.title}</h4>
                <p>{group.hint}</p>
              </div>
              <ul className="field-cards">
                {group.items.map((attribute) => (
                  <li key={attribute.id}>
                    <div>
                      <strong>{attribute.name || fieldLabel(attribute.technicalName || "")}</strong>
                      <p>{attribute.description || humanLabel(attribute.semanticType || attribute.dataType)}</p>
                      <span className="field-tech"><Layers3 size={11} /> {attribute.technicalName || attribute.name}</span>
                    </div>
                    <div className="field-meta">
                      <span className={attribute.nullable ? "meta-chip" : "meta-chip required"}>{attribute.nullable ? t("catalog.nullable") : t("catalog.required")}</span>
                      <span className="confidence-pill">{Math.round(attribute.confidence * 100)}%</span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <section className="field-group">
            <div className="field-group-head">
              <h4>Cómo se conecta</h4>
              <p>Relaciones con otros conceptos. Pulsa uno para abrirlo.</p>
            </div>
            {related.length ? (
              <ul className="relation-stories">
                {related.map((relation) => {
                  const otherId = relation.from === selected.id ? relation.to : relation.from;
                  const otherName = names[otherId] || conceptLabel(otherId);
                  return (
                    <li key={relation.id}>
                      <button type="button" className="relation-card" onClick={() => onSelect(otherId)}>
                        <div className="relation-flow">
                          <span>{displayName}</span>
                          <ArrowRight size={14} />
                          <span>{otherName}</span>
                          <em>{cardinalityCopy(relation.cardinality)}</em>
                        </div>
                        <p>{relation.description || relationSentence(relation.from, relation.to, relation.cardinality, relation.foreignKey, selected.id)}</p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="muted-copy">Este concepto no tiene relaciones detectadas todavía.</p>
            )}
          </section>
        </article>
      </div>
    </section>
  );
}

function driftImpactLabel(impact: "none" | "low" | "medium" | "high") {
  if (impact === "high") return "alto";
  if (impact === "medium") return "medio";
  if (impact === "low") return "bajo";
  return "nulo";
}

function driftOperationLabel(operation: "added" | "removed" | "changed") {
  if (operation === "added") return "Añadido";
  if (operation === "removed") return "Eliminado";
  return "Modificado";
}

function driftDelta(before?: Record<string, unknown> | null, after?: Record<string, unknown> | null) {
  if (!before || !after) return "";
  return Object.keys({ ...before, ...after })
    .filter((key) => before[key] !== after[key])
    .map((key) => `${key}: ${String(before[key])} → ${String(after[key])}`)
    .join(" · ");
}
