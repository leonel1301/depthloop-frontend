"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { UserRound, X } from "lucide-react";
import { CompanyForm } from "@/features/setup/components/CompanyForm";
import { useAuth } from "../hooks/useAuth";
import { initials } from "../services/sessionStore";

export function UserProfile({ compact = false }: { compact?: boolean }) {
  const { session, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={`user-profile-trigger ${compact ? "compact" : ""}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        title={session.user.email}
      >
        <span className="user-profile-avatar" aria-hidden="true">
          {compact ? initials(session.user.fullName) : <UserRound size={15} />}
        </span>
        {compact ? null : (
          <span className="user-profile-copy">
            <strong>{session.user.fullName}</strong>
            <small>{session.user.email}</small>
          </span>
        )}
      </button>
      {open && typeof document !== "undefined"
        ? createPortal(
            <div className="dialog-backdrop" onClick={() => setOpen(false)} role="presentation">
              <div
                className="dialog-card company-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="company-dialog-title"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="dialog-head">
                  <div>
                    <h2 id="company-dialog-title">Empresa</h2>
                    <p className="section-copy">Actualiza el logo y los datos del negocio.</p>
                  </div>
                  <button
                    ref={closeRef}
                    type="button"
                    className="icon-tool"
                    onClick={() => setOpen(false)}
                    aria-label="Cerrar"
                  >
                    <X size={16} />
                  </button>
                </div>
                <CompanyForm />
                <button type="button" className="ghost-button company-logout" onClick={logout}>
                  Cerrar sesión
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
