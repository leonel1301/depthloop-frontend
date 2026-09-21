"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Braces, CalendarDays, CheckCircle2, NotebookText, Plus, Trash2, X } from "lucide-react";
import { useI18n, noteCategoryLabel, NOTE_CATEGORY_VALUES } from "@/features/i18n";
import { AppHeader } from "./AppHeader";
import { contextApi, type BusinessHoliday, type BusinessNote } from "../services/contextApi";
import {
  semanticApi,
  type SemanticConcept,
  type SemanticKind,
  type SemanticRecord,
  type SemanticSpec,
} from "../services/semanticApi";

export function BusinessContextDesk() {
  const { t, locale } = useI18n();
  const dateLocale = locale === "en" ? "en" : "es";
  const [holidays, setHolidays] = useState<BusinessHoliday[]>([]);
  const [notes, setNotes] = useState<BusinessNote[]>([]);
  const [semanticObjects, setSemanticObjects] = useState<SemanticRecord[]>([]);
  const [concepts, setConcepts] = useState<SemanticConcept[]>([]);
  const [holidayOpen, setHolidayOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [holidayName, setHolidayName] = useState("");
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayRecurring, setHolidayRecurring] = useState(true);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteCategory, setNoteCategory] = useState<string>(NOTE_CATEGORY_VALUES[0]);
  const [noteDetail, setNoteDetail] = useState("");
  const [semanticOpen, setSemanticOpen] = useState(false);
  const [semanticKind, setSemanticKind] = useState<SemanticKind>("metric");
  const [semanticKey, setSemanticKey] = useState("");
  const [semanticName, setSemanticName] = useState("");
  const [semanticDescription, setSemanticDescription] = useState("");
  const [semanticConceptId, setSemanticConceptId] = useState("");
  const [metricExpression, setMetricExpression] = useState("");
  const [metricAggregation, setMetricAggregation] = useState<"sum" | "count" | "count_distinct" | "average" | "min" | "max" | "ratio" | "custom">("sum");
  const [metricUnit, setMetricUnit] = useState("");
  const [ruleCondition, setRuleCondition] = useState("");
  const [ruleOutcome, setRuleOutcome] = useState("");
  const [ruleSeverity, setRuleSeverity] = useState<"info" | "warning" | "critical">("warning");
  const [definitionAliases, setDefinitionAliases] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([contextApi.load(), semanticApi.listObjects(), semanticApi.listConcepts()])
      .then(([payload, objects, conceptPayload]) => {
        if (cancelled) return;
        setHolidays(payload.holidays);
        setNotes(payload.notes);
        setSemanticObjects(objects);
        setConcepts(conceptPayload.concepts);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : t("business.loadError"));
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  const addHoliday = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const created = await contextApi.addHoliday({
        name: holidayName.trim(),
        date: holidayDate,
        recurring: holidayRecurring,
      });
      setHolidays((current) => [...current, created]);
      setHolidayName("");
      setHolidayDate("");
      setHolidayRecurring(true);
      setHolidayOpen(false);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : t("business.saveHolidayError"));
    } finally {
      setBusy(false);
    }
  };

  const addNote = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const created = await contextApi.addNote({
        title: noteTitle.trim(),
        category: noteCategory,
        detail: noteDetail.trim(),
      });
      setNotes((current) => [...current, created]);
      setNoteTitle("");
      setNoteCategory(NOTE_CATEGORY_VALUES[0]);
      setNoteDetail("");
      setNoteOpen(false);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : t("business.saveNoteError"));
    } finally {
      setBusy(false);
    }
  };

  const removeHoliday = async (id: string) => {
    setError(null);
    try {
      await contextApi.removeHoliday(id);
      setHolidays((current) => current.filter((item) => item.id !== id));
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : t("business.deleteHolidayError"));
    }
  };

  const removeNote = async (id: string) => {
    setError(null);
    try {
      await contextApi.removeNote(id);
      setNotes((current) => current.filter((item) => item.id !== id));
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : t("business.deleteNoteError"));
    }
  };

  const resetSemanticForm = () => {
    setSemanticKey("");
    setSemanticName("");
    setSemanticDescription("");
    setSemanticConceptId("");
    setMetricExpression("");
    setMetricAggregation("sum");
    setMetricUnit("");
    setRuleCondition("");
    setRuleOutcome("");
    setRuleSeverity("warning");
    setDefinitionAliases("");
  };

  const addSemanticObject = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const base = {
      key: semanticKey.trim(),
      name: semanticName.trim(),
      description: semanticDescription.trim(),
      conceptId: semanticConceptId || null,
      owner: null,
      status: "active" as const,
    };
    let payload: SemanticSpec;
    if (semanticKind === "metric") {
      payload = {
        ...base,
        kind: "metric",
        expression: metricExpression.trim(),
        aggregation: metricAggregation,
        filters: [],
        dimensions: [],
        unit: metricUnit.trim() || null,
      };
    } else if (semanticKind === "rule") {
      payload = {
        ...base,
        kind: "rule",
        condition: ruleCondition.trim(),
        outcome: ruleOutcome.trim(),
        severity: ruleSeverity,
        exceptions: [],
      };
    } else {
      payload = {
        ...base,
        kind: "definition",
        aliases: splitList(definitionAliases),
      };
    }
    try {
      const created = await semanticApi.saveObject(payload);
      setSemanticObjects((current) => [
        ...current.filter((item) => item.id !== created.id),
        created,
      ]);
      resetSemanticForm();
      setSemanticOpen(false);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : t("business.saveSemanticError"));
    } finally {
      setBusy(false);
    }
  };

  const removeSemanticObject = async (id: string) => {
    setError(null);
    try {
      await semanticApi.removeObject(id);
      setSemanticObjects((current) => current.filter((item) => item.id !== id));
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : t("business.deleteSemanticError"));
    }
  };

  return (
    <main className="app-shell business-shell">
      <AppHeader currentStep={2} />

      <section className="business-page">
        <header className="business-hero">
          <div>
            <span className="business-optional">{t("business.optional")}</span>
            <h1>{t("business.title")}</h1>
            <p>{t("business.lead")}</p>
          </div>
          <div className="business-summary" aria-label={t("business.summary")}>
            <span><strong>{holidays.length}</strong> {t("business.holidaysCount")}</span>
            <span><strong>{notes.length}</strong> {t("business.notesCount")}</span>
            <span><strong>{semanticObjects.length}</strong> {t("business.semanticCount")}</span>
          </div>
        </header>

        <div className="business-info-banner">
          <CheckCircle2 size={16} />
          <div>
            <strong>{t("business.inferReady")}</strong>
            <p>{t("business.inferCopy")}</p>
          </div>
          <Link href="/setup/tools">{t("business.goTools")} <ArrowRight size={14} /></Link>
        </div>

        {error ? <p className="form-error" role="alert">{error}</p> : null}

        <div className="business-grid">
          <section className="business-card">
            <header className="business-card-head">
              <span><CalendarDays size={17} /></span>
              <div>
                <h2>{t("business.holidaysTitle")}</h2>
                <p>{t("business.holidaysCopy")}</p>
              </div>
              {!holidayOpen ? (
                <button type="button" className="business-add-button" onClick={() => setHolidayOpen(true)}>
                  <Plus size={14} /> {t("common.add")}
                </button>
              ) : null}
            </header>

            {holidayOpen ? (
              <form className="business-inline-form" onSubmit={addHoliday}>
                <div className="business-form-title">
                  <strong>{t("business.newHoliday")}</strong>
                  <button type="button" onClick={() => setHolidayOpen(false)} aria-label={t("common.close")}><X size={15} /></button>
                </div>
                <label>
                  {t("business.name")}
                  <input value={holidayName} onChange={(event) => setHolidayName(event.target.value)} placeholder={t("business.holidayPlaceholder")} autoFocus required />
                </label>
                <label>
                  {t("business.date")}
                  <input type="date" value={holidayDate} onChange={(event) => setHolidayDate(event.target.value)} required />
                </label>
                <label className="business-check">
                  <input type="checkbox" checked={holidayRecurring} onChange={(event) => setHolidayRecurring(event.target.checked)} />
                  {t("business.recurring")}
                </label>
                <div className="business-form-actions">
                  <button type="button" className="ghost-button" onClick={() => setHolidayOpen(false)}>{t("common.cancel")}</button>
                  <button type="submit" className="primary-button" disabled={busy}>{t("business.addHoliday")}</button>
                </div>
              </form>
            ) : null}

            {holidays.length ? (
              <ul className="business-items">
                {holidays.map((holiday) => (
                  <li key={holiday.id}>
                    <span className="business-date-mark">
                      <strong>{formatDatePart(holiday.date, "day", dateLocale)}</strong>
                      <small>{formatDatePart(holiday.date, "month", dateLocale)}</small>
                    </span>
                    <div>
                      <strong>{holiday.name}</strong>
                      <small>{formatHolidayDate(holiday.date, dateLocale)}{holiday.recurring ? ` · ${t("business.everyYear")}` : ""}</small>
                    </div>
                    <button type="button" onClick={() => void removeHoliday(holiday.id)} aria-label={`${t("common.delete")} ${holiday.name}`}>
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : holidayOpen ? null : (
              <div className="business-empty">
                <span><CalendarDays size={18} /></span>
                <strong>{t("business.holidaysEmptyTitle")}</strong>
                <p>{t("business.holidaysEmptyCopy")}</p>
              </div>
            )}
          </section>

          <section className="business-card">
            <header className="business-card-head">
              <span><NotebookText size={17} /></span>
              <div>
                <h2>{t("business.notesTitle")}</h2>
                <p>{t("business.notesCopy")}</p>
              </div>
              {!noteOpen ? (
                <button type="button" className="business-add-button" onClick={() => setNoteOpen(true)}>
                  <Plus size={14} /> {t("common.add")}
                </button>
              ) : null}
            </header>

            {noteOpen ? (
              <form className="business-inline-form" onSubmit={addNote}>
                <div className="business-form-title">
                  <strong>{t("business.newNote")}</strong>
                  <button type="button" onClick={() => setNoteOpen(false)} aria-label={t("common.close")}><X size={15} /></button>
                </div>
                <label>
                  {t("business.noteTitle")}
                  <input value={noteTitle} onChange={(event) => setNoteTitle(event.target.value)} placeholder={t("business.notePlaceholder")} autoFocus required />
                </label>
                <label>
                  {t("business.type")}
                  <select value={noteCategory} onChange={(event) => setNoteCategory(event.target.value)}>
                    {NOTE_CATEGORY_VALUES.map((category) => (
                      <option key={category} value={category}>{noteCategoryLabel(locale, category)}</option>
                    ))}
                  </select>
                </label>
                <label>
                  {t("business.detail")}
                  <textarea value={noteDetail} onChange={(event) => setNoteDetail(event.target.value)} placeholder={t("business.detailPlaceholder")} rows={4} required />
                </label>
                <div className="business-form-actions">
                  <button type="button" className="ghost-button" onClick={() => setNoteOpen(false)}>{t("common.cancel")}</button>
                  <button type="submit" className="primary-button" disabled={busy}>{t("business.addNote")}</button>
                </div>
              </form>
            ) : null}

            {notes.length ? (
              <ul className="business-items notes">
                {notes.map((note) => (
                  <li key={note.id}>
                    <div>
                      <span>{noteCategoryLabel(locale, note.category)}</span>
                      <strong>{note.title}</strong>
                      <p>{note.detail}</p>
                    </div>
                    <button type="button" onClick={() => void removeNote(note.id)} aria-label={`${t("common.delete")} ${note.title}`}>
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : noteOpen ? null : (
              <div className="business-empty">
                <span><NotebookText size={18} /></span>
                <strong>{t("business.notesEmptyTitle")}</strong>
                <p>{t("business.notesEmptyCopy")}</p>
              </div>
            )}
          </section>

          <section className="business-card business-semantic-card">
            <header className="business-card-head">
              <span><Braces size={17} /></span>
              <div>
                <h2>{t("business.semanticTitle")}</h2>
                <p>{t("business.semanticCopy")}</p>
              </div>
              {!semanticOpen ? (
                <button type="button" className="business-add-button" onClick={() => setSemanticOpen(true)}>
                  <Plus size={14} /> {t("common.add")}
                </button>
              ) : null}
            </header>

            {semanticOpen ? (
              <form className="business-inline-form semantic-form" onSubmit={addSemanticObject}>
                <div className="business-form-title">
                  <strong>{t("business.newSemantic")}</strong>
                  <button type="button" onClick={() => setSemanticOpen(false)} aria-label={t("common.close")}><X size={15} /></button>
                </div>
                <div className="semantic-form-grid">
                  <label>
                    {t("business.objectType")}
                    <select value={semanticKind} onChange={(event) => setSemanticKind(event.target.value as SemanticKind)}>
                      <option value="metric">{t("business.metric")}</option>
                      <option value="rule">{t("business.rule")}</option>
                      <option value="definition">{t("business.definition")}</option>
                    </select>
                  </label>
                  <label>
                    {t("business.objectKey")}
                    <input value={semanticKey} onChange={(event) => setSemanticKey(event.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, "-"))} placeholder={t("business.objectKeyPlaceholder")} required />
                  </label>
                  <label>
                    {t("business.name")}
                    <input value={semanticName} onChange={(event) => setSemanticName(event.target.value)} placeholder={t("business.semanticNamePlaceholder")} autoFocus required />
                  </label>
                  <label>
                    {t("business.canonicalConcept")}
                    <select value={semanticConceptId} onChange={(event) => setSemanticConceptId(event.target.value)}>
                      <option value="">{t("business.noConcept")}</option>
                      {concepts.map((concept) => (
                        <option key={concept.id} value={concept.id}>{concept.name} · {concept.bindings.length} {t("business.bindings")}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label>
                  {t("business.description")}
                  <textarea value={semanticDescription} onChange={(event) => setSemanticDescription(event.target.value)} placeholder={t("business.semanticDescriptionPlaceholder")} rows={3} required />
                </label>

                {semanticKind === "metric" ? (
                  <div className="semantic-form-grid">
                    <label>
                      {t("business.aggregation")}
                      <select value={metricAggregation} onChange={(event) => setMetricAggregation(event.target.value as typeof metricAggregation)}>
                        {(["sum", "count", "count_distinct", "average", "min", "max", "ratio", "custom"] as const).map((value) => <option key={value} value={value}>{value}</option>)}
                      </select>
                    </label>
                    <label>
                      {t("business.unit")}
                      <input value={metricUnit} onChange={(event) => setMetricUnit(event.target.value)} placeholder="PEN, %, horas" />
                    </label>
                    <label className="semantic-wide-field">
                      {t("business.expression")}
                      <input value={metricExpression} onChange={(event) => setMetricExpression(event.target.value)} placeholder="SUM(total_amount)" required />
                    </label>
                  </div>
                ) : null}

                {semanticKind === "rule" ? (
                  <div className="semantic-form-grid">
                    <label>
                      {t("business.severity")}
                      <select value={ruleSeverity} onChange={(event) => setRuleSeverity(event.target.value as typeof ruleSeverity)}>
                        <option value="info">Info</option>
                        <option value="warning">Warning</option>
                        <option value="critical">Critical</option>
                      </select>
                    </label>
                    <label className="semantic-wide-field">
                      {t("business.condition")}
                      <input value={ruleCondition} onChange={(event) => setRuleCondition(event.target.value)} placeholder="status = 'confirmed'" required />
                    </label>
                    <label className="semantic-wide-field">
                      {t("business.outcome")}
                      <input value={ruleOutcome} onChange={(event) => setRuleOutcome(event.target.value)} placeholder={t("business.outcomePlaceholder")} required />
                    </label>
                  </div>
                ) : null}

                {semanticKind === "definition" ? (
                  <label>
                    {t("business.aliases")}
                    <input value={definitionAliases} onChange={(event) => setDefinitionAliases(event.target.value)} placeholder={t("business.aliasesPlaceholder")} />
                  </label>
                ) : null}

                <div className="business-form-actions">
                  <button type="button" className="ghost-button" onClick={() => setSemanticOpen(false)}>{t("common.cancel")}</button>
                  <button type="submit" className="primary-button" disabled={busy}>{t("business.addSemantic")}</button>
                </div>
              </form>
            ) : null}

            {semanticObjects.length ? (
              <ul className="semantic-items">
                {semanticObjects.map((item) => {
                  const concept = concepts.find((candidate) => candidate.id === item.document.conceptId);
                  return (
                    <li key={item.id}>
                      <span className={`semantic-kind semantic-kind-${item.document.kind}`}>{semanticKindLabel(item.document.kind, t)}</span>
                      <div>
                        <strong>{item.document.name}</strong>
                        <p>{item.document.description}</p>
                        <small><code>{item.document.key}</code>{concept ? ` · ${concept.name}` : ""}</small>
                      </div>
                      <button type="button" onClick={() => void removeSemanticObject(item.id)} aria-label={`${t("common.delete")} ${item.document.name}`}>
                        <Trash2 size={14} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : semanticOpen ? null : (
              <div className="business-empty semantic-empty">
                <span><Braces size={18} /></span>
                <strong>{t("business.semanticEmptyTitle")}</strong>
                <p>{t("business.semanticEmptyCopy")}</p>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function splitList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function semanticKindLabel(kind: SemanticKind, t: ReturnType<typeof useI18n>["t"]) {
  if (kind === "metric") return t("business.metric");
  if (kind === "rule") return t("business.rule");
  return t("business.definition");
}

function asDate(value: string) {
  return new Date(`${value.slice(0, 10)}T12:00:00`);
}

function formatHolidayDate(value: string, locale: string) {
  return asDate(value).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
}

function formatDatePart(value: string, part: "day" | "month", locale: string) {
  return asDate(value).toLocaleDateString(locale, part === "day" ? { day: "2-digit" } : { month: "short" }).replace(".", "");
}
