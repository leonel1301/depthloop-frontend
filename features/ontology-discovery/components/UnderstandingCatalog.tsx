"use client";

import { ArrowRight, CheckCircle2, Database, Layers3, ScanSearch, Table2 } from "lucide-react";
import type { Attribute, OntologyDiscoveryResult } from "../models/ontology";
import { cardinalityCopy, conceptLabel, conceptStory, confidenceCopy, fieldGroup, fieldLabel, humanLabel, relationSentence } from "../services/labels";

type Props = {
  ontology: OntologyDiscoveryResult;
  selectedId?: string;
  onSelect: (id: string) => void;
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

export function UnderstandingCatalog({ ontology, selectedId, onSelect }: Props) {
  const selected = ontology.entities.find((entity) => entity.id === selectedId) ?? ontology.entities[0];
  if (!selected) return null;

  const names = Object.fromEntries(ontology.entities.map((entity) => [entity.id, entity.name]));
  const related = ontology.relations.filter((relation) => relation.from === selected.id || relation.to === selected.id);
  const displayName = selected.name;
  const groups = groupedFields(selected.attributes);
  const tableName = selected.technicalName || selected.name;

  return (
    <section className="schema-explorer" aria-labelledby="catalog-title">
      <div className="panel-heading">
        <div className="panel-heading-copy">
          <span className="panel-eyebrow"><ScanSearch size={12} /> Interpretación automática</span>
          <h2 id="catalog-title">Así entiende DepthLoop tu empresa</h2>
          <p>Explora los conceptos traducidos y comprueba de dónde salió cada interpretación.</p>
        </div>
        <div className="panel-heading-meta">
          <span className="stat-chip">{ontology.entities.length} conceptos</span>
          <span className="stat-chip">{ontology.relations.length} relaciones</span>
          <span className="stat-chip figure">{Math.round(ontology.metadata.totalConfidence * 100)}% lectura global</span>
        </div>
      </div>

      <div className="schema-body">
        <nav className="concept-list" aria-label="Conceptos detectados">
          <div className="concept-list-heading">
            <p className="concept-list-label">Conceptos encontrados</p>
            <span>{ontology.entities.length}</span>
          </div>
          {ontology.entities.map((entity) => {
            const active = entity.id === selected.id;
            const needsReview = entity.confidence < 0.9;
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
                  <strong>{entity.name}</strong>
                  <small>{entity.attributes.length} {entity.attributes.length === 1 ? "dato" : "datos"} conectados</small>
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
                      <span className={attribute.nullable ? "meta-chip" : "meta-chip required"}>{attribute.nullable ? "Puede faltar" : "Siempre viene"}</span>
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
