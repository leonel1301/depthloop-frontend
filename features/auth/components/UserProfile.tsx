"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { UserRound, X } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { initials } from "../services/sessionStore";

export function UserProfile({ compact = false }: { compact?: boolean }) {
  const { session, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const role = session.user.role === "member" ? "Miembro" : "Propietario";

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
                className="dialog-card profile-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="profile-dialog-title"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="dialog-head">
                  <div>
                    <h2 id="profile-dialog-title">Perfil</h2>
                    <p className="section-copy">Datos de tu cuenta.</p>
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
                <dl className="profile-details">
                  <div>
                    <dt>Nombre</dt>
                    <dd>{session.user.fullName}</dd>
                  </div>
                  <div>
                    <dt>Correo</dt>
                    <dd>{session.user.email}</dd>
                  </div>
                  <div>
                    <dt>Rol</dt>
                    <dd>{role}</dd>
                  </div>
                </dl>
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
