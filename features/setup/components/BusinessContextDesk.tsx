"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, NotebookText, Plus, Trash2, X } from "lucide-react";
import { AppHeader } from "./AppHeader";
import { contextApi, type BusinessHoliday, type BusinessNote } from "../services/contextApi";

const noteCategories = ["Regla interna", "Calendario", "Definición", "Excepción", "Otro"];

export function BusinessContextDesk() {
  const [holidays, setHolidays] = useState<BusinessHoliday[]>([]);
  const [notes, setNotes] = useState<BusinessNote[]>([]);
  const [holidayOpen, setHolidayOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [holidayName, setHolidayName] = useState("");
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayRecurring, setHolidayRecurring] = useState(true);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteCategory, setNoteCategory] = useState(noteCategories[0]);
  const [noteDetail, setNoteDetail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    contextApi
      .load()
      .then((payload) => {
        if (cancelled) return;
        setHolidays(payload.holidays);
        setNotes(payload.notes);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "No pudimos cargar el contexto.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
      setError(cause instanceof Error ? cause.message : "No pudimos guardar el feriado.");
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
      setNoteCategory(noteCategories[0]);
      setNoteDetail("");
      setNoteOpen(false);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "No pudimos guardar la información.");
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
      setError(cause instanceof Error ? cause.message : "No pudimos eliminar el feriado.");
    }
  };

  const removeNote = async (id: string) => {
    setError(null);
    try {
      await contextApi.removeNote(id);
      setNotes((current) => current.filter((item) => item.id !== id));
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "No pudimos eliminar la información.");
    }
  };

  return (
    <main className="app-shell business-shell">
      <AppHeader currentStep={2} />

      <section className="business-page">
        <header className="business-hero">
          <div>
            <span className="business-optional">Opcional</span>
            <h1>Contexto del negocio</h1>
            <p>Añade información propia de la empresa que no vive en tus fuentes de datos.</p>
          </div>
          <div className="business-summary" aria-label="Resumen del contexto">
            <span><strong>{holidays.length}</strong> feriados</span>
            <span><strong>{notes.length}</strong> notas</span>
          </div>
        </header>

        <div className="business-info-banner">
          <CheckCircle2 size={16} />
          <div>
            <strong>Inferir ya está disponible</strong>
            <p>Completar esta sección mejora el contexto, pero no bloquea el acceso al chat.</p>
          </div>
          <Link href="/">Ir a Inferir <ArrowRight size={14} /></Link>
        </div>

        {error ? <p className="form-error" role="alert">{error}</p> : null}

        <div className="business-grid">
          <section className="business-card">
            <header className="business-card-head">
              <span><CalendarDays size={17} /></span>
              <div>
                <h2>Feriados y fechas especiales</h2>
                <p>Días no laborables, cierres o eventos relevantes.</p>
              </div>
              {!holidayOpen ? (
                <button type="button" className="business-add-button" onClick={() => setHolidayOpen(true)}>
                  <Plus size={14} /> Añadir
                </button>
              ) : null}
            </header>

            {holidayOpen ? (
              <form className="business-inline-form" onSubmit={addHoliday}>
                <div className="business-form-title">
                  <strong>Nuevo feriado</strong>
                  <button type="button" onClick={() => setHolidayOpen(false)} aria-label="Cerrar"><X size={15} /></button>
                </div>
                <label>
                  Nombre
                  <input value={holidayName} onChange={(event) => setHolidayName(event.target.value)} placeholder="Ej. Aniversario de la empresa" autoFocus required />
                </label>
                <label>
                  Fecha
                  <input type="date" value={holidayDate} onChange={(event) => setHolidayDate(event.target.value)} required />
                </label>
                <label className="business-check">
                  <input type="checkbox" checked={holidayRecurring} onChange={(event) => setHolidayRecurring(event.target.checked)} />
                  Se repite cada año
                </label>
                <div className="business-form-actions">
                  <button type="button" className="ghost-button" onClick={() => setHolidayOpen(false)}>Cancelar</button>
                  <button type="submit" className="primary-button" disabled={busy}>Añadir feriado</button>
                </div>
              </form>
            ) : null}

            {holidays.length ? (
              <ul className="business-items">
                {holidays.map((holiday) => (
                  <li key={holiday.id}>
                    <span className="business-date-mark">
                      <strong>{formatDatePart(holiday.date, "day")}</strong>
                      <small>{formatDatePart(holiday.date, "month")}</small>
                    </span>
                    <div>
                      <strong>{holiday.name}</strong>
                      <small>{formatHolidayDate(holiday.date)}{holiday.recurring ? " · Cada año" : ""}</small>
                    </div>
                    <button type="button" onClick={() => void removeHoliday(holiday.id)} aria-label={`Eliminar ${holiday.name}`}>
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : holidayOpen ? null : (
              <div className="business-empty">
                <span><CalendarDays size={18} /></span>
                <strong>Aún no hay fechas añadidas</strong>
                <p>Registra los días que cambian la operación habitual.</p>
              </div>
            )}
          </section>

          <section className="business-card">
            <header className="business-card-head">
              <span><NotebookText size={17} /></span>
              <div>
                <h2>Información adicional</h2>
                <p>Reglas, definiciones y excepciones propias del negocio.</p>
              </div>
              {!noteOpen ? (
                <button type="button" className="business-add-button" onClick={() => setNoteOpen(true)}>
                  <Plus size={14} /> Añadir
                </button>
              ) : null}
            </header>

            {noteOpen ? (
              <form className="business-inline-form" onSubmit={addNote}>
                <div className="business-form-title">
                  <strong>Nueva información</strong>
                  <button type="button" onClick={() => setNoteOpen(false)} aria-label="Cerrar"><X size={15} /></button>
                </div>
                <label>
                  Título
                  <input value={noteTitle} onChange={(event) => setNoteTitle(event.target.value)} placeholder="Ej. Cierre mensual" autoFocus required />
                </label>
                <label>
                  Tipo
                  <select value={noteCategory} onChange={(event) => setNoteCategory(event.target.value)}>
                    {noteCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                  </select>
                </label>
                <label>
                  Detalle
                  <textarea value={noteDetail} onChange={(event) => setNoteDetail(event.target.value)} placeholder="Describe cómo funciona en tu empresa." rows={4} required />
                </label>
                <div className="business-form-actions">
                  <button type="button" className="ghost-button" onClick={() => setNoteOpen(false)}>Cancelar</button>
                  <button type="submit" className="primary-button" disabled={busy}>Añadir información</button>
                </div>
              </form>
            ) : null}

            {notes.length ? (
              <ul className="business-items notes">
                {notes.map((note) => (
                  <li key={note.id}>
                    <div>
                      <span>{note.category}</span>
                      <strong>{note.title}</strong>
                      <p>{note.detail}</p>
                    </div>
                    <button type="button" onClick={() => void removeNote(note.id)} aria-label={`Eliminar ${note.title}`}>
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : noteOpen ? null : (
              <div className="business-empty">
                <span><NotebookText size={18} /></span>
                <strong>Aún no hay información adicional</strong>
                <p>Añade solo aquello que ayude a entender mejor la empresa.</p>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function asDate(value: string) {
  return new Date(`${value.slice(0, 10)}T12:00:00`);
}

function formatHolidayDate(value: string) {
  return asDate(value).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" });
}

function formatDatePart(value: string, part: "day" | "month") {
  return asDate(value).toLocaleDateString("es", part === "day" ? { day: "2-digit" } : { month: "short" }).replace(".", "");
}
